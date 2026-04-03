import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/questions_app',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  port: parseInt(process.env.PORT || '3001', 10),
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
