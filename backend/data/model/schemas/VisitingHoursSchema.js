const mongoose = require('mongoose');

const OpeningWindowSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const VisitingHoursSchema = new mongoose.Schema({
  day: {
    type: Number, 
    required: true,
    min: 0, 
    max: 6 
  },
  slots: [OpeningWindowSchema],
  closed: { type: Boolean, default: false }
}, { _id: false });

const ExceptionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  slots: [OpeningWindowSchema],
  closed: { type: Boolean, default: false },
  reason: String
}, { _id: false });

const ScheduleSchema = new mongoose.Schema({
  weeklyStandard: {
    type: [VisitingHoursSchema],
    validate: [
      {
        validator: (v) => !v || v.length <= 7,
        message: "Massimo 7 giorni, patacca!"
      },
      {
        validator: (v) => !v || new Set(v.map(d => d.day)).size === v.length,
        message: "Giorni duplicati rilevati nella settimana standard."
      }
    ]
  },

  exceptions: {
    type: [ExceptionSchema],
    validate: {
      validator: function(v) {
        if (!v || v.length === 0) return true;
        const dates = v.map(e => {
          if (!e.date) return '';
          const d = e.date instanceof Date ? e.date : new Date(e.date);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        });
        return new Set(dates).size === dates.length;
      },
      message: "Hai inserito due eccezioni per la stessa data!"
    }
  }
}, { _id: false });

// Middleware per tenere tutto in ordine (opzionale ma consigliato)
ScheduleSchema.pre('save', function() {
  if (this.weeklyStandard && Array.isArray(this.weeklyStandard)) {
    this.weeklyStandard.sort((a, b) => a.day - b.day);
  }
  if (this.exceptions && Array.isArray(this.exceptions)) {
    this.exceptions.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
});

ScheduleSchema.pre('validate', function() {
  if (this.weeklyStandard && Array.isArray(this.weeklyStandard)) {
    this.weeklyStandard.sort((a, b) => a.day - b.day);
  }
  if (this.exceptions && Array.isArray(this.exceptions)) {
    this.exceptions.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
});

module.exports = ScheduleSchema;
module.exports.ScheduleSchema = ScheduleSchema;
module.exports.VisitingHoursSchema = VisitingHoursSchema;
module.exports.OpeningWindowSchema = OpeningWindowSchema;
module.exports.ExceptionSchema = ExceptionSchema;
