const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const visitRoutes = require('./controller/visit/visitRoutes');

const app = express();
// Gocker ti inietterà probabilmente la sua porta, altrimenti usa la 8000 in locale
const PORT = process.env.PORT || 8000;

// Se c'è DB_URI (es. da Docker) usa quella, altrimenti metti il percorso per Gocker/Locale
const MONGO_URI = process.env.DB_URI || 'mongodb://localhost:27017/site252623';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit();
  });

app.use(cors());
app.use(express.json());

// --- 1. Route API (Funzionano sempre, sia in locale che su Gocker) ---
app.use('/api/visits', visitRoutes);

// --- 2. Servire Angular (SOLO per Gocker / Produzione) ---
// Controlliamo se stiamo girando in produzione
if (process.env.NODE_ENV === 'production') {
  // Riprendiamo il tuo percorso originale!
  const angularDistPath = path.join(__dirname, '../frontend/dist/bacheca-ui/browser');
  
  app.use(express.static(angularDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
