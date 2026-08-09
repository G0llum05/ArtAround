const Visit = require('../data/model/Visit');
const Mapper = require('../data/mapper/VisitMapper');
const Museum = require('../data/model/Museum');
const UploadService = require('./UploadService');
const fs = require('fs-extra');
const Imager = require('../utils/Imager');

class VisitService {
  static async getAllVisits(category) {
    const query = category ? { categories: category } : {};
    return await Visit.find(query).populate('creator', 'name surname email').lean();
  }

  static async createVisit(visitRequest) {
    const visit = Mapper.toVisit(visitRequest);
    const newVisit = new Visit(visit);
    const saved = await newVisit.save();
    return saved.toObject();
  }

  static async incrementLikes(visitId, delta = 1) {
    return await Visit.findByIdAndUpdate(
      visitId,
      { $inc: { likesCount: delta } },
      { new: true }
    ).lean();
  }

  static async incrementViews(visitId) {
    return await Visit.findByIdAndUpdate(
      visitId,
      { $inc: { 'views.total': 1, 'views.weekly': 1 } },
      { new: true }
    ).lean();
  }

  static async getMarketplaceFeed() {
    const visits = await Visit.find({ isActive: { $ne: false } })
      .populate('creator', 'name surname email')
      .lean();

    const feed = [];

    // 1. Interaction & Popularity Categories
    const mostLiked = [...visits]
      .filter(v => (v.likesCount || 0) > 0)
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 8);

    const mostViewedWeekly = [...visits]
      .filter(v => v.views && (v.views.weekly || 0) > 0)
      .sort((a, b) => (b.views?.weekly || 0) - (a.views?.weekly || 0))
      .slice(0, 8);

    const mostViewedTotal = [...visits]
      .filter(v => v.views && (v.views.total || 0) > 0)
      .sort((a, b) => (b.views?.total || 0) - (a.views?.total || 0))
      .slice(0, 8);

    const freeVisits = visits.filter(v => v.price === 0);

    if (mostLiked.length > 0) {
      feed.push({ category: 'Più Popolari', visits: mostLiked });
    }
    if (mostViewedWeekly.length > 0) {
      feed.push({ category: 'Più Viste della Settimana', visits: mostViewedWeekly });
    }
    if (mostViewedTotal.length > 0) {
      feed.push({ category: 'Più Viste di Sempre', visits: mostViewedTotal });
    }
    if (freeVisits.length > 0) {
      feed.push({ category: 'Visite Gratuite', visits: freeVisits });
    }

    // 2. Thematic Categories
    const ALLOWED_CATEGORIES = [
      'Motori', 'Scienza', 'Archeologia', 'Didattica', 'Musica',
      'Rinascimento', 'Arte Moderna', 'Antica Grecia', 'Antica Roma',
      'Oriente', 'Antico Egitto', 'Medioevo', 'Neoclassicismo',
      'Impressionismo', 'Realismo', 'Puntinismo', 'Avanguardie'
    ];

    const categoriesMap = {};
    for (const visit of visits) {
      const cats = visit.categories && visit.categories.length > 0 ? visit.categories : [];
      for (const cat of cats) {
        if (!categoriesMap[cat]) {
          categoriesMap[cat] = [];
        }
        categoriesMap[cat].push(visit);
      }
    }

    for (const catName of ALLOWED_CATEGORIES) {
      if (categoriesMap[catName] && categoriesMap[catName].length > 0) {
        feed.push({ category: `Categoria: ${catName}`, visits: categoriesMap[catName] });
      }
    }

    Object.keys(categoriesMap).forEach(catName => {
      if (!ALLOWED_CATEGORIES.includes(catName) && categoriesMap[catName].length > 0) {
        feed.push({ category: `Categoria: ${catName}`, visits: categoriesMap[catName] });
      }
    });

