const Museum = require('../data/model/Museum');
const ImageUrlService = require('./ImageUrlService');
const MuseumMapper = require('../data/mapper/MuseumMapper');
class MuseumService {
  static async getAllMuseum() {
    return await Museum.find().lean();
  }

  static async getMuseumById(id) {
    return await Museum.findById(id).lean();
  }
  
  // Ricerca per inizio del nome
  static async searchByName(str) {
    const regex = new RegExp(`^${str}`,  'i');
    return await Museum.find( {name: regex} ).lean();
  }

  static async getVisitsByMuseumId(musId) {
      const result = (await Museum.findById(musId, 'visits').populate('visits').lean())?.visits;
      return result ? result : [];
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


  static async getMuseumVisitPlanById(id) {
    const museum = await Museum.findById(id).lean();

    const imageUrls = await ImageUrlService.getMuseumImageUrl(id);
    
    return MuseumMapper.toMuseumVisitPlanResponseDTO(museum, imageUrls);
  }

  static async getMuseumHomePresentation() {
    const museums = await Museum.find().lean();

    //const imageUrls = await ImageUrlService.getMuseumImageUrl();
    const imageUrl = "https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-photos%2Fplaceholder-gallery%3Fpage%3D2&opi=89978449";

    return {museums, imageUrl};
  }
}

module.exports = MuseumService;
