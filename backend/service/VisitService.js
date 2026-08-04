const Visit = require('../data/model/Visit');
const Mapper = require('../data/mapper/VisitMapper');

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
}

module.exports = VisitService;
