const MuseumService = require('../../service/MuseumService');

class MuseumController {
  static async getAll(req, res) {
    try {
      const museums = await MuseumService.getAll();
      res.json(museums);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
  static async create(req, res) {
    try {
      const museum = await MuseumService.create(req.body);
      res.status(201).json(museum);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
}

module.exports = MuseumController;
