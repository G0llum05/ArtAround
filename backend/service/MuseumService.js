const Museum = require('../data/model/Museum');
const MuseumMapper = require('../data/mapper/MuseumMapper');
const VisitMapper = require('../data/mapper/VisitMapper');

class MuseumService {
  static async getAllMuseum() {
    const museums = await Museum.find().lean();
    return museums.map((mus) => MuseumMapper.toMuseumResponseDTO(mus));
  }

  static async getMuseumById(id) {
    const museum = await Museum.findById(id).lean();
    return MuseumMapper.toMuseumResponseDTO(museum);
  }

  // Ricerca per inizio del nome
  static async searchByName(str) {
    const regex = new RegExp(`^${str}`, 'i');
    const museum = await Museum.find({ name: regex }).lean();
    return MuseumMapper.toMuseumResponseDTO(museum);
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

    if (!visits) {
      return [];
    }
    
    return visits.map
    (
      (vis) => {
        if (!vis.assets?.images || vis.assets.images.length === 0) {
          this._defaultVisitImageFiller(vis);
        }
        return VisitMapper.toMuseumVisitForPresentationDTO(vis);
      }
    );
  }

  static async createMuseum(data) {
    const museum = new Museum(data);
    await museum.save();
    return MuseumMapper.toMuseumResponseDTO(museum);
  }

  static async updateMuseum(id, data) {
    const museum = await Museum.findByIdAndUpdate(id, data, { new: true }).lean();  
    return MuseumMapper.toMuseumResponseDTO(museum);
  }

  static async deleteMuseum(id) {
    const museum = await Museum.findByIdAndDelete(id).lean(); 
    return MuseumMapper.toMuseumResponseDTO(museum);
  }


  static async getMuseumVisitPlanById(id) {
    const museum = await Museum.findById(id).lean();
    return MuseumMapper.toMuseumVisitPlanResponseDTO(museum);
  }

  static async getMuseumHomePresentation() {
    const museums = await Museum.find({ isActive: true }).lean();
    
    return museums.map
    (
      (mus) => {
        if (!mus.assets?.gallery || mus.assets.gallery.length === 0) {
          this._defaultMuseumImageFiller(mus);
        }
        return MuseumMapper.toMuseumHomePresentationResponseDTO(mus);
      }
    );
  }


  static async _defaultMuseumImageFiller(museum) {
    // Immagini di default per il test (landscape per desktop e portrait per mobile)
    const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
    const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

    if (!museum.assets) museum.assets = {};
    if (!Array.isArray(museum.assets.gallery)) museum.assets.gallery = [];


    museum.assets.gallery.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
    museum.assets.gallery.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
  }
  
  static async _defaultVisitImageFiller(visit) {
    // Immagini di default per il test (landscape per desktop e portrait per mobile)
    const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
    const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

    if (!visit.assets) visit.assets = {};
    if (!Array.isArray(visit.assets.images)) museum.assets.images = [];


    visit.assets.images.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
    visit.assets.images.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
  }
}

module.exports = MuseumService;
