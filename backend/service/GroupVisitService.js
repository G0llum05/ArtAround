const mongoose = require('mongoose');
const GroupVisit = require('../data/model/GroupVisit');
const Visit = require('../data/model/Visit');
const User = require('../data/model/User');
const GroupVisitMapper = require('../data/mapper/GroupVisitMapper');

class GroupVisitService {
  /**
   * Genera un codice univoco di 6 caratteri (es. ART492)
   */
  static async _generateUniqueSessionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // escluse lettere/numeri confondibili come 0, O, 1, I
    let code;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await GroupVisit.findOne({ sessionCode: code, status: { $in: ['waiting', 'in_progress', 'paused'] } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      code = `GRP${Date.now().toString().slice(-4)}`;
    }

    return code;
  }

  /**
   * Crea una nuova sessione di visita di gruppo per un docente
   */
  static async createSession(teacherId, { visitId, title, settings = {} }) {
    if (!visitId) {
      throw new Error('ID visita obbligatorio per avviare una sessione di gruppo.');
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      throw new Error('Visita specificata non trovata.');
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Docente non trovato.');
    }

    const sessionCode = await this._generateUniqueSessionCode();

    const newSession = new GroupVisit({
      sessionCode: sessionCode,
      visit: visitId,
      teacher: teacherId,
      title: title || `Tour: ${visit.title}`,
      status: 'waiting',
      currentStepIndex: 0,
      activeItem: null,
      settings: {
        isLocked: settings.isLocked !== undefined ? settings.isLocked : true,
        allowQuestions: settings.allowQuestions !== undefined ? settings.allowQuestions : true
      },
      participants: [],
      questions: []
    });

    await newSession.save();

    return await this.getSessionById(newSession._id);
  }

  /**
   * Recupera una sessione tramite il suo ID completo di popolamenti
   */
  static async getSessionById(sessionId) {
    const session = await GroupVisit.findById(sessionId)
      .populate({
        path: 'visit',
        populate: [
          {
            path: 'steps.artwork',
            select: 'title author artists startYear endYear assets location description artisticCurrent'
          },
          {
            path: 'steps.items'
          },
          {
            path: 'steps.tellMeMore'
          }
        ]
      })
      .populate('teacher', 'name surname email role')
      .populate('participants.user', 'name surname email')
      .populate('questions.student', 'name surname email')
      .populate('activeQuiz');

    if (!session) {
      throw new Error('Sessione di visita di gruppo non trovata.');
    }

    return GroupVisitMapper.toGroupVisitResponseDTO(session);
  }

  /**
   * Cerca una sessione attiva tramite codice PIN (per lo studente)
   */
  static async getSessionByCode(sessionCode) {
    if (!sessionCode) {
      throw new Error('Codice sessione mancante.');
    }

    const cleanCode = sessionCode.toUpperCase().trim();
    const session = await GroupVisit.findOne({ sessionCode: cleanCode })
      .populate('visit', 'title description minDuration maxDuration assets steps')
      .populate('teacher', 'name surname email')
      .populate('activeQuiz')
      .lean();

    if (!session) {
      throw new Error(`Nessuna sessione trovata con il codice "${cleanCode}".`);
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error('Questa sessione di visita si è già conclusa.');
    }

    return GroupVisitMapper.toGroupVisitResponseDTO(session);
  }

