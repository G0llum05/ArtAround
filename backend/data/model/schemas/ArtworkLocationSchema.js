const mongoose = require('mongoose');

const ArtworkLocationSchema = new mongoose.Schema({
  room: String,
  floor: String,
  building: String
}, { _id: false });

module.exports = ArtworkLocationSchema;
