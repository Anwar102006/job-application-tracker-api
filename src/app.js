import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { env } from './config/env.js';
import { ApiResponse } from './utils/ApiResponse.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { mongoSanitize } from './middlewares/mongoSanitize.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import v1Router from './routes/v1/index.js';
import docsRoutes from './routes/v1/docs.routes.js';

const app = express();

// Trust Proxy Configuration
if (env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
} else if (env.TRUST_PROXY === 'false') {
  app.set('trust proxy', false);
} else if (!isNaN(Number(env.TRUST_PROXY))) {
  app.set('trust proxy', Number(env.TRUST_PROXY));
} else {
  app.set('trust proxy', env.TRUST_PROXY);
}

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));

// Request Parsing with safe limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL query injection protection
app.use(mongoSanitize);

// HTTP Parameter Pollution protection
app.use(hpp());

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

// API Documentation (Swagger UI & OpenAPI JSON Spec)
app.use('/api/v1/docs', docsRoutes);

// API v1 Routes
app.use('/api/v1', generalLimiter, v1Router);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;

