const mongoose = require('mongoose');

const studentAssignmentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: String,
    trim: true
  },
  isClaimed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentAssignment', studentAssignmentSchema);
