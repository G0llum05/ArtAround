const Visit = require('../data/model/Visit');

class VisitService {
  static async getAllVisits() {
    return Visit.find().lean();
  }

  static async createVisit(visitData) {
    const newVisit = new Visit(visitData);
    return newVisit.save();
  }
}

module.exports = VisitService;
