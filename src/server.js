import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      console.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const handleGracefulShutdown = async (signal) => {
  console.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  handleGracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server if this file is executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server, startServer };
