const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  orientation: { type: String, enum: ['landscape', 'portrait', 'square'], required: true },
}, { _id: false });

module.exports = ImageSchema;
