const mongoose = require('mongoose');
const ImageSchema = require('./schemas/ImageSchemas');

// assuming that llm will know general information about artists, we can add more specific fields to make it more detailed
const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
  artisticCurrents: [String],
  followerOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  teacherOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  assets: {
    images: [ImageSchema]
  }
}, { timestamps: true });

module.exports = mongoose.model('Artist', artistSchema);
