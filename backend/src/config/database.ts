import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Setup connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info(`✅ MongoDB Atlas Connection Established: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB Atlas Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB Atlas Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB Atlas Reconnected successfully');
    });

    // Connect with optimal options for MongoDB Atlas & Cloud Hosting (Render, Railway, AWS, etc.)
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      autoIndex: env.NODE_ENV !== 'production',
    });

    logger.info(`🚀 MongoDB Atlas Connected to Cluster: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error: any) {
    logger.error(`❌ MongoDB Atlas Initial Connection Failed: ${error.message}`);
    if (env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Database connection failed in production. Exiting process...');
      process.exit(1);
    } else {
      logger.warn('⚠️ Running in local fallback mode. Please ensure network access to MongoDB Atlas (Whitelist IP 0.0.0.0/0 on Atlas).');
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Atlas Connection Closed gracefully');
  } catch (error: any) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};
