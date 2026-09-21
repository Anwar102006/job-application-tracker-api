import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async (uri = env.MONGO_URI) => {
  try {
    const options = {
      maxPoolSize: env.DB_MAX_POOL_SIZE,
      minPoolSize: env.DB_MIN_POOL_SIZE,
      serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: env.DB_SOCKET_TIMEOUT_MS,
    };
    const conn = await mongoose.connect(uri, options);
    console.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.info('MongoDB disconnected');
  } catch (error) {
    console.error(`MongoDB disconnect error: ${error.message}`);
    throw error;
  }
};
