const ArtistService = require('../../service/ArtistService');

class ArtistController {
  static async getAll(req, res) {
    try {
      const artists = await ArtistService.getAll();
      res.json(artists);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
  static async create(req, res) {
    try {
      const artist = await ArtistService.create(req.body);
      res.status(201).json(artist);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
}

module.exports = ArtistController;
