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
    const artwork = await Artwork.findOne(query)
      .populate('artists')
      .populate('copyOf')
      .populate('falsificationOf')
      .populate('defaultItems')
      .lean();

    if (artwork && !artwork.museum) {
      const Museum = require('../data/model/Museum');
      const museum = await Museum.findOne({ artworks: artwork._id }).lean();
      if (museum) {
        artwork.museum = museum._id.toString();
      }
    }

    if (artwork && (!artwork.assets?.images || artwork.assets.images.length === 0) && artwork.museum) {
      try {
        const UploadService = require('./UploadService');
        const fsImages = await UploadService.getArtworkImages({
          museumId: typeof artwork.museum === 'object' ? artwork.museum._id.toString() : artwork.museum.toString(),
          artworkId: artwork._id.toString()
        });
        if (fsImages && fsImages.length > 0) {
          artwork.assets = {
            images: fsImages.map(url => ({ url, orientation: 'landscape' }))
          };
        }
      } catch (e) {
        console.warn('[ArtworkService] Fallback scansione immagini filesystem non riuscita:', e.message);
      }
    }

    return artwork;
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
