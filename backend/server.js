const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// --- Definizione delle Route ---
app.use('/api/visits', visitRoutes);

app.get('/', (req, res) => {
  res.send('ArtAround Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
