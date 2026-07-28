const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    enum: ['infantile', 'simple', 'technical', 'scientific', 'medium', 'advanced', 'expert'],
    required: true
  },
  length: {
    type: Number,
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
