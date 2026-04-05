import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { config } from './config';
import { setupSocket } from './socket/handler';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import questionRoutes from './routes/questions';
import answerRoutes from './routes/answers';
import uploadRoutes from './routes/uploads';

const app = express();
const server = http.createServer(app);

const corsOrigin = config.clientUrl || (process.env.NODE_ENV === 'production' ? false : true);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // handled by frontend framework
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// Static uploads — serve with nosniff to prevent MIME-type abuse
app.use('/api/uploads', (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'");
  next();
}, express.static(config.uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api', answerRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve built frontend in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Socket.io
setupSocket(io);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.port}`);
});
