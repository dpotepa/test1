import express from 'express';
import cors from 'cors';
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

const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

// Static uploads
app.use('/api/uploads', express.static(config.uploadDir));

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

// Socket.io
setupSocket(io);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
