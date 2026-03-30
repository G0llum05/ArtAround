const mongoose = require('mongoose');
const OperaLocationSchema = require('./schemas/OperaLocationSchema');
const OperaDimensionsSchema = require('./schemas/OperaDimensionsSchema');
const OperaDetailsSchema = require('./schemas/OperaDetailsSchema');

const operaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  startYear: Number,
  endYear: Number,
  makers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OperaMaker',
  }],

  location: OperaLocationSchema,
  dimensions: OperaDimensionsSchema,

  artisticCurrents: [String],
  details: OperaDetailsSchema,
  copyOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Opera' },
  falsificationOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Opera' },
  isActive: Bool,  
  description: String
});


module.exports = mongoose.model('Opera', operaSchema);


