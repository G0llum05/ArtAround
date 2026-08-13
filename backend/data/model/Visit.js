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

  // Items?
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

  // Categorie tematiche (multiplo)
  categories: [{
    type: String,
    enum: [
      'Rinascimento', 'Arte Moderna', 'Motori', 'Scienza', 'Archeologia',
      'Musica', 'Didattica', 'Antica Grecia', 'Antica Roma', 'Oriente',
      'Antico Egitto', 'Medioevo', 'Neoclassicismo', 'Impressionismo',
      'Realismo', 'Puntinismo', 'Avanguardie'
    ]
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
