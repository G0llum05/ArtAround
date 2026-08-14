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
    const regex = new RegExp(`^${str}`, 'i');
    return await Museum.find({ name: regex }).lean();
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
    const museums = await Museum.find({ isActive: true }).lean();

    // Fill default images if missing
    const museumsWithImages = await this._defautlImageFiller(museums);

    return museumsWithImages;

  }


  static async _defautlImageFiller(museums) {
    // Immagini di default per il test (landscape per desktop e portrait per mobile)
    const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
    const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

    museums.forEach(mus => {
      if (!mus.assets) mus.assets = { images: [] };
      if (!Array.isArray(mus.assets.images)) mus.assets.images = [];

      const hasLandscape = mus.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'landscape'));
      const hasPortrait = mus.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'portrait'));

      if (!hasLandscape) {
        mus.assets.images.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
      }
      if (!hasPortrait) {
        mus.assets.images.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
      }
    });
    return museums;
  }
}

module.exports = MuseumService;
