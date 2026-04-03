import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/categories', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let sql = 'SELECT q.*, c.name as category_name FROM questions q JOIN categories c ON q.category_id = c.id WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (req.query.category) {
      sql += ` AND c.slug = $${idx++}`;
      params.push(req.query.category);
    }

    if (req.query.depth) {
      sql += ` AND q.depth_level = $${idx++}`;
      params.push(parseInt(req.query.depth as string, 10));
    }

    sql += ' ORDER BY q.id';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/random', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.query.sessionId;
    const count = parseInt(req.query.count as string, 10) || 3;

    let sql: string;
    let params: any[];

    if (sessionId) {
      sql = `
        SELECT q.*, c.name as category_name
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id NOT IN (
          SELECT question_id FROM rounds WHERE session_id = $1
        )
        ORDER BY RANDOM()
        LIMIT $2
      `;
      params = [sessionId, count];
    } else {
      sql = `
        SELECT q.*, c.name as category_name
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        ORDER BY RANDOM()
        LIMIT $1
      `;
      params = [count];
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Random questions error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
