const OperaMakerService = require('../../service/OperaMakerService');

class OperaMakerController {
  static async getAll(req, res) {
    try {
      const makers = await OperaMakerService.getAll();
      res.json(makers);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
  static async create(req, res) {
    try {
      const maker = await OperaMakerService.create(req.body);
      res.status(201).json(maker);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
}

module.exports = OperaMakerController;
