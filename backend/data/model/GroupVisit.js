const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  studentName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  stepIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true });

const quizAnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOption: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { _id: false });

const quizSubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentSurname: {
    type: String,
    default: ''
  },
  studentEmail: {
    type: String,
    default: ''
  },
  answers: [quizAnswerSchema],
  score: {
    type: Number,
    required: true,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const groupVisitSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'paused', 'completed', 'cancelled'],
    default: 'waiting',
    index: true
  },
  currentStepIndex: {
    type: Number,
    default: 0
  },
  activeItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  settings: {
    isLocked: {
      type: Boolean,
      default: true // se true, gli studenti seguono forzatamente la tappa del docente
    },
    allowQuestions: {
      type: Boolean,
      default: true
    }
  },
  participants: [participantSchema],
  questions: [questionSchema],
  activeQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    default: null
  },
  quizState: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  quizSubmissions: [quizSubmissionSchema],
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('GroupVisit', groupVisitSchema);
