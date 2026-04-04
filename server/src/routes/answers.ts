import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/sessions/:sessionId/rounds', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Verify user belongs to session (duo or party)
    const session = await query(
      `SELECT s.* FROM sessions s
       LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.user_id = $2
       WHERE s.id = $1 AND (s.user1_id = $2 OR s.user2_id = $2 OR sp.user_id IS NOT NULL)`,
      [sessionId, req.userId]
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Sesja nie znaleziona' });
    }

    const rounds = await query(
      `SELECT r.*, q.text as question_text, q.depth_level, c.name as category_name,
        u.display_name as picked_by_name
      FROM rounds r
      JOIN questions q ON r.question_id = q.id
      JOIN categories c ON q.category_id = c.id
      JOIN users u ON r.picked_by = u.id
      WHERE r.session_id = $1
      ORDER BY r.created_at DESC`,
      [sessionId]
    );

    // For revealed rounds, include answers
    const roundsWithAnswers = await Promise.all(
      rounds.rows.map(async (round: any) => {
        if (round.status === 'revealed') {
          const answers = await query(
            `SELECT a.*, u.display_name as user_name
            FROM answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.round_id = $1
            ORDER BY a.created_at`,
            [round.id]
          );
          return { ...round, answers: answers.rows };
        }
        return { ...round, answers: [] };
      })
    );

    res.json(roundsWithAnswers);
  } catch (err) {
    console.error('List rounds error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/rounds/:roundId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { roundId } = req.params;

    const round = await query(
      `SELECT r.*, q.text as question_text, q.depth_level, c.name as category_name
      FROM rounds r
      JOIN questions q ON r.question_id = q.id
      JOIN categories c ON q.category_id = c.id
      WHERE r.id = $1`,
      [roundId]
    );

    if (round.rows.length === 0) {
      return res.status(404).json({ error: 'Runda nie znaleziona' });
    }

    const r = round.rows[0];

    // Only return answers if revealed
    if (r.status === 'revealed') {
      const answers = await query(
        `SELECT a.*, u.display_name as user_name
        FROM answers a
        JOIN users u ON a.user_id = u.id
        WHERE a.round_id = $1
        ORDER BY a.created_at`,
        [roundId]
      );
      r.answers = answers.rows;
    } else {
      r.answers = [];
    }

    res.json(r);
  } catch (err) {
    console.error('Get round error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
