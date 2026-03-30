const mongoose = require('mongoose');
const VisitingHoursSchema = require('./schemas/VisitingHoursSchema');


const visitSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String
  },

  price: {
    type: Number,
  },

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  operas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opera'
  }],

  // Duration in minutes
  minDuration: {
    type: Number,
    required: true
  },

  maxDuration: {
    type: Number,
    required: true
  },

  isActive: Bool,

  availability: {
    always: {
      type: Boolean
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
  },

  // Domenica = [0] -> Lunedi = [6]
  weeklySchedule: [scheduleSchema],

  disableFriendly: {
    type: Boolean
  },
  
  // Description of what we need for the visit
  requirements: {
    type: String
  }

});

module.exports = mongoose.model('Visit', visitSchema);