    return feed;
  }

  /**
   * Risolve la query per ottenere tutte le immagini degli artwork presenti all'interno di una visita singola.
   *
   * @param {string} visitId - ID della visita singola
   * @param {string} [museumIdInput] - ID del museo opzionale
   * @returns {Promise<Object|null>} La visita popolata con gli artwork e le relative immagini senza duplicazioni.
   */
  static async getVisitArtworkImages(visitId, museumIdInput = null) {
    const visit = await Visit.findById(visitId)
      .populate({
        path: 'artworks',
        populate: { path: 'artists' }
      })
      .populate('creator', 'name surname email')
      .lean();

    if (!visit) {
      return null;
    }

    let museumId = museumIdInput;
    let museum = null;
    if (museumId) {
      museum = await Museum.findById(museumId).select('_id name').lean();
    } else {
      museum = await Museum.findOne({ visits: visitId }).select('_id name').lean();
      museumId = museum ? museum._id.toString() : null;
    }

    const resolvedArtworks = await Promise.all(
      (visit.artworks || []).map(async (artwork) => {
        if (!artwork) return null;
        const artworkId = artwork._id ? artwork._id.toString() : artwork.toString();

        const dbImages = Array.isArray(artwork.images) ? artwork.images : [];
        const fsImages = await UploadService.getArtworkImages({
          museumId,
          artworkId
        });

        const allImages = Array.from(new Set([...dbImages, ...fsImages]));

        return typeof artwork === 'object'
          ? { ...artwork, images: allImages }
          : { _id: artworkId, images: allImages };
      })
    );

    return {
      ...visit,
      museum: museum || null,
      artworks: resolvedArtworks.filter(Boolean)
    };
  }

  /**
   * Risolve le immagini degli artisti per ciascun artwork della visita.
   */
  static async getVisitArtistImages(museumIdInput, visitId) {
    const visit = await Visit.findById(visitId)
      .populate({
        path: 'artworks',
        populate: { path: 'artists' }
      })
      .populate('creator', 'name surname email')
      .lean();

    if (!visit) {
      return null;
    }

    let museumId = museumIdInput;
    let museum = null;
    if (museumId) {
      museum = await Museum.findById(museumId).select('_id name').lean();
    } else {
      museum = await Museum.findOne({ visits: visitId }).select('_id name').lean();
      museumId = museum ? museum._id.toString() : null;
    }

    const resolvedArtworks = await Promise.all(
      (visit.artworks || []).map(async (artwork) => {
        if (!artwork) return null;
        const artists = Array.isArray(artwork.artists) ? artwork.artists : [];
        
        const artistImagesList = await Promise.all(
          artists.map(async (artist) => {
            const artistId = artist && artist._id ? artist._id.toString() : (artist ? artist.toString() : null);
            return artistId ? await UploadService.getArtistImages({ museumId, artistId }) : [];
          })
        );

        const fsArtistImages = Array.from(new Set(artistImagesList.flat()));
        const dbImages = Array.isArray(artwork.images) ? artwork.images : [];
        const allImages = Array.from(new Set([...dbImages, ...fsArtistImages]));

        return typeof artwork === 'object'
          ? { ...artwork, artistImages: fsArtistImages, images: allImages }
          : { _id: artwork._id || artwork, artistImages: fsArtistImages, images: allImages };
      })
    );

    return {
      ...visit,
      museum: museum || null,
      artworks: resolvedArtworks.filter(Boolean)
    };
  }

  /**
   * Restituisce le URL delle immagini di copertina/meta per la visita.
   */
  static async getVisitImageUrl(museumId, visitId) {
    const path = require('path');

    const visitDir = path.join(__dirname, "../assets/museums", museumId, "visit", visitId, "meta");
    if (!(await fs.pathExists(visitDir))) {
      return [];
    }

    const files = await fs.readdir(visitDir);
    const foundUrls = [];

    for (const file of files) {
      if (Imager.isImage(file)) {
        const fullPath = path.join(visitDir, file);
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
        foundUrls.push(`/${relativePath}`);
      }
    }
    return foundUrls;
  }

  /**
   * Restituisce il DTO di presentazione della visita per la Home Page.
   */
  static async getVisitHomePresentation(museumId, visitId) {
    const visit = await Visit.findById(visitId).lean();
    if (!visit) return null;

    const imageUrls = await this.getVisitImageUrl(museumId, visitId);

    // Da definire meglio
    let badge = '';
    if (visit.price === 0) {
      badge = 'Gratuito';
    } else if (visit.likesCount > 10) {
      badge = 'Popolare';
    }

    return Mapper.toVisitHomePresentationRes(visit, imageUrls, badge);
  }
}

module.exports = VisitService;
