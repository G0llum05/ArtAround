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
      .populate('questions.student', 'name surname email');

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
   * Lista delle sessioni create dal docente
   */
  static async getTeacherSessions(teacherId) {
    const sessions = await GroupVisit.find({ teacher: teacherId })
      .populate('visit', 'title')
      .populate('teacher', 'name surname email')
      .sort({ createdAt: -1 });

    return sessions.map(s => GroupVisitMapper.toGroupVisitSummaryDTO(s));
  }

  /**
   * Lista delle sessioni a cui uno studente ha preso parte
   */
  static async getStudentSessions(studentId) {
    const sessions = await GroupVisit.find({ 'participants.user': studentId })
      .populate('visit', 'title')
      .populate('teacher', 'name surname email')
      .sort({ createdAt: -1 });

    return sessions.map(s => GroupVisitMapper.toGroupVisitSummaryDTO(s));
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

    const existingIndex = session.participants.findIndex(
      p => p.user && p.user.toString() === studentId.toString()
    );

    if (existingIndex >= 0) {
      session.participants[existingIndex].isOnline = true;
      session.participants[existingIndex].lastSeen = new Date();
    } else {
      session.participants.push({
        user: studentId,
        name: fullName,
        email: student.email,
        joinedAt: new Date(),
        isOnline: true,
        lastSeen: new Date()
      });
    }

    session.markModified('participants');
    await session.save();
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

    if (typeof currentStepIndex === 'number' && currentStepIndex >= 0) {
      session.currentStepIndex = currentStepIndex;
    }

    if (activeItem !== undefined) {
      session.activeItem = activeItem || null;
    }

    if (typeof isLocked === 'boolean') {
      session.settings.isLocked = isLocked;
    }

    if (typeof allowQuestions === 'boolean') {
      session.settings.allowQuestions = allowQuestions;
    }

    if (status && ['waiting', 'in_progress', 'paused', 'completed', 'cancelled'].includes(status)) {
      session.status = status;
      if (status === 'in_progress' && !session.startedAt) {
        session.startedAt = new Date();
      } else if (status === 'completed' && !session.endedAt) {
        session.endedAt = new Date();
      }
    }

    await session.save();
    return await this.getSessionById(session._id);
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
      student: studentId,
      studentName: studentName,
      text: text.trim(),
      stepIndex: typeof stepIndex === 'number' ? stepIndex : session.currentStepIndex,
      status: 'pending'
    };

    session.questions.push(newQuestion);
    await session.save();

    const createdQuestion = session.questions[session.questions.length - 1];
    return {
      id: createdQuestion._id.toString(),
      studentId: studentId.toString(),
      studentName: studentName,
      text: createdQuestion.text,
      stepIndex: createdQuestion.stepIndex,
      status: createdQuestion.status,
      createdAt: createdQuestion.createdAt
    };
  }

  /**
   * Modifica lo stato di una domanda (es. 'answered' o 'dismissed') da parte del docente
   */
  static async updateQuestionStatus(sessionId, teacherId, questionId, status) {
    if (!['answered', 'dismissed', 'pending'].includes(status)) {
      throw new Error('Stato domanda non valido.');
    }

    const session = await GroupVisit.findById(sessionId);
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (session.teacher.toString() !== teacherId.toString()) {
      throw new Error('Solo il docente titolare della sessione può gestire le domande.');
    }

    const question = session.questions.id(questionId);
    if (!question) {
      throw new Error('Domanda non trovata.');
    }

    question.status = status;
    await session.save();

    return {
      id: question._id.toString(),
      status: question.status
    };
  }

  /**
   * Conclude definitivamente una sessione
   */
  static async endSession(sessionId, teacherId) {
    const session = await GroupVisit.findById(sessionId);
    if (!session) {
      throw new Error('Sessione non trovata.');
    }

    if (session.teacher.toString() !== teacherId.toString()) {
      throw new Error('Solo il docente creatore può terminare la sessione.');
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    return await this.getSessionById(sessionId);
  }

  /**
   * Notifica l'uscita o disconnessione di un partecipante
   */
  static async setParticipantOnlineStatus(sessionCode, userId, isOnline) {
    if (!sessionCode || !userId) return;

    const cleanCode = sessionCode.toUpperCase().trim();
    const session = await GroupVisit.findOne({ sessionCode: cleanCode });
    if (!session) return;

    // Se è il docente titolare, non occorre registrarlo come studente partecipante
    if (session.teacher && session.teacher.toString() === userId.toString()) {
      return;
    }

    const participant = session.participants.find(p => p.user && p.user.toString() === userId.toString());
    if (participant) {
      participant.isOnline = Boolean(isOnline);
      participant.lastSeen = new Date();
      session.markModified('participants');
      await session.save();
    } else if (isOnline) {
      const user = await User.findById(userId);
      if (user) {
        session.participants.push({
          user: userId,
          name: `${user.name || ''} ${user.surname || ''}`.trim() || user.email,
          email: user.email,
          joinedAt: new Date(),
          isOnline: true,
          lastSeen: new Date()
        });
        session.markModified('participants');
        await session.save();
      }
    }
  }
}

module.exports = GroupVisitService;
