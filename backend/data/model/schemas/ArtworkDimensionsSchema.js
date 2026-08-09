const mongoose = require('mongoose');

const ArtworkDimensionsSchema = new mongoose.Schema({
    height: Number,
    width: Number,
    depth: Number,
    unit: String //unità di misura
}, { _id: false });

module.exports = ArtworkDimensionsSchema;
