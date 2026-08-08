const mongoose = require('mongoose');
const pointOfInterestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'toilette', 'disabled_toilette', 'bar', 'restaurant', 'shop',
      'entrance', 'exit', 'emergency_exit', 'elevator', 'stairs',
      'ticket_office', 'info_point', 'cloakroom', 'first_aid'],
    required: true
  },
  floor: { type: String, default: 'Piano Terra' },
  room: String,
  details: String
}, { _id: true });

module.exports = pointOfInterestSchema;
