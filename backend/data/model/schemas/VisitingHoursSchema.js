const openingWindowSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const visitingHoursSchema = new mongoose.Schema({
  day: {
    type: Number, 
    required: true,
    min: 0, 
    max: 6 
  },
  slots: [openingWindowSchema],
  closed: { type: Boolean, default: false }
}, { _id: false });

const exceptionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  slots: [openingWindowSchema],
  closed: { type: Boolean, default: false },
  reason: String
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  weeklyStandard: {
    type: [visitingHoursSchema],
    validate: [
      {
        validator: (v) => v.length <= 7,
        message: "Massimo 7 giorni, patacca!"
      },
      {
        validator: (v) => new Set(v.map(d => d.day)).size === v.length,
        message: "Giorni duplicati rilevati nella settimana standard."
      }
    ]
  },

  exceptions: {
    type: [exceptionSchema],
    validate: {
      validator: function(v) {
        // Controllo che non ci siano due eccezioni per lo stesso giorno (Y-M-D)
        const dates = v.map(e => e.date.toISOString().split('T')[0]);
        return new Set(dates).size === dates.length;
      },
      message: "Hai inserito due eccezioni per la stessa data!"
    }
  }
});

// TODO: Da spostare in service (Inserimento)
// Middleware per tenere tutto in ordine (opzionale ma consigliato)
scheduleSchema.pre('save', function(next) {
  if (this.weeklyStandard) this.weeklyStandard.sort((a, b) => a.day - b.day);
  if (this.exceptions) this.exceptions.sort((a, b) => a.date - b.date);
  next();
});

const Schedule = mongoose.model('Schedule', scheduleSchema);