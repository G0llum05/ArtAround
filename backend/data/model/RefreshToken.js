const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  replacedByToken: {
    type: String
  }
}, { timestamps: true });

// Metodo virtuale per verificare se il token è scaduto o revocato
refreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

refreshTokenSchema.virtual('isActive').get(function() {
  return !this.isRevoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
