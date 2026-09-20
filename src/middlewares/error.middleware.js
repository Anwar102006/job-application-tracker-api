import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
    error.isOperational = false;
  }

  const statusCode = error.statusCode || 500;
  const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

  const response = {
    success: false,
    statusCode,
    message: error.isOperational || isDev ? error.message : 'Internal Server Error',
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(isDev && { stack: error.stack }),
  };

  if (!error.isOperational && env.NODE_ENV !== 'test') {
    console.error('Unhandled Error:', err);
  }

  res.status(statusCode).json(response);
};
