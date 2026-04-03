import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db';

interface AuthSocket extends Socket {
  userId?: number;
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
    console.log(`User ${socket.userId} connected`);

    socket.on('session:join', async ({ sessionId }: { sessionId: number }) => {
      try {
        // Verify user belongs to this session
        const session = await query(
          'SELECT * FROM sessions WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
          [sessionId, socket.userId]
        );
        if (session.rows.length === 0) return;

        const room = `session:${sessionId}`;
        socket.join(room);

        // Get user info
        const user = await query('SELECT id, display_name FROM users WHERE id = $1', [socket.userId]);

        // Notify others in the room
        socket.to(room).emit('session:partner-joined', {
          user: { id: user.rows[0].id, displayName: user.rows[0].display_name },
        });

        console.log(`User ${socket.userId} joined session ${sessionId}`);
      } catch (err) {
        console.error('session:join error:', err);
      }
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
      answerType: 'text' | 'photo' | 'video';
      text?: string;
      mediaUrl?: string;
    }) => {
      try {
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

        // Check how many answers this round has
        const answerCount = await query('SELECT COUNT(*) as count FROM answers WHERE round_id = $1', [roundId]);
        const count = parseInt(answerCount.rows[0].count, 10);

        const room = `session:${round.session_id}`;

        if (count >= 2) {
          // Both answered — reveal!
          await query("UPDATE rounds SET status = 'revealed' WHERE id = $1", [roundId]);

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
          // Only one answered — notify partner (no content!)
          socket.to(room).emit('round:partner-answered', { roundId });
        }
      } catch (err) {
        console.error('round:answer error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
