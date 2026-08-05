const path = require('path');
// Attenzione al path del .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
// Attenzione al path dei config/
const { connectDB, closeDB } = require('./config/db');
const setupMiddlewares = require('./config/middleware');
const setupSwagger = require('./config/swaggerLoader');
const setupStaticAssets = require('./config/staticLoader');
const errorHandler = require('./config/errorHandler');
const { loadRoutes } = require('./config/routerLoader');

const app = express();
const PORT = process.env.PORT || 8000;
const nodeEnv = process.env.NODE_ENV || 'production';

// 1. Core & Security Middlewares (Helmet, CORS, Rate Limiter, JSON, CookieParser, Passport, Logging)
setupMiddlewares(app);

// 2. Swagger Documentation (/api-docs)
setupSwagger(app);

// 3. API Routes Auto-Loading (/api/*)
loadRoutes(app);

// 4. Static Assets & Angular SPA Fallback
setupStaticAssets(app);

// 5. Centralized Error Handler (Must be registered after all routes)
app.use(errorHandler);

// 6. Server Bootstrap & Lifecycle Management
let server;

async function startServer() {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${nodeEnv} mode`);
  });
}

startServer();

// Graceful Shutdown Handlers
const gracefulShutdown = async (signal) => {
  console.log(`[Server] ${signal} signal received. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closeDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