  /**
   * Registra o aggiorna l'ingresso di uno studente nella sessione
   */
  static async joinSession(sessionCode, studentId) {
    const cleanCode = sessionCode.toUpperCase().trim();
    const session = await GroupVisit.findOne({ sessionCode: cleanCode });

    if (!session) {
      throw new Error(`Sessione con codice "${cleanCode}" non trovata.`);
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error('Questa sessione di visita si è già conclusa.');
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Utente studente non trovato.');
    }

    const fullName = `${student.name || ''} ${student.surname || ''}`.trim() || student.email;
    const now = new Date();

    const updateExisting = await GroupVisit.updateOne(
      { _id: session._id, 'participants.user': studentId },
      {
        $set: {
          'participants.$.isOnline': true,
          'participants.$.lastSeen': now,
          'participants.$.name': fullName,
          'participants.$.email': student.email
        }
      }
    );

    if (updateExisting.matchedCount === 0) {
      await GroupVisit.updateOne(
        { _id: session._id },
        {
          $push: {
            participants: {
              user: studentId,
              name: fullName,
              email: student.email,
              joinedAt: now,
              isOnline: true,
              lastSeen: now
            }
          }
        }
      );
    }

    return await this.getSessionById(session._id);
  }

  /**
   * Aggiorna lo stato di avanzamento e i parametri del tour (da parte del docente)
   */
  static async updateProgress(sessionId, teacherId, { currentStepIndex, activeItem, isLocked, status, allowQuestions }) {
    const session = await GroupVisit.findById(sessionId);
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (session.teacher.toString() !== teacherId.toString()) {
      throw new Error('Non sei autorizzato a modificare questa sessione (solo il docente creatore può farlo).');
    }

    const updateFields = {};

    if (typeof currentStepIndex === 'number' && currentStepIndex >= 0) {
      updateFields.currentStepIndex = currentStepIndex;
    }

    if (activeItem !== undefined) {
      updateFields.activeItem = activeItem || null;
    }

    if (typeof isLocked === 'boolean') {
      updateFields['settings.isLocked'] = isLocked;
    }

    if (typeof allowQuestions === 'boolean') {
      updateFields['settings.allowQuestions'] = allowQuestions;
    }

    if (status && ['waiting', 'in_progress', 'paused', 'completed', 'cancelled'].includes(status)) {
      updateFields.status = status;
      if (status === 'in_progress' && !session.startedAt) {
        updateFields.startedAt = new Date();
      } else if (status === 'completed' && !session.endedAt) {
        updateFields.endedAt = new Date();
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await GroupVisit.findByIdAndUpdate(sessionId, { $set: updateFields });
    }

    return await this.getSessionById(sessionId);
  }

  /**
   * Invia una domanda/alzata di mano da parte di uno studente
   */
  static async addQuestion(sessionId, studentId, text, stepIndex = 0) {
    if (!text || !text.trim()) {
      throw new Error('Il testo della domanda non può essere vuoto.');
    }

    const session = await GroupVisit.findById(sessionId);
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (!session.settings.allowQuestions) {
      throw new Error('Le domande degli studenti sono disabilitate per questa sessione.');
    }

    const student = await User.findById(studentId);
    const studentName = student ? `${student.name || ''} ${student.surname || ''}`.trim() || student.email : 'Studente';

    const newQuestion = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      studentName: studentName,
      text: text.trim(),
      stepIndex: typeof stepIndex === 'number' ? stepIndex : session.currentStepIndex,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await GroupVisit.findByIdAndUpdate(
      sessionId,
      { $push: { questions: newQuestion } }
    );

    return {
      id: newQuestion._id.toString(),
      studentId: studentId.toString(),
      studentName: studentName,
      text: newQuestion.text,
      stepIndex: newQuestion.stepIndex,
      status: newQuestion.status,
      createdAt: newQuestion.createdAt
    };
  }

  /**
   * Modifica lo stato di una domanda (es. 'answered' o 'dismissed') da parte del docente
   */
  static async updateQuestionStatus(sessionId, teacherId, questionId, status) {
    if (!['answered', 'dismissed', 'pending'].includes(status)) {
      throw new Error('Stato domanda non valido.');
    }

    const session = await GroupVisit.findById(sessionId, 'teacher questions');
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (session.teacher.toString() !== teacherId.toString()) {
      throw new Error('Solo il docente titolare della sessione può gestire le domande.');
    }

    const updated = await GroupVisit.findOneAndUpdate(
      { _id: sessionId, 'questions._id': questionId },
      { $set: { 'questions.$.status': status } },
      { new: true }
    );

    if (!updated) {
      throw new Error('Domanda non trovata.');
    }

    return {
      id: questionId.toString(),
      status: status
    };
  }

  /**
   * Conclude definitivamente una sessione
   */
  static async endSession(sessionId, teacherId) {
    const session = await GroupVisit.findById(sessionId, 'teacher');
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (session.teacher.toString() !== teacherId.toString()) {
      throw new Error('Solo il docente creatore può terminare la sessione.');
    }

    await GroupVisit.findByIdAndUpdate(sessionId, {
      $set: {
        status: 'completed',
        endedAt: new Date()
      }
    });

    return await this.getSessionById(sessionId);
  }

  /**
   * Notifica l'uscita o disconnessione di un partecipante
   */
  static async setParticipantOnlineStatus(sessionCode, userId, isOnline) {
    if (!sessionCode || !userId) return;

    const cleanCode = sessionCode.toUpperCase().trim();
    const session = await GroupVisit.findOne({ sessionCode: cleanCode }, 'teacher');
    if (!session) return;

    // Se è il docente titolare, non occorre registrarlo come studente partecipante
    if (session.teacher && session.teacher.toString() === userId.toString()) {
      return;
    }

    const now = new Date();

    const updateResult = await GroupVisit.updateOne(
      { sessionCode: cleanCode, 'participants.user': userId },
      {
        $set: {
          'participants.$.isOnline': Boolean(isOnline),
          'participants.$.lastSeen': now
        }
      }
    );

    if (updateResult.matchedCount === 0 && isOnline) {
      const user = await User.findById(userId);
      if (user) {
        await GroupVisit.updateOne(
          { sessionCode: cleanCode },
          {
            $push: {
              participants: {
                user: userId,
                name: `${user.name || ''} ${user.surname || ''}`.trim() || user.email,
                email: user.email,
                joinedAt: now,
                isOnline: true,
                lastSeen: now
              }
            }
          }
        );
      }
    }
  }

  static async startQuiz(identifier, leaderId, quizId) {
    let session = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      session = await GroupVisit.findById(identifier);
    }
    if (!session && identifier) {
      session = await GroupVisit.findOne({ sessionCode: String(identifier).toUpperCase().trim() });
    }
    if (!session) {
      throw new Error('Sessione di gruppo non trovata.');
    }

    if (leaderId && session.teacher.toString() !== leaderId.toString()) {
      throw new Error('Solo il docente titolare di questa visita può avviare il quiz.');
    }

    const Quiz = require('../data/model/Quiz');
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz non trovato.');
    }

