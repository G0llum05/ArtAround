const Artist = require('../data/model/Artist');

class ArtistService {
  static async getAll() {
    return await Artist.find()
      .populate('artworks')
      .lean();
  }

  static async getById(id) {
    return await Artist.findById(id)
      .populate('artworks')
      .lean();
  }
  
  static async create(data) {
    const artist = new Artist(data);
    return await artist.save();
  }

  static async update(id, data) {
    return await Artist.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    return await Artist.findByIdAndDelete(id);
  }
}

module.exports = ArtistService;

