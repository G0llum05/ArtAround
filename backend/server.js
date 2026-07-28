const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
// Microservices
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();

const passport = require('./config/passport');
app.use(passport.initialize());

const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const { loadRoutes } = require('./config/routerLoader');

// Gocker ti inietterà probabilmente la sua porta, altrimenti usa la 8000 in locale
const PORT = process.env.PORT || 8000;

// Se c'è DB_URI (es. da Docker) usa quella, altrimenti metti il percorso per Gocker/Locale
const MONGO_URI = process.env.DB_URI || 'mongodb://mongo_site252623:27017/site252623';

mongoose.connect(MONGO_URI, {
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASSWORD,
})
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit();
  });

app.use(express.json());


const nodeMode = process.env.NODE_ENV || 'production';

if (nodeMode !== 'production') {
  // In sviluppo, abilitiamo CORS per le richieste da ng serve
  const options = {
    origin: 'http://localhost:4200'
  }
  app.use(cors(options));
} else {
  app.use(cors());
}

// --- 0. Documentazione Swagger / OpenAPI ---
const swaggerJsonPath = path.join(__dirname, 'swagger-output.json');
if (fs.existsSync(swaggerJsonPath)) {
  const swaggerDocument = require(swaggerJsonPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] UI disponibile all\'indirizzo: /api-docs');
}

// --- 1. Route API (Caricamento automatico di tutti i moduli in controller/) ---
loadRoutes(app);

// --- 2. Servire Angular (SOLO per Gocker / Produzione) ---
if (nodeMode === 'production') {
  const angularDistPath = path.join(__dirname, '../frontend/dist/bacheca-ui/browser');
  
  app.use(express.static(angularDistPath));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });
} 

// Serve static files from the frontend/public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const angularDistPath = path.join(__dirname, '../frontend/dist/bacheca-ui/browser');
  const fallbackPath = path.join(__dirname, '../frontend/dist/index.html');
  
  if (require('fs').existsSync(path.join(angularDistPath, 'index.html'))) {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  } else if (require('fs').existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
  } else {
    // Se non troviamo Angular built, serviamo un errore o lasciamo fare ad express.static
    next();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
});
