import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db';

interface AuthSocket extends Socket {
  userId?: number;
}

// Map socket IDs to user IDs for presence tracking
const socketUserMap = new Map<string, number>();

function getUsersInRoom(io: Server, room: string): number[] {
  const socketIds = io.sockets.adapter.rooms.get(room);
  if (!socketIds) return [];
  const userIds = new Set<number>();
  for (const sid of socketIds) {
    const uid = socketUserMap.get(sid);
    if (uid) userIds.add(uid);
  }
  return [...userIds];
}

export function setupSocket(io: Server) {
  // Auth middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Brak tokenu autoryzacji'));
    }
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: number };
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Nieprawidłowy token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User ${socket.userId} connected (socket ${socket.id})`);
    socketUserMap.set(socket.id, socket.userId!);

    socket.on('session:join', async ({ sessionId }: { sessionId: number }) => {
      try {
        // Verify user belongs to this session (duo or party)
        const session = await query(
          `SELECT s.* FROM sessions s
           LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.user_id = $2
           WHERE s.id = $1 AND (s.user1_id = $2 OR s.user2_id = $2 OR sp.user_id IS NOT NULL)`,
          [sessionId, socket.userId]
        );
        if (session.rows.length === 0) return;

        const room = `session:${sessionId}`;
        socket.join(room);

        // Get user info
        const user = await query('SELECT id, display_name FROM users WHERE id = $1', [socket.userId]);

        // Tell the joining user about everyone already in the room
        const usersInRoom = getUsersInRoom(io, room).filter(uid => uid !== socket.userId);
        for (const uid of usersInRoom) {
          const partnerInfo = await query('SELECT id, display_name FROM users WHERE id = $1', [uid]);
          if (partnerInfo.rows.length > 0) {
            socket.emit('session:partner-joined', {
              user: { id: partnerInfo.rows[0].id, displayName: partnerInfo.rows[0].display_name },
            });
          }
        }

        // Notify others in the room about this user
        socket.to(room).emit('session:partner-joined', {
          user: { id: user.rows[0].id, displayName: user.rows[0].display_name },
        });

        // Update session status to active if both users are now present
        const sess = session.rows[0];
        if (sess.status === 'waiting' && sess.user2_id) {
          await query("UPDATE sessions SET status = 'active' WHERE id = $1", [sessionId]);
        }

        // Notify joining user about any active round
        const activeRound = await query(
          `SELECT r.*, q.text as question_text, q.depth_level, c.name as category_name
           FROM rounds r
           JOIN questions q ON r.question_id = q.id
           JOIN categories c ON q.category_id = c.id
           WHERE r.session_id = $1 AND r.status = 'answering'
           LIMIT 1`,
          [sessionId]
        );
        if (activeRound.rows.length > 0) {
          const ar = activeRound.rows[0];
          const myAnswer = await query(
            'SELECT id FROM answers WHERE round_id = $1 AND user_id = $2',
            [ar.id, socket.userId]
          );
          socket.emit('round:started', {
            round: { id: ar.id, sessionId: ar.session_id, status: ar.status, createdAt: ar.created_at },
            question: { id: ar.question_id, text: ar.question_text, category_name: ar.category_name, depth_level: ar.depth_level },
            alreadyAnswered: myAnswer.rows.length > 0,
          });
        }

        console.log(`User ${socket.userId} joined session ${sessionId}`);
      } catch (err) {
        console.error('session:join error:', err);
      }
    });

    socket.on('session:started', ({ sessionId }: { sessionId: number }) => {
      const room = `session:${sessionId}`;
      socket.to(room).emit('session:started');
    });

    socket.on('session:leave', ({ sessionId }: { sessionId: number }) => {
      const room = `session:${sessionId}`;
      socket.leave(room);
      socket.to(room).emit('session:partner-left', { userId: socket.userId });
    });

    socket.on('round:pick', async ({ sessionId, questionId }: { sessionId: number; questionId: number }) => {
      try {
        // Check if there's already an active round
        const activeRound = await query(
          "SELECT id FROM rounds WHERE session_id = $1 AND status = 'answering'",
          [sessionId]
        );
        if (activeRound.rows.length > 0) {
          socket.emit('error', { message: 'Jest już aktywna runda w tej sesji' });
          return;
        }

        // Fetch session for turn validation
        const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
        if (sessionResult.rows.length === 0) return;
        const sess = sessionResult.rows[0];

        // Count completed rounds to determine whose turn
        const completedRounds = await query(
          "SELECT COUNT(*) as count FROM rounds WHERE session_id = $1 AND status = 'revealed'",
          [sessionId]
        );
        const roundCount = parseInt(completedRounds.rows[0].count, 10);

        if (sess.mode === 'party') {
          const participantsRes = await query(
            'SELECT user_id FROM session_participants WHERE session_id = $1 ORDER BY joined_at',
            [sessionId]
          );
          const pIds = participantsRes.rows.map((r: any) => r.user_id);
          if (pIds.length > 0 && socket.userId !== pIds[roundCount % pIds.length]) {
            socket.emit('error', { message: 'Nie twoja kolej' });
            return;
          }
        } else {
          const userIds = [sess.user1_id, sess.user2_id].filter(Boolean);
          if (userIds.length >= 2 && socket.userId !== userIds[roundCount % userIds.length]) {
            socket.emit('error', { message: 'Nie twoja kolej' });
            return;
          }
        }

        // Create round
        const result = await query(
          'INSERT INTO rounds (session_id, question_id, picked_by) VALUES ($1, $2, $3) RETURNING *',
          [sessionId, questionId, socket.userId]
        );
        const round = result.rows[0];

        // Get question text
        const question = await query(
          'SELECT q.*, c.name as category_name FROM questions q JOIN categories c ON q.category_id = c.id WHERE q.id = $1',
          [questionId]
        );

        const room = `session:${sessionId}`;
        io.to(room).emit('round:started', {
          round: { id: round.id, sessionId: round.session_id, status: round.status, createdAt: round.created_at },
          question: question.rows[0],
        });
      } catch (err) {
        console.error('round:pick error:', err);
      }
    });

    socket.on('round:answer', async ({
      roundId,
      answerType,
      text,
      mediaUrl,
    }: {
      roundId: number;
      answerType: 'text' | 'photo' | 'video' | 'voice';
      text?: string;
      mediaUrl?: string;
    }) => {
      try {
        // Validate text length
        if (answerType === 'text' && text && text.length > 500) {
          socket.emit('error', { message: 'Odpowiedź tekstowa max 500 znaków' });
          return;
        }

        // Get round info
        const roundResult = await query('SELECT * FROM rounds WHERE id = $1', [roundId]);
        if (roundResult.rows.length === 0) return;
        const round = roundResult.rows[0];

        // Check user hasn't already answered
        const existing = await query(
          'SELECT id FROM answers WHERE round_id = $1 AND user_id = $2',
          [roundId, socket.userId]
        );
        if (existing.rows.length > 0) {
          socket.emit('error', { message: 'Już odpowiedziałeś na to pytanie' });
          return;
        }

        // Insert answer
        await query(
          'INSERT INTO answers (round_id, user_id, answer_type, text, media_url) VALUES ($1, $2, $3, $4, $5)',
          [roundId, socket.userId, answerType, text || null, mediaUrl || null]
        );

        // Get session to determine participant count
        const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [round.session_id]);
        const session = sessionResult.rows[0];

        // Count expected answers (for duo: 2, for party: count from session_participants)
        let expectedAnswers = 2;
        if (session.mode === 'party') {
          const participantCount = await query(
            'SELECT COUNT(*) as count FROM session_participants WHERE session_id = $1',
            [round.session_id]
          );
          expectedAnswers = parseInt(participantCount.rows[0].count, 10);
        }

        // Check how many answers this round has
        const answerCount = await query('SELECT COUNT(*) as count FROM answers WHERE round_id = $1', [roundId]);
        const count = parseInt(answerCount.rows[0].count, 10);

        const room = `session:${round.session_id}`;

        if (count >= expectedAnswers) {
          // All answered — reveal!
          await query("UPDATE rounds SET status = 'revealed' WHERE id = $1", [roundId]);

          // Count total revealed rounds (including this one) for turn calculation
          const revealedCount = await query(
            "SELECT COUNT(*) as count FROM rounds WHERE session_id = $1 AND status = 'revealed'",
            [round.session_id]
          );
          const totalRevealed = parseInt(revealedCount.rows[0].count, 10);

          const answers = await query(
            `SELECT a.*, u.display_name as user_name
            FROM answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.round_id = $1
            ORDER BY a.created_at`,
            [roundId]
          );

          io.to(room).emit('round:revealed', {
            roundId,
            roundCount: totalRevealed,
            answers: answers.rows.map((a: any) => ({
              userId: a.user_id,
              userName: a.user_name,
              answerType: a.answer_type,
              text: a.text,
              mediaUrl: a.media_url,
              createdAt: a.created_at,
            })),
          });
        } else {
          // Not everyone answered — notify others (no content!)
          socket.to(room).emit('round:partner-answered', {
            roundId,
            answeredCount: count,
            totalCount: expectedAnswers,
          });
        }
      } catch (err) {
        console.error('round:answer error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Notify all rooms this socket was in
      for (const room of socket.rooms) {
        if (room.startsWith('session:')) {
          socket.to(room).emit('session:partner-left', { userId: socket.userId });
        }
      }
      socketUserMap.delete(socket.id);
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
