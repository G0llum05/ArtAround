const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 // Sfrutta la scadenza TTL di MongoDB come nel tuo RefreshToken
  },
  attempts: {
    type: Number,
    default: 0 // Utile per bloccare tentativi di brute-force del codice a 6 cifre
  }
}, { timestamps: true });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);