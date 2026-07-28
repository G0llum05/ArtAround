const mongoose = require('mongoose');
const ArtworkLocationSchema = require('./schemas/ArtworkLocationSchema');
const ArtworkDimensionsSchema = require('./schemas/ArtworkDimensionsSchema');
const ArtworkDetailsSchema = require('./schemas/ArtworkDetailsSchema');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  // Attributi dell'opera
  startYear: Number,
  endYear: Number,
  artists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  }],
  location: ArtworkLocationSchema,
  dimensions: ArtworkDimensionsSchema,
  artisticCurrents: [String],
  details: ArtworkDetailsSchema,
  copyOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
  falsificationOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },

  isActive: Boolean,   // Se è in una mostra altrove o se è in restauro, non è attiva per la visita
  isPrivate: Boolean,  // Se è privata, es dall'insegnante, non visibile al pubblico 

  qrCode: {
    type: String,
    unique: true,
  },
  // CHECK TODO: da decidere copletamente la gestione delle immagini
  images: [String],

  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }]
});


module.exports = mongoose.model('Artwork', artworkSchema);
