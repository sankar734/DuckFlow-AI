import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { env, validateProductionEnvironment } from './config/env';
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

// Build normalized Allowed CORS Origins list
const configuredOrigins = [
  ...env.FRONTEND_URL.split(','),
  ...env.CORS_ORIGINS.split(','),
]
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const allowedOriginsSet = new Set([...configuredOrigins, ...defaultDevOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests (mobile apps, Postman, server-to-server, curl)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.trim().replace(/\/+$/, '');

      // 2. Direct exact match
      if (allowedOriginsSet.has(cleanOrigin)) {
        return callback(null, true);
      }

      // 3. Allow Netlify & Vercel deploy previews or subdomains
      const isDeployPreview =
        /^https:\/\/[a-zA-Z0-9_-]+\.netlify\.app$/.test(cleanOrigin) ||
        /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin) ||
        /^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(cleanOrigin);

      if (isDeployPreview) {
        return callback(null, true);
      }

      // In non-production, be lenient for local testing
      if (env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      logger.warn(`[CORS] Request from disallowed origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Request-Id'],
  })
);

// Handle preflight OPTIONS requests across all routes
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Ensure storage and uploads directories exist
fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
fs.mkdirSync(path.join(process.cwd(), 'storage'), { recursive: true });

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

const handleHealthCheck = (req: express.Request, res: express.Response) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'ok' : 'degraded',
    uptime: process.uptime(),
    dbState: isDbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);
app.get('/api/v1/health', handleHealthCheck);

// API Routes (mounted under both /api and /api/v1)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
const PORT = parseInt(env.PORT, 10) || 5000;

connectDatabase().then(() => {
  validateProductionEnvironment();
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

