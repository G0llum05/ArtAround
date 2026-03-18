require('dotenv').config();
// Microservices
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();

const passport = require('./config/passport');
app.use(passport.initialize());

// Routes
const authRoutes = require('./controller/auth/AuthRouter');
const visitRoutes = require('./controller/visit/VisitRoutes');
const operaRoutes = require('./controller/opera/OperaRouter');
const userRoutes = require('./controller/user/UserRouter');

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

if (nodeMode === process.env.NODE_ENV) {
  // In sviluppo, abilitiamo CORS per le richieste da ng serve
  const options = {
    origin: 'http://localhost:4200'
  }
  app.use(cors(options));
} else {
  app.use(cors());
}

// --- 1. Route API (Funzionano sempre, sia in locale che su Gocker) ---
app.use('/api/auth', authRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/opera', operaRoutes);
app.use('/api/user', userRoutes);

// --- 2. Servire Angular (SOLO per Gocker / Produzione) ---
if (nodeMode === 'production') {
  const angularDistPath = path.join(__dirname, '../frontend/dist/bacheca-ui/browser');
  
  app.use(express.static(angularDistPath));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });
} 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
});
