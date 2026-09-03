const mongoose = require('mongoose');
const Visit = require('../data/model/Visit');
const Artwork = require('../data/model/Artwork');
const Item = require('../data/model/Item');
const Museum = require('../data/model/Museum');
const Mapper = require('../data/mapper/VisitMapper');

class VisitService {
  static async getAllVisits(category) {
    const query = category ? { categories: category } : {};
    return await Visit.find(query).populate('creator', 'name surname email').lean();
  }

  static async getVisitById(id) {
    const visit = await Visit.findById(id)
      .populate({
        path: 'steps.artwork',
        select: 'title author artists startYear endYear assets location',
        populate: { path: 'artists' }
      })
      .populate({
        path: 'steps.items'
      })
      .populate({
        path: 'steps.tellMeMore'
      })
      .populate('creator', 'name surname email')
      .lean();

    if (!visit) {
      throw new Error('Visit id non valido');
    }

    const museum = await Museum.findOne({ visits: id }).select('name address').lean();
    visit.museumName = museum ? museum.name : null;
    visit.museumId = museum ? museum._id.toString() : null;

    return visit;
  }

  /*
    * Crea una nuova visita nel database e ritorna id
    * @param {Object} request - { museumId, title, description, price, license, duration, isDisabledFriendly, assets = { images: [] }, visit : [ artworkId, itemId, description, tellMeMore, length, language]  }
    * @returns {Promise<string>} - L'id della visita appena creata.
    */
  static async createVisit(request) {
    if (!request) {
      throw new Error('Dati richiesta mancanti o non validi');
    }

    const {
      museumId,
      userId,
      title,
      description,
      price,
      license,
      duration,
      isDisableFriendly,
      assets,
      steps = []
    } = request;

    const checkMuseumId = await Museum.findById(museumId);
    if (!checkMuseumId) {
      throw new Error('Id museo non valido');
    }

    // recupera opere coinvolte per estrarre le correnti artistiche
    const artworkIds = steps.map(step => step.artworkId).filter(Boolean);
    const artworks = await Artwork.find({ _id: { $in: artworkIds } }).lean();

    // TODO CHECK forse si può mettere anche altro (tipo dalla composizione dell'opera es scultura, quadro etc)
    // insieme unione di artisticCurrents per creare le categories
    const categoriesSet = new Set();
    artworks.forEach(art => {
      if (Array.isArray(art.artisticCurrents)) {
        art.artisticCurrents.forEach(current => categoriesSet.add(current));
      } else if (art.artisticCurrent) {
        categoriesSet.add(art.artisticCurrent);
      }
    });

    const processedSteps = [];

    for (const step of steps) {
      const stepItemIds = [];
      let tellMeMoreItemId = null;

      // Gestione Item Principale: se non c'è itemId ma c'è description, crealo
      if (step.itemId) {
        stepItemIds.push(new mongoose.Types.ObjectId(step.itemId));
      } else if (step.description) {
        const mainItem = await Item.create({
          description: step.description,
          language: step.language || 'it',
          tone: 'medium',
          length: step.length || 60,
          author: userId,
          license: license || 'Standard',
          artwork: step.artworkId,
        });
        stepItemIds.push(mainItem._id);
      }

      // "Dimmi di più" (tellMeMore): se presente, crea un item di approfondimento e salvalo in tellMeMore
      if (step.tellMeMore) {
        const tellMeMoreItem = await Item.create({
          description: step.tellMeMore,
          language: step.language || 'it',
          tone: 'medium',
          length: step.length || 60,
          author: userId,
          license: license || 'Standard',
          artwork: step.artworkId,
        });
        tellMeMoreItemId = tellMeMoreItem._id;
      }

      processedSteps.push({
        artwork: step.artworkId,
        items: stepItemIds,
        tellMeMore: tellMeMoreItemId
      });
    }

    // durata
    const minDur = 0;
    const maxDur = duration || 60;

    let formattedAssets = { images: [] };
    if (assets) {
      if (Array.isArray(assets.images)) {
        formattedAssets.images = assets.images.filter(img => img && img.url);
      } else if (assets.url) {
        formattedAssets.images = [{
          url: assets.url,
          orientation: assets.orientation || 'landscape'
        }];
      }
    }

    const newVisit = new Visit({
      title,
      description,
      price: Number(price) || 0,
      license: license || 'Standard',
      creator: userId,
      steps: processedSteps,
      minDuration: minDur,
      maxDuration: maxDur,
      disableFriendly: Boolean(isDisableFriendly),
      categories: Array.from(categoriesSet),
      assets: formattedAssets,
      isActive: true,
      isVerified: false
    });

    const savedVisit = await newVisit.save();

    if (museumId) {
      await Museum.findByIdAndUpdate(museumId, {
        $addToSet: { visits: savedVisit._id }
      });
    }

    return savedVisit._id.toString();
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

    // Interaction & Popularity Categories
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

    // Thematic Categories
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
   * Restituisce le top 10 visite più popolari per il marketplace, ordinate per numero di like e visualizzazioni.
    * @returns {Promise<Array>} Array di oggetti contenenti le informazioni delle visite più popolari.
   */
  static async getTopTenVisits() {

    try {
      const visits = await Visit.find({ isActive: { $ne: false } })
        .populate('creator', 'name surname email')
        .lean();
      if (!visits || visits.length === 0) {
        return [];
      }

      // prime 10 visite più popolari
      const topVisits = await this._sortVisitsByPopularity(visits);
      topVisits.splice(10);


      for (const visit of topVisits) {
        visit.isClosingSoon = await this._isVisitClosingSoon(visit);
        visit.isNew = await this._isVisitNew(visit);
      }


      // Immagini di default per il test (landscape per desktop e portrait per mobile)
      const DEFAULT_LANDSCAPE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000";
      const DEFAULT_PORTRAIT = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000";

      topVisits.forEach(visit => {
        if (!visit.assets) visit.assets = { images: [] };
        if (!Array.isArray(visit.assets.images)) visit.assets.images = [];

        const hasLandscape = visit.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'landscape'));
        const hasPortrait = visit.assets.images.some(img => (typeof img === 'object' && img?.orientation === 'portrait'));

        if (!hasLandscape) {
          visit.assets.images.push({ url: DEFAULT_LANDSCAPE, orientation: 'landscape' });
        }
        if (!hasPortrait) {
          visit.assets.images.push({ url: DEFAULT_PORTRAIT, orientation: 'portrait' });
        }
      });


      return topVisits;
    } catch (error) {
      console.error('Error retrieving visit home presentation:', error);
      throw new Error('Error retrieving visit home presentation');
    }
  }

  static async _sortVisitsByPopularity(visits) {
    visits.sort((a, b) => {
      const likesDiff = (b.likesCount || 0) - (a.likesCount || 0);
      if (likesDiff !== 0) return likesDiff;
      const viewsDiff = (b.views?.total || 0) - (a.views?.total || 0);
      return viewsDiff;
    });
    return visits;
  }

  // TODO CHECK al momento facciamo una funzione fittizia
  static async _isVisitClosingSoon(visit) {
    return false;
  }

  // check dal timestamp createdAt se la visita è nuova (ultimi 30 giorni)
  static async _isVisitNew(visit) {
    const now = new Date();
    const createdAt = new Date(visit.createdAt);
    const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    return diffInDays <= 30;
  }
}

module.exports = VisitService;
