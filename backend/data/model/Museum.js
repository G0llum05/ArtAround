const mongoose = require('mongoose');
const ScheduleSchema = require('./schemas/VisitingHoursSchema');
const SocialSchema = require('./schemas/SocialSchema');
const pointOfInterestSchema = require('./schemas/pointOfInterestSchema');
const ImageSchema = require('./schemas/ImageSchemas');


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
    street: String,
    city: { type: String, required: true },
    zipCode: String,
    country: { type: String, required: true }
  },

  // Contatti
  contact: {
    phone: String,
    email: String,
    website: String,
    social: SocialSchema,
  },

  maxCapacity: Number,
  actualCapacity: Number,

  // Relazioni
  visits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],

  artworks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  }],

  // Orari generali del museo
  openingHours: [ScheduleSchema],

  ticketInfo: {
    prices: [{
      planName: String,
      price: Number,
      target: String
    }],
    discountCode: [String]
  },

  isActive: Boolean,

  // servizi & infrastrutture del museo
  services: {
    hasToilette: { type: Boolean, default: true },
    hasDisabledToilette: { type: Boolean, default: true },
    hasElevator: { type: Boolean, default: false },
    hasStairs: { type: Boolean, default: true },
    hasBar: { type: Boolean, default: false },
    hasRestaurant: { type: Boolean, default: false },
    hasShop: { type: Boolean, default: false },
    hasParking: { type: Boolean, default: false },
    hasAudioGuide: { type: Boolean, default: true },
    hasAirConditioning: { type: Boolean, default: true },
    hasHeating: { type: Boolean, default: true },
    hasWifi: { type: Boolean, default: true },
    hasGuidedTours: { type: Boolean, default: true },
    hasCloakroom: { type: Boolean, default: false }
  },

  // accessibilità & target
  accessibility: {
    disableFriendly: { type: Boolean, default: true },
    wheelchairAccessible: { type: Boolean, default: true },
    childFriendly: { type: Boolean, default: true },
    petFriendly: { type: Boolean, default: false },
    tactilePaths: { type: Boolean, default: false },
    brailleSignage: { type: Boolean, default: false },
    audioDescriptions: { type: Boolean, default: true },
    notes: String
  },

  // mappatura punti di interesse per navigator
  pointsOfInterest: [pointOfInterestSchema],

  // piani dello spazio espositivo
  floors: [{
    level: Number,       // 0, 1...
    name: String,        // piano terra, primo piano...
    description: String
  }],

  // trasporti e parcheggio
  transportInfo: {
    publicTransport: String,
    parkingDetails: String
  },

  // mostre temporanee ed eventi speciali
  eventsAndExhibitions: {
    specialEvents: [String],
    temporaryExhibitions: [String]
  },

  // Requisiti generali per la visita
  requirements: {
    type: String
  },

  assets: {
    images: [ImageSchema],
    map: ImageSchema
  }
}, { timestamps: true });

// Indice per le ricerche geografiche
museumSchema.index({ "address.city": 1 });

module.exports = mongoose.model('Museum', museumSchema);
