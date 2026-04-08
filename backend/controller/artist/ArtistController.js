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
  static async getById(req, res) {
    try {
      const artist = await ArtistService.getById(req.params.id);
      if (!artist) {
        return res.status(404).json({ message: 'Artist not found' });
      }
      res.json(artist);
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
  static async update(req, res) {
    try {
      const updatedArtist = await ArtistService.update(req.params.id, req.body);
      if (!updatedArtist) {
        return res.status(404).json({ message: 'Artist not found' });
      }
      res.json(updatedArtist);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  static async delete(req, res) {
    try {
      const deletedArtist = await ArtistService.delete(req.params.id);
      if (!deletedArtist) {
        return res.status(404).json({ message: 'Artist not found' });
      }
      res.json({ message: 'Artist deleted' });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
}

module.exports = ArtistController;
