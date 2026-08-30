const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0
  },
  explanation: {
    type: String,
    trim: true
  },
  relatedArtwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true,
    index: true
  },
  museum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  targetAge: {
    type: String,
    enum: ['bambino', 'studente', 'adulto', 'specialista'],
    default: 'studente'
  },
  language: {
    type: String,
    default: 'it'
  },
  questions: [quizQuestionSchema],
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
