const Museum = require('../data/model/Museum');

class MuseumService {
  static async getAllMuseum() {
    return await Museum.find().lean();
  }
  
  // Ricerca per inizio del nome
  static async searchByName(str) {
    const regex = new RegExp(`^${str}`,  'i');
    return await Museum.find( {name: regex} ).lean();
  }

  static async getVisitsByMuseumId(musId) {
    const result = await Museum.findById(musId).select('visits').lean();
    return result ? result.visits : [];
  }

  static async createMuseum(data) {
    const museum = new Museum(data);
    return await museum.save();
  }

  static async updateMuseum(id, data) {
    return await Museum.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteMuseum(id) {
    return await Museum.findByIdAndDelete(id).lean();
  }
}

module.exports = MuseumService;
