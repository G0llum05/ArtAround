const Museum = require('../data/model/Museum');
const MuseumMapper = require('../data/mapper/MuseumMapper');
const VisitMapper = require('../data/mapper/VisitMapper');

class MuseumService {
  static async getAllMuseum() {
    return museums = await Museum.find().lean();
    
  }

  static async getMuseumById(id) {
    const museum = await Museum.findById(id).lean();
    if (!museum) return null;
    if (!museum.assets?.images || museum.assets.images.length === 0) {
      this._defaultMuseumImageFiller(museum);
    }
    return museum;
  }

  // Ricerca per inizio del nome
  static async searchByName(str) {
    const regex = new RegExp(`^${str}`, 'i');
    const museum = await Museum.find({ name: regex }).lean();
    return museum;
  }

  static async getAllMuseumVisits(museumId) {
    // prende visite attive e immagini pure delle visite attive
    const museum = await Museum.findById(museumId)
      .populate({
        path: 'visits',
        match: { isActive: { $ne: false } } // Filtra a livello di join Mongo solo le visite attive
      })
      .lean();
    // check immagini con filler

    if (!museum || !museum.visits) {
      return [];
    }

    return museum.visits.map(
      (vis) => {
        if (!vis.assets?.images || vis.assets.images.length === 0) {
          this._defaultVisitImageFiller(vis);
        }
        return vis;
      }
    );
  }

  static async createMuseum(museumRequest) {
    const museum = MuseumMapper.toMuseum(museumRequest);
    const newMuseum = new Museum(museum);
    const savedMuseum = await newMuseum.save();
    return savedMuseum.toObject();
  }

  static async updateMuseum(id, data) {
    return await Museum.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteMuseum(id) {
    return await Museum.findByIdAndDelete(id).lean();
  }


  static async getMuseumVisitPlanById(id) {
    return await Museum.findById(id).lean();
  }

  static async getMuseumHomePresentation() {
    const museums = await Museum.find({ isActive: true }).lean();

    return museums.map
      (
        (mus) => {
          if (!mus.assets?.images || mus.assets.images.length === 0) {
            this._defaultMuseumImageFiller(mus);
          }
          return mus;
        }
      );
  }


  static async _defaultMuseumImageFiller(museum) {
    // Immagini di default per il test (landscape per desktop e portrait per mobile)
    const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
    const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

    if (!museum.assets) museum.assets = {};
    if (!Array.isArray(museum.assets.images)) museum.assets.images = [];


    museum.assets.images.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
    museum.assets.images.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
  }

  static async _defaultVisitImageFiller(visit) {
    // Immagini di default per il test (landscape per desktop e portrait per mobile)
    const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
    const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

    if (!visit.assets) visit.assets = {};
    if (!Array.isArray(visit.assets.images)) visit.assets.images = [];


    visit.assets.images.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
    visit.assets.images.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
  }
}

module.exports = MuseumService;
