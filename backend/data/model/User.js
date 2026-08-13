const mongoose = require('mongoose');
const ImageSchema = require('./schemas/ImageSchemas');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  // verifica email
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  nOfEmailVerificationAttempts: {
    type: Number,
    default: 0
  },

  password: {
    type: String,
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['guest', 'student', 'teacher', 'museumstaff', 'admin'],
    default: 'guest',
    required: true
  },
  roleStatus: {
    type: String,
    enum: ['approved', 'pending'],
    default: 'approved'
  },
  requestedRole: {
    type: String,
    enum: ['teacher', 'museumstaff', null],
    default: null
  },
  // CHECK TODO: Se la visita vale come biglietto d'entrata allora l'acquisto delle visite deve avere un limite di data
  // altrimenti non c'è bisogno
  purchasedVisits: [{   // Per tenere traccia delle visite acquistate dall'utente 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],
  likedVisits: [{   // Per tenere traccia delle visite in cui l'utente ha messo like
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],
  // CHECK TODO: DA FARE tutta l'entità delle preferenze (lingua di default, notifiche, accessibilità, esigenze particolari)
  preferences: {
    type: Map,
    of: String
  },

  assets: {
    profilePicture: ImageSchema
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
