const mongoose = require('mongoose');

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
        enum: ['guest', 'student', 'teacher', 'museumstaff', 'admin'],  // Abbiamo definito anche il ruolo 'admin' per eventuali funzionalità future
        default: 'guest',
        required: true
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
    }
});

module.exports = mongoose.model('User', userSchema);
