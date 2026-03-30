const mongoose = require('mongoose');

const SocialSchema = new mongoose.Schema({
  instagram: String,
  x: String,
  facebook: String,
  youtube: String,
  messanger: String,
  telegram: String,
  whatsapp: String
}, { _id: false });

module.exports = SocialSchema;
