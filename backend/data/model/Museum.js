const mongoose = require('mongoose');
const ScheduleSchema = require('./schemas/VisitingHoursSchema');
const SocialSchema = require('./schemas/SocialSchema');
const pointOfInterestSchema = require('./schemas/pointOfInterestSchema');


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

  // --- SERVIZI & INFRASTRUTTURE DEL MUSEO ---
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

  // --- ACCESSIBILITÀ & TARGET ---
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

  // --- MAPPATURA PUNTI DI INTERESSE PER NAVIGATOR ---
  pointsOfInterest: [pointOfInterestSchema],

  // --- PIANI DELLO SPAZIO ESPOSITIVO ---
  floors: [{
    level: Number,       // es. 0 per Piano Terra, 1 per Primo Piano, -1 per Seminterrato
    name: String,        // es. "Piano Terra", "Piano Nobile"
    description: String
  }],

  // --- TRASPORTI E PARCHEGGIO ---
  transportInfo: {
    publicTransport: String,
    parkingDetails: String
  },

  // --- MOSTRE TEMPORANEE ED EVENTI SPECIALI ---
  eventsAndExhibitions: {
    specialEvents: [String],
    temporaryExhibitions: [String]
  },

  // Requisiti generali per la visita
  requirements: {
    type: String
  }
}, { timestamps: true });

// Indice per le ricerche geografiche
museumSchema.index({ "address.city": 1 });

module.exports = mongoose.model('Museum', museumSchema);
