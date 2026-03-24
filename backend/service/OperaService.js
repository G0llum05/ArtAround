const Opera = require('../data/model/Opera');

class OperaService {
  static async getAllOperas() {
    return await Opera.find()
      .populate('makers')
      .populate('museum')
      .populate('copyOf')
      .populate('falsificationOf')
      .lean();
  }

  static async getOperaById(id) {
    return await Opera.findById(id)
      .populate('makers')
      .populate('museum')
      .populate('copyOf')
      .populate('falsificationOf')
      .lean();
  }

  static async createOpera(operaData) {
    const newOpera = new Opera(operaData);
    return await newOpera.save();
  }

  static async updateOpera(id, updateData) {
    return await Opera.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  static async deleteOpera(id) {
    return await Opera.findByIdAndDelete(id).lean();
  }
}

module.exports = OperaService;
