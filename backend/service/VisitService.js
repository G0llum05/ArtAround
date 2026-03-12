const Visit = require('../data/model/Visit');
const Mapper = require('../data/mapper/VisitMapper');

class VisitService {
  static async getAllVisits() {
    return await Visit.find().lean();
  }

  static async createVisit(visitRequest) {
    const visit = Mapper.toVisit(visitRequest);
    return await visit.save().toObject();
  }
}

module.exports = VisitService;
