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
        enum: ['guest', 'prof', 'museum', 'admin'],
        default: 'guest',
        required: true
    },
    likedVistis: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit'
    }]
});

module.exports = mongoose.model('User', userSchema);
