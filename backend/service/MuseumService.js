const Museum = require('../data/model/Museum');

class MuseumService {
  static async getAll() {
    return await Museum.find().lean();
  }
  static async create(data) {
    const museum = new Museum(data);
    return await museum.save();
  }
}

module.exports = MuseumService;
