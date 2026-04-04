import { Router, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex');
}

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const inviteCode = generateInviteCode();
    const mode = req.body.mode === 'party' ? 'party' : 'duo';
    const result = await query(
      'INSERT INTO sessions (invite_code, user1_id, status, mode) VALUES ($1, $2, $3, $4) RETURNING id, invite_code, status, mode, created_at',
      [inviteCode, req.userId, 'waiting', mode]
    );
    const session = result.rows[0];

    // For party mode, add creator as first participant
    if (mode === 'party') {
      await query(
        'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2)',
        [session.id, req.userId]
      );
    }

    res.status(201).json(session);
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/join/:inviteCode', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.params;

    const session = await query('SELECT * FROM sessions WHERE invite_code = $1', [inviteCode]);
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono sesji o tym kodzie' });
    }

    const s = session.rows[0];

    if (s.mode === 'party') {
      // Party mode — add to participants if not already there
      const existing = await query(
        'SELECT id FROM session_participants WHERE session_id = $1 AND user_id = $2',
        [s.id, req.userId]
      );
      if (existing.rows.length === 0) {
        await query(
          'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2)',
          [s.id, req.userId]
        );
      }
      const updated = await query('SELECT * FROM sessions WHERE id = $1', [s.id]);
      return res.json(updated.rows[0]);
    }

    // Duo mode
    if (s.user1_id === req.userId) {
      return res.json({ id: s.id, invite_code: s.invite_code, status: s.status });
    }

    if (s.user2_id && s.user2_id !== req.userId) {
      return res.status(400).json({ error: 'Sesja jest już pełna' });
    }

    if (!s.user2_id) {
      await query(
        'UPDATE sessions SET user2_id = $1, status = $2 WHERE id = $3',
        [req.userId, 'active', s.id]
      );
    }

    const updated = await query('SELECT * FROM sessions WHERE id = $1', [s.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Host starts a party game
router.post('/:id/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await query('SELECT * FROM sessions WHERE id = $1', [id]);
    if (session.rows.length === 0) return res.status(404).json({ error: 'Sesja nie znaleziona' });
    const s = session.rows[0];
    if (s.user1_id !== req.userId) return res.status(403).json({ error: 'Tylko host może rozpocząć grę' });
    if (s.mode !== 'party') return res.status(400).json({ error: 'Nie dotyczy trybu duo' });
    await query("UPDATE sessions SET status = 'active' WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT DISTINCT s.*,
        u1.display_name as user1_name,
        u2.display_name as user2_name
      FROM sessions s
      JOIN users u1 ON s.user1_id = u1.id
      LEFT JOIN users u2 ON s.user2_id = u2.id
      LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.user_id = $1
      WHERE s.user1_id = $1 OR s.user2_id = $1 OR sp.user_id IS NOT NULL
      ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT s.*,
        u1.display_name as user1_name, u1.username as user1_username,
        u2.display_name as user2_name, u2.username as user2_username
      FROM sessions s
      JOIN users u1 ON s.user1_id = u1.id
      LEFT JOIN users u2 ON s.user2_id = u2.id
      LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.user_id = $2
      WHERE s.id = $1 AND (s.user1_id = $2 OR s.user2_id = $2 OR sp.user_id IS NOT NULL)`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesja nie znaleziona' });
    }

    const sess = result.rows[0];

    // For party mode, include participant list
    if (sess.mode === 'party') {
      const participants = await query(
        `SELECT u.id, u.display_name, sp.joined_at
        FROM session_participants sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.session_id = $1
        ORDER BY sp.joined_at`,
        [sess.id]
      );
      sess.participants = participants.rows;
    }

    res.json(sess);
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
