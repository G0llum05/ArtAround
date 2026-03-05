const mongoose = require('mongoose');

// assuming that llm will know general information about opera makers, we can add more specific fields to make it more detailed
const operaMakerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Opera' }],
    artisticCurrents: [String],
    followerOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OperaMaker' }],
    teacherOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OperaMaker' }]
});

module.exports = mongoose.model('OperaMaker', operaMakerSchema);
