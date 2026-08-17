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

  static async getAllMuseumVisits(museumId) {
    // prende visite attive e immagini pure delle visite attive
    const visits = await Museum.findById(museumId)
      .populate({
        path: 'visits',
        match: { isActive: { $ne: false } } // Filtra a livello di join Mongo solo le visite attive
      })
      .lean();
    // check immagini con filler
    if (visits && visits.visits) {
      for (const visit of visits.visits) {
        if (!visit.assets) visit.assets = { images: [] };
        if (!Array.isArray(visit.assets.images)) visit.assets.images = [];

        const hasLandscape = visit.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'landscape'));
        const hasPortrait = visit.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'portrait'));

        if (!hasLandscape) {
          visit.assets.images.push({ url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000", orientation: 'landscape' });
        }
        if (!hasPortrait) {
          visit.assets.images.push({ url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000", orientation: 'portrait' });
        }
      }
    }

    return visits ? visits.visits : [];
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
