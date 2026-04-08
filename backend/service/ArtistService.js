const Artist = require('../data/model/Artist');

class ArtistService {
  static async getAll() {
    return await Artist.find().lean();
  }
  static async create(data) {
    const artist = new Artist(data);
    return await artist.save();
  }
}

module.exports = ArtistService;

