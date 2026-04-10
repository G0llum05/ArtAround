const mongoose = require('mongoose');

const ArtworkDimensionsSchema = new mongoose.Schema({
    height: Number,
    width: Number,
    depth: Number,
    unit: String
}, { _id: false });

module.exports = ArtworkDimensionsSchema;
