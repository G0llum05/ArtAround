const mongoose = require('mongoose');
const VisitingHoursSchema = require('./schemas/VisitingHoursSchema');
const SocialSchema = require('./schemas/SocialSchema');

const museumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },

  // Indirizzo strutturato
  address: {
    street: String, // check in base all'api di suggerimento luogo
    city: { type: String, required: true },
    zipCode: String, //CAP
    country: { type: String, required: true }
  },
  // GeoJSON per mappe e ricerche "vicino a me"
  // location: {
  //   type: {
  //     type: String, 
  //     enum: ['Point'],
  //     default: 'Point'
  //   },
  //   coordinates: {
  //     type: [Number], // [longitudine, latitudine]
  //     required: true
  //   }
  // },
  // Contatti
  contact: {
    phone: String,
    email: String,
    website: String,
    social: SocialSchema,
  },

  maxCapacity: Number,
  actualCapacity: Number,
  // Media
  // images: [String], // URL delle immagini su S3/Cloudinary
  
  // Relazioni
  visits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],
  
  operas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opera'  
  }],
  // Orari generali del museo (riutilizzando la logica di prima)
  openingHours: [scheduleSchema],

  ticketInfo: {
    prices: [{
      planName: String,
      price: Number,
      target: String
    }],
    discountCode: [String]
  },
  
  isActive: Bool,

  disableFriendly: {
    type: Boolean
  },
  
  // Description of what we need for the visit
  requirements: {
    type: String
  }

});

// Indice per le ricerche geografiche
museumSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Museum', museumSchema);