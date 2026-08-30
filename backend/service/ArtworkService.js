const mongoose = require('mongoose');
const Artwork = require('../data/model/Artwork');

class ArtworkService {
  static async getAllArtworks() {
    return await Artwork.find()
      .populate('artists')
      .populate('copyOf')
      .populate('falsificationOf')
      .lean();
  }

  static async getArtworkById(id) {
    if (!id) return null;
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { qrCode: id }] };
    } else {
      query = { qrCode: id };
    }
    return await Artwork.findOne(query)
      .populate('artists')
      .populate('copyOf')
      .populate('falsificationOf')
      .populate('defaultItems')
      .lean();
  }

  static async createArtwork(artworkData) {
    const newArtwork = new Artwork(artworkData);
    return await newArtwork.save();
  }

  static async updateArtwork(id, updateData) {
    return await Artwork.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  static async deleteArtwork(id) {
    return await Artwork.findByIdAndDelete(id).lean();
  }
}

module.exports = ArtworkService;
