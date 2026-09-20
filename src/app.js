import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { ApiResponse } from './utils/ApiResponse.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));

// Request Parsing with safe limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      { status: 'healthy', timestamp: new Date().toISOString() },
      'Job Application Tracker API is operational'
    )
  );
});

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
