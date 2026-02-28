const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // <-- AGGIUNTO: Necessario per gestire i percorsi delle cartelle
const visitRoutes = require('./controller/visit/visitRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = 'mongodb://mongodb:27017/ArtAroundDB';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit();
  });

// --- Middleware ---
app.use(cors()); // Abilita CORS per tutte le richieste
app.use(express.json()); // Permette al server di parsare il body delle richieste come JSON

// --- Definizione delle Route API ---
app.use('/api/visits', visitRoutes);

// --- Integrazione Frontend Angular ---

// 1. Diciamo a Express di servire i file statici compilati di Angular
// (Il nostro nuovo Dockerfile li metterà in una cartella chiamata 'public')
app.use(express.static(path.join(__dirname, 'public')));

// 2. Catch-all route: Qualsiasi altra richiesta (che non sia un'API come /api/visits)
// verrà reindirizzata all'index.html di Angular. Questo fa funzionare il routing interno del frontend.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Avvio del Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const visitRoutes = require('./controller/visit/visitRoutes');
//
// const app = express();
// const PORT = process.env.PORT || 3000;
//
// const MONGO_URI = 'mongodb://mongodb:27017/ArtAroundDB';
//
// mongoose.connect(MONGO_URI)
//   .then(() => console.log('Successfully connected to MongoDB.'))
//   .catch(err => {
//     console.error('Connection error', err);
//     process.exit();
//   });
//
// // --- Middleware ---
// app.use(cors()); // Abilita CORS per tutte le richieste
// app.use(express.json()); // Permette al server di parsare il body delle richieste come JSON
//
// // --- Definizione delle Route ---
// app.use('/api/visits', visitRoutes);
//
// app.get('/', (req, res) => {
//   res.send('ArtAround Backend is running!');
// });
//
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
