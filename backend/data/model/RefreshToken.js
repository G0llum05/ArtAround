const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
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
    required: true,
    expires: 0
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

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
