const mongoose = require('mongoose');
const ScheduleSchema = require('./schemas/VisitingHoursSchema');
const ImageSchema = require('./schemas/ImageSchemas');


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
    default: 0
  },

  license: {
    type: String,
    default: 'Standard'
  },

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  steps: [{
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    },
    // se non ci sono items si usano i defaultItems dell'opera, altrimenti si usano questi
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }],
    tellMeMore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }
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

  isVerified: {
    type: Boolean,
    default: false
  },

  disableFriendly: {
    type: Boolean
  },

  // Description of what we need for the visit
  requirements: {
    type: String
  },

  // Se il creatore della visita vuole mettere delle domande fatte da lui può farlo, altrimenti vengono generate
  // quiz: { 
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Quiz'
  // },
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],

  // Categorie tematiche (multiplo)
  categories: [{
    type: String
  }],

  // Interazioni & Popolarità
  likesCount: {
    type: Number,
    default: 0,
    index: true
  },

  views: {
    total: {
      type: Number,
      default: 0,
      index: true
    },
    weekly: {
      type: Number,
      default: 0,
      index: true
    }
  },

  assets: {
    images: [ImageSchema]
  }

}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
