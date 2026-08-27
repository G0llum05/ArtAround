const path = require('path');
// Attenzione al path del .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const http = require('http');
// Attenzione al path dei config/
const { connectDB, closeDB } = require('./config/db');
const setupMiddlewares = require('./config/middleware');
const setupSwagger = require('./config/swaggerLoader');
const setupStaticAssets = require('./config/staticLoader');
const errorHandler = require('./config/errorHandler');
const { loadRoutes } = require('./config/routerLoader');
const { initGroupVisitSocket } = require('./socket/GroupVisitSocket');

const app = express();
const server = http.createServer(app);

// Inizializza WebSocket / Socket.IO per visite guidate in tempo reale
initGroupVisitSocket(server);

// CHECK PORT VAR
const PORT = process.env.PORT || 8000;
const nodeEnv = process.env.NODE_ENV || 'production';

// L'ordine di ciò che viene registrato in Express è importante, perchè per ogni rotta Express farà proprio in quell'ordine i passaggi

setupMiddlewares(app);

setupSwagger(app);

loadRoutes(app);

setupStaticAssets(app);

app.use(errorHandler);

async function startServer() {
  // aspetta connessione al db
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${nodeEnv} mode`);
  });
}

startServer();

// per lo spegnimento forte, così vengono chiuse connessioni a db e server http prima di chiudere
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
