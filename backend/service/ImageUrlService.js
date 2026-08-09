const fs = require('fs-extra');
const Imager = require('../utils/Imager');
const Museum = require('../data/model/Museum');
const Visit = require('../data/model/Visit');

class ImageUrlService {
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
   * Restituisce le URL delle immagini di copertina/meta per il museo.
   */

  static async getMuseumImageUrl(museumId) {
    const path = require('path');

    const museumDir = path.join(__dirname, "../assets/museums", museumId, "meta");
    if (!(await fs.pathExists(visitDir))) {
      return [];
    }

    const files = await fs.readdir(musuemDir);
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

}

module.exports = ImageUrlService;