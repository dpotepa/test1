import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.wav', '.m4a', '.ogg', '.mp3']);
const ALLOWED_MIMES = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|audio\/(wav|mp4|mpeg|ogg|webm|x-m4a))$/;

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    const name = crypto.randomBytes(16).toString('hex') + safeExt;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('Niedozwolone rozszerzenie pliku'));
      return;
    }
    if (!ALLOWED_MIMES.test(file.mimetype)) {
      cb(new Error('Niedozwolony typ pliku'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Brak pliku' });
  }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;
