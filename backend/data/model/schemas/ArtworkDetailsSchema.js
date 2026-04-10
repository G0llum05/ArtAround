const mongoose = require('mongoose');

const ArtworkDetailsSchema = new mongoose.Schema({
  subjects: [String],
  colors: [String],
  places: [String],
  objectType: String,
  materials: [String],
  techniques: [String]
}, { _id: false });

module.exports = ArtworkDetailsSchema;
