const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    enum: ['infantile', 'simple', 'medium', 'advanced', 'technical'],
    required: true
  },
  length: {
    type: Number,
    required: true
  },
  // Autore opzionale legato all'User (ID) o nome testuale alternativo
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  authorName: {
    type: String,
    required: false
  },
  license: {
    type: String,
    default: 'Standard'
  },
  language: {
    type: String,
    default: 'it'
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
