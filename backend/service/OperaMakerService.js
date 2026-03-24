const OperaMaker = require('../data/model/OperaMaker');

class OperaMakerService {
  static async getAll() {
    return await OperaMaker.find().lean();
  }
  static async create(data) {
    const maker = new OperaMaker(data);
    return await maker.save();
  }
}

module.exports = OperaMakerService;
