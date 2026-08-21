import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocketServer } from './config/socket';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();
const server = http.createServer(app);

// Trust proxy for cloud hosting (Render, Railway, Heroku, Nginx, etc.)
app.set('trust proxy', 1);

// Initialize Socket.IO
initSocketServer(server);

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Allowed CORS origins
const allowedOrigins = [
  ...env.FRONTEND_URL.split(',').map((url) => url.trim()),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Allow configured origins in cloud hosting
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static directories for uploads and storage
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Root Health Check & Cloud Deployment Probe
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'DocuFlow AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: '/api/v1',
    database: mongoose.connection.readyState === 1 ? 'Connected (Atlas)' : 'Connecting / Degraded',
  });
});

app.get('/health', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'ok' : 'degraded',
    uptime: process.uptime(),
    dbState: isDbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
const PORT = parseInt(env.PORT, 10) || 5000;

connectDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 DocuFlow AI Backend running on port ${PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📡 API Endpoint: http://localhost:${PORT}/api/v1`);
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP Server closed.');
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

