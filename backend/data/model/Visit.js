const mongoose = require('mongoose');
const ScheduleSchema = require('./schemas/VisitingHoursSchema');


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
  
  artworks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
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

  isActive: Boolean,

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
  weeklySchedule: [ScheduleSchema],

  disableFriendly: {
    type: Boolean
  },
  
  // Description of what we need for the visit
  requirements: {
    type: String
  }

});

module.exports = mongoose.model('Visit', visitSchema);
