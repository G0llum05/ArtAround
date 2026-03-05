const Opera = require('../data/model/Opera');

class OperaService {
  static async getAllOperas() {
    return Opera.find().populate('maker').lean();
  }

  static async createOpera(operaData) {
    const newOpera = new Opera(operaData);
    return newOpera.save();
  }
}

module.exports = OperaService;
