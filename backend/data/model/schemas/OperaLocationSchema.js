const mongoose = require('mongoose');

const OperaLocationSchema = new mongoose.Schema({
  room: String,
  floor: String,
  building: String
}, { _id: false });

module.exports = OperaLocationSchema;
