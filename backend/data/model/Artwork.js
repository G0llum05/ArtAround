const mongoose = require('mongoose');
const ArtworkLocationSchema = require('./schemas/ArtworkLocationSchema');
const ArtworkDimensionsSchema = require('./schemas/ArtworkDimensionsSchema');
const ArtworkDetailsSchema = require('./schemas/ArtworkDetailsSchema');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
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
  isActive: Boolean,  
  description: String
});


module.exports = mongoose.model('Artwork', artworkSchema);
