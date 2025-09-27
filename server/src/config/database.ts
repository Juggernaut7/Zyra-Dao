import mongoose from 'mongoose';
import { logger } from '../utils/logger.ts';

const connectDB = async (): Promise<void> => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      logger.info(`MongoDB connection attempt ${attempt}/${maxRetries}...`);
      
      const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });

      return; // Success, exit the retry loop

    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        logger.error('Max retry attempts reached. Exiting...');
        process.exit(1);
      }
      
      logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

export default connectDB;