    session.activeQuiz = quiz._id;
    session.quizState = 'in_progress';
    session.quizSubmissions = [];
    await session.save();

    return {
      sessionCode: session.sessionCode,
      quizState: 'in_progress',
      quiz
    };
  }

  static async endQuiz(identifier, leaderId) {
    let session = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      session = await GroupVisit.findById(identifier).populate('activeQuiz');
    }
    if (!session && identifier) {
      session = await GroupVisit.findOne({ sessionCode: String(identifier).toUpperCase().trim() }).populate('activeQuiz');
    }
    if (!session) {
      throw new Error('Sessione di gruppo non trovata.');
    }

    if (leaderId && session.teacher.toString() !== leaderId.toString()) {
      throw new Error('Solo il docente titolare di questa visita può concludere il quiz.');
    }

    session.quizState = 'completed';
    await session.save();

    const submissions = session.quizSubmissions || [];
    const sortedSubmissions = [...submissions].sort((a, b) => b.score - a.score);

    return {
      sessionCode: session.sessionCode,
      quizState: 'completed',
      quiz: session.activeQuiz,
      leaderboard: sortedSubmissions,
      totalParticipants: session.participants?.length || 0,
      totalSubmissions: submissions.length
    };
  }
}

module.exports = GroupVisitService;
