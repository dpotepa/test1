import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Nazwa użytkownika musi mieć 3-50 znaków' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' });
    }

    if (displayName.length > 30) {
      return res.status(400).json({ error: 'Imię może mieć maksymalnie 30 znaków' });
    }

    const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ta nazwa użytkownika jest już zajęta' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name',
      [username, passwordHash, displayName]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
    }

    const result = await query('SELECT id, username, display_name, password_hash FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length < 1) {
      return res.status(400).json({ error: 'Podaj swoje imię' });
    }

    if (displayName.trim().length > 30) {
      return res.status(400).json({ error: 'Imię może mieć maksymalnie 30 znaków' });
    }

    const guestUsername = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await query(
      'INSERT INTO users (username, display_name, is_guest) VALUES ($1, $2, true) RETURNING id, username, display_name',
      [guestUsername, displayName.trim()]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, username, display_name FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    const user = result.rows[0];
    res.json({ id: user.id, username: user.username, displayName: user.display_name });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
