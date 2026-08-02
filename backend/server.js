const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const passport = require('./config/passport');
const { loadRoutes } = require('./config/routerLoader');

const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.DB_URI || 'mongodb://mongo_site252623:27017/site252623';
const nodeEnv = process.env.NODE_ENV || 'production';

// --- Database Connection ---
const connectWithRetry = () => {
  const options = {};
  if (process.env.MONGO_USER) options.user = process.env.MONGO_USER;
  if (process.env.MONGO_PASSWORD) options.pass = process.env.MONGO_PASSWORD;

  mongoose.connect(MONGO_URI, options)
    .then(() => console.log('[MongoDB] Successfully connected.'))
    .catch(err => {
      console.error('[MongoDB] Connection error:', err.message, '- Retrying in 5s...');
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

const cookieParser = require('cookie-parser');

// --- Middlewares ---
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

if (nodeEnv !== 'production') {
  app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
} else {
  app.use(cors({ credentials: true }));
}

// --- Swagger Documentation ---
const swaggerJsonPath = path.join(__dirname, 'swagger-output.json');
if (fs.existsSync(swaggerJsonPath)) {
  const swaggerDocument = require(swaggerJsonPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] UI available at: /api-docs');
}

// --- API Routes (Auto-loaded from controller/ directory) ---
loadRoutes(app);

// --- Static Asset & Angular SPA Handlers ---
const angularDistPath = path.join(__dirname, '../frontend/dist/bacheca-ui/browser');
const fallbackDistPath = path.join(__dirname, '../frontend/dist/index.html');
const frontendPublicPath = path.join(__dirname, '../frontend/public');
const backendAssetsPath = path.join(__dirname, 'assets');

app.use('/assets', express.static(backendAssetsPath));
app.use(express.static(angularDistPath));
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.static(frontendPublicPath));

// Catch-all handler for Angular client-side routing (ignoring API & Swagger requests)
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  if (fs.existsSync(path.join(angularDistPath, 'index.html'))) {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  } else if (fs.existsSync(fallbackDistPath)) {
    res.sendFile(fallbackDistPath);
  } else {
    next();
  }
});

// --- Server Listener ---
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} in ${nodeEnv} mode`);
});
