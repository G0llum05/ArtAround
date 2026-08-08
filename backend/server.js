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

function getMongoUri() {
  if (process.env.DB_URI) return process.env.DB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  const host = process.env.MONGO_HOST || '127.0.0.1';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DATABASE || 'site252623';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
  }
  return `mongodb://${host}:${port}/${db}`;
}

const MONGO_URI = getMongoUri();
const nodeEnv = process.env.NODE_ENV || 'production';

// --- Database Connection ---
const connectWithRetry = () => {
  mongoose.connect(MONGO_URI)
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

// Direct top-level /api/transcribe endpoint alias
const multer = require('multer');
const ramUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const NavigatorController = require('./controller/navigator/NavigatorController');
app.post('/api/transcribe', ramUpload.single('audio'), NavigatorController.transcribeAudio);

// --- Static Asset & Angular SPA Handlers ---
const angularDistPath = path.join(__dirname, '../frontend-old/dist/bacheca-ui/browser');
const fallbackDistPath = path.join(__dirname, '../frontend-old/dist/index.html');
const frontendPublicPath = path.join(__dirname, '../frontend-old/public');
const backendAssetsPath = path.join(__dirname, 'assets');

app.use('/assets', express.static(backendAssetsPath));
app.use(express.static(angularDistPath));
app.use(express.static(path.join(__dirname, '../frontend-old/dist')));
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
