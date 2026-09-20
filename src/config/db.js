import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async (uri = env.MONGO_URI) => {
  try {
    const conn = await mongoose.connect(uri);
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
