const mongoose = require('mongoose');
const TokenService = require('../service/TokenService');
const GroupVisitService = require('../service/GroupVisitService');
const GroupVisit = require('../data/model/GroupVisit');

let io = null;

// Mappa in-memory per tracciare l'ascolto audio degli studenti: sessionCode -> Map<userId, { userId, name, status, stepIndex, updatedAt }>
const sessionAudioProgress = new Map();
// Mappa in-memory per tracciare l'ID del docente di ciascuna sessione: sessionCode -> teacherId
const sessionTeachers = new Map();

function getSessionAudioSummary(sessionCode, currentStepIndex = 0, fallbackTeacherId = null) {
  const code = sessionCode?.toUpperCase().trim();
  const sessionMap = sessionAudioProgress.get(code) || new Map();
  const teacherId = (fallbackTeacherId || sessionTeachers.get(code))?.toString();

  // Rimuovi esplicitamente il docente titolare dalla mappa degli studenti
  if (teacherId && sessionMap.has(teacherId)) {
    sessionMap.delete(teacherId);
  }

  const currentStep = Number(currentStepIndex) || 0;
  const allEntries = Array.from(sessionMap.values()).filter(s => !teacherId || s.userId?.toString() !== teacherId);
  const students = allEntries.filter(s => (Number(s.stepIndex) || 0) === currentStep);

  const completedCount = students.filter(s => s.status === 'completed').length;
  const listeningCount = students.filter(s => s.status === 'listening').length;
  const pausedCount = students.filter(s => s.status === 'paused').length;
  const notStartedCount = students.filter(s => s.status === 'not_started').length;
  const totalStudents = students.length;

  return {
    stepIndex: currentStep,
    totalStudents,
    completedCount,
    listeningCount,
    pausedCount,
    notStartedCount,
    students
  };
}

async function isSessionTeacher(sessionCodeOrId, user) {
  if (!user || !user.id) return false;
  const identifier = sessionCodeOrId?.toString().trim();
  if (!identifier) return false;

  const code = identifier.toUpperCase();
  let teacherId = sessionTeachers.get(code);
  if (!teacherId) {
    try {
      let query = { sessionCode: code };
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        query = { $or: [{ sessionCode: code }, { _id: identifier }] };
      }
      const session = await GroupVisit.findOne(query).select('teacher sessionCode').lean();
      if (session?.teacher) {
        teacherId = (session.teacher._id || session.teacher).toString();
        if (session.sessionCode) {
          sessionTeachers.set(session.sessionCode.toUpperCase().trim(), teacherId);
        }
      }
    } catch (e) {}
  }
  return Boolean(teacherId && teacherId.toString() === user.id.toString());
}

/**
 * Inizializza il layer Socket.IO per le visite guidate di gruppo
 * @param {import('http').Server} httpServer 
 */
function initGroupVisitSocket(httpServer) {
  try {
    const socketIO = require('socket.io');
    io = new socketIO.Server(httpServer, {
      cors: {
        origin: true, // Riflette l'origin del client per supportare credentials: true senza errori CORS
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    console.log('[Socket.IO] Inizializzato con successo.');

    // Middleware di autenticazione per Handshake Socket
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token ||
                      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                      socket.handshake.query?.token;
        if (!token) {
          console.warn('[Socket.IO] Connessione rifiutata: token assente');
          return next(new Error('Autenticazione richiesta per la connessione WebSocket.'));
        }

        const decoded = TokenService.verifyAccessToken(token);
        if (decoded instanceof Error || !decoded || (!decoded.id && !decoded._id)) {
          console.warn('[Socket.IO] Handshake auth fallito: token non valido o scaduto');
          return next(new Error('Token non valido o scaduto.'));
        }

        socket.user = {
          id: (decoded.id || decoded._id).toString(),
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || '',
          surname: decoded.surname || ''
        };
        next();
      } catch (err) {
        console.warn('[Socket.IO] Handshake auth fallito:', err.message);
        next(new Error('Token non valido o scaduto.'));
      }
    });

    io.on('connection', (socket) => {
      const user = socket.user;
      console.log(`[Socket.IO] Utente connesso: ${user.email} (ID: ${user.id}, Ruolo: ${user.role})`);

      /**
       * Ingresso in una stanza di visita di gruppo
       */
      socket.on('session:join', async ({ sessionCode }, callback) => {
        try {
          if (!sessionCode) {
            if (typeof callback === 'function') callback({ success: false, error: 'Codice sessione mancante' });
            return;
          }

          const cleanCode = sessionCode.toUpperCase().trim();
          const session = await GroupVisit.findOne({ sessionCode: cleanCode }).populate('teacher', 'name surname email');
          if (!session) {
            if (typeof callback === 'function') callback({ success: false, error: 'Sessione di visita non trovata.' });
            return;
          }

          if (session.status === 'completed' || session.status === 'cancelled') {
            if (typeof callback === 'function') callback({ success: false, error: 'Questa sessione di visita si è già conclusa.' });
            return;
          }

          const sessionTeacherId = (session.teacher?._id || session.teacher?.id || session.teacher)?.toString();
          const isTeacher = Boolean(sessionTeacherId && user.id && sessionTeacherId === user.id.toString());
          const isExistingParticipant = session.participants && session.participants.some(p => {
            const pId = (p.user?._id || p.user?.id || p.user || p.userId)?.toString();
            return pId && pId === user.id.toString();
          });

          // Se la visita è già avviata e l'utente non è il docente né uno studente già presente nella sala d'attesa
          if ((session.status === 'in_progress' || session.status === 'paused') && !isTeacher && !isExistingParticipant) {
            if (typeof callback === 'function') {
              callback({ success: false, error: 'La visita di gruppo è già stata avviata e non accetta nuovi partecipanti.' });
            }
            return;
          }

          const room = `session:${cleanCode}`;
          socket.join(room);
          socket.sessionCode = cleanCode;

          // Registra l'ingresso nel DB
          await GroupVisitService.setParticipantOnlineStatus(cleanCode, user.id, true);
          const updatedSession = await GroupVisitService.getSessionByCode(cleanCode, user.id);

          // Memorizza il docente della sessione
          if (sessionTeacherId) {
            sessionTeachers.set(cleanCode, sessionTeacherId);
          }

          // Broadcast lista completa aggiornata a tutta la stanza
          if (updatedSession?.participants) {
            io.to(room).emit('participants:updated', updatedSession.participants);
          }

          // Notifica gli altri nella stanza
          socket.to(room).emit('participant:joined', {
            userId: user.id,
            name: `${user.name || ''} ${user.surname || ''}`.trim() || user.email,
            email: user.email,
            role: user.role
          });

          // Gestione monitoraggio ascolto audio
          const currentStep = updatedSession?.currentStepIndex || 0;
          let sessionMap = sessionAudioProgress.get(sessionCode.toUpperCase().trim());
          if (!sessionMap) {
            sessionMap = new Map();
            sessionAudioProgress.set(sessionCode.toUpperCase().trim(), sessionMap);
          }

          // Assicura che tutti i partecipanti registrati (eccetto il docente titolare) siano presenti in sessionMap
          if (updatedSession?.participants && Array.isArray(updatedSession.participants)) {
            for (const p of updatedSession.participants) {
              const pId = (p.user?._id || p.user?.id || p.user || p.userId)?.toString();
              if (pId && (!sessionTeacherId || pId !== sessionTeacherId) && p.isOnline !== false) {
                if (!sessionMap.has(pId)) {
                  sessionMap.set(pId, {
                    userId: pId,
                    name: p.name || p.email || 'Partecipante',
                    status: 'not_started',
                    stepIndex: currentStep,
                    updatedAt: new Date()
                  });
                }
              }
            }
          }

          if (!isTeacher) {
            const studentName = `${user.name || ''} ${user.surname || ''}`.trim() || user.email;
            const existing = sessionMap.get(user.id);
            sessionMap.set(user.id, {
              userId: user.id,
              name: studentName,
              status: existing?.status || 'not_started',
              stepIndex: existing?.stepIndex !== undefined ? existing.stepIndex : currentStep,
              updatedAt: new Date()
            });
            const summary = getSessionAudioSummary(sessionCode, currentStep, sessionTeacherId);
            io.to(room).emit('session:students-audio-status', summary);
          } else {
            // Se è il docente che entra, assicuriamoci che non sia presente nella mappa degli studenti
            if (sessionMap.has(user.id)) {
              sessionMap.delete(user.id);
            }
            // Invia subito il riepilogo corrente dello stato audio al docente
            const summary = getSessionAudioSummary(sessionCode, currentStep, sessionTeacherId);
            socket.emit('session:students-audio-status', summary);
          }

          let studentQuiz = updatedSession.activeQuiz;
          let mySubmission = null;

          if (updatedSession.activeQuiz && !isTeacher) {
            const QuizService = require('../service/QuizService');
            const isCompleted = updatedSession.quizState === 'completed';
            const rawQuizId = updatedSession.activeQuiz._id || updatedSession.activeQuiz.id || updatedSession.activeQuiz;
            try {
              studentQuiz = await QuizService.getQuizById(rawQuizId, isCompleted);
            } catch (e) {
              studentQuiz = updatedSession.activeQuiz;
            }
            
            const submissions = updatedSession.quizSubmissions || [];
            mySubmission = submissions.find(s => (s.student?._id || s.student || '').toString() === user.id.toString()) || null;
          }

          if (updatedSession.activeQuiz && updatedSession.quizState && updatedSession.quizState !== 'not_started') {
            if (updatedSession.quizState === 'in_progress') {
              socket.emit('session:quiz-started', {
                sessionCode,
                quizState: 'in_progress',
                quiz: studentQuiz,
                mySubmission,
                submissions: updatedSession.quizSubmissions || []
              });
            } else if (updatedSession.quizState === 'completed') {
              socket.emit('session:quiz-ended', {
                sessionCode,
                quizState: 'completed',
                quiz: updatedSession.activeQuiz,
                leaderboard: updatedSession.quizSubmissions || [],
                myResult: mySubmission
              });
            }
          }

          if (typeof callback === 'function') {
            callback({
              success: true,
              session: {
                ...updatedSession,
                activeQuiz: studentQuiz,
                mySubmission
              }
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Errore in session:join:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Uscita esplicita dalla stanza di visita
       */
      socket.on('session:leave', async ({ sessionCode }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (code) {
            const room = `session:${code}`;
            await GroupVisitService.setParticipantOnlineStatus(code, user.id, false);
            socket.leave(room);
            socket.sessionCode = null;

            const updatedSession = await GroupVisitService.getSessionByCode(code);
            if (updatedSession?.participants) {
              io.to(room).emit('participants:updated', updatedSession.participants);
            }

            let sessionMap = sessionAudioProgress.get(code);
            if (sessionMap && sessionMap.has(user.id)) {
              sessionMap.delete(user.id);
              const summary = getSessionAudioSummary(code, updatedSession?.currentStepIndex || 0);
              io.to(room).emit('session:students-audio-status', summary);
            }

            socket.to(room).emit('participant:left', {
              userId: user.id,
              email: user.email
            });
          }
          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
          console.error('[Socket.IO] Errore in session:leave:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente avvia la visita di gruppo
       */
      socket.on('teacher:start-session', async ({ sessionCode, sessionId }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            throw new Error('Solo il docente titolare di questa visita può avviare la sessione.');
          }

          if (!code) {
            throw new Error('Codice sessione mancante.');
          }

          const room = `session:${code}`;

          // Aggiorna lo stato della sessione a in_progress
          const query = sessionId ? { _id: sessionId } : { sessionCode: code };
          const updated = await GroupVisit.findOneAndUpdate(
            query,
            {
              $set: {
                status: 'in_progress',
                startedAt: new Date()
              }
            },
            { new: true }
          ).populate('visit');

          if (!updated) {
            throw new Error('Sessione non trovata.');
          }

          const visitId = updated.visit?._id ? updated.visit._id.toString() : (updated.visit ? updated.visit.toString() : null);

          console.log(`[Socket.IO] Visita avviata per stanza ${code} (Visita ID: ${visitId})`);

          // Broadcast session:started a TUTTI i partecipanti collegati nella stanza (compresi studenti)
          io.to(room).emit('session:started', {
            sessionCode: code,
            sessionId: updated._id.toString(),
            visitId: visitId,
            currentStepIndex: updated.currentStepIndex || 0,
            isLocked: updated.settings?.isLocked ?? true,
            allowQuestions: updated.settings?.allowQuestions ?? true
          });

          // Invia subito il riepilogo iniziale dello stato audio per la tappa 0
          const summary = getSessionAudioSummary(code, updated.currentStepIndex || 0, user.id);
          io.to(room).emit('session:students-audio-status', summary);

          if (typeof callback === 'function') {
            callback({
              success: true,
              visitId: visitId,
              sessionCode: code,
              sessionId: updated._id.toString()
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:start-session:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente cambia tappa dell'itinerario
       */
      socket.on('teacher:step-change', async ({ sessionCode, sessionId, stepIndex, activeItem }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            throw new Error('Solo il docente titolare di questa visita può cambiare tappa.');
          }

          if (!code) {
            throw new Error('Codice sessione mancante.');
          }
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (!found) throw new Error('Sessione non trovata per il codice fornito.');
            querySessionId = found._id.toString();
          }

          const updated = await GroupVisitService.updateProgress(querySessionId, user.id, {
            currentStepIndex: stepIndex,
            activeItem: activeItem
          });

          const newStepIndex = updated ? updated.currentStepIndex : stepIndex;

          // Reimposta lo stato di ascolto di tutti gli studenti per la nuova tappa
          const sessionMap = sessionAudioProgress.get(code);
          const teacherId = sessionTeachers.get(code);
          if (sessionMap) {
            if (teacherId && sessionMap.has(teacherId)) {
              sessionMap.delete(teacherId);
            }
            for (const [sId, progress] of sessionMap.entries()) {
              if (teacherId && sId.toString() === teacherId.toString()) {
                sessionMap.delete(sId);
                continue;
              }
              sessionMap.set(sId, {
                ...progress,
                status: 'not_started',
                stepIndex: newStepIndex,
                updatedAt: new Date()
              });
            }
          }
          const audioSummary = getSessionAudioSummary(code, newStepIndex);

          console.log(`[Socket.IO] Broadcast cambio tappa a stanza ${room}: nuovo step ${newStepIndex}`);

          // Broadcast dello step aggiornato a tutti gli studenti nella stanza
          io.to(room).emit('session:step-changed', {
            stepIndex: newStepIndex,
            activeItem: updated?.activeItem || activeItem
          });

          // Broadcast immediato del nuovo riepilogo audio al docente
          io.to(room).emit('session:students-audio-status', audioSummary);

          if (typeof callback === 'function') callback({ success: true, stepIndex: newStepIndex });
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:step-change:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Studente aggiorna il proprio stato di ascolto audio (listening | completed | paused | not_started)
       */
      socket.on('student:audio-status', async ({ sessionCode, stepIndex, status }) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (!code) return;
          const room = `session:${code}`;

          const isTeacher = await isSessionTeacher(code, user);
          if (isTeacher) {
            // Un docente non deve mai essere registrato tra gli studenti
            let sessionMap = sessionAudioProgress.get(code);
            if (sessionMap && sessionMap.has(user.id)) {
              sessionMap.delete(user.id);
              const summary = getSessionAudioSummary(code, stepIndex || 0);
              io.to(room).emit('session:students-audio-status', summary);
            }
            return;
          }

          let sessionMap = sessionAudioProgress.get(code);
          if (!sessionMap) {
            sessionMap = new Map();
            sessionAudioProgress.set(code, sessionMap);
          }

          const studentName = `${user.name || ''} ${user.surname || ''}`.trim() || user.email;
          const step = typeof stepIndex === 'number' ? stepIndex : (parseInt(stepIndex, 10) || 0);
          sessionMap.set(user.id, {
            userId: user.id,
            name: studentName,
            status: status || 'listening',
            stepIndex: step,
            updatedAt: new Date()
          });

          const summary = getSessionAudioSummary(code, step);
          console.log(`[Socket.IO] Aggiornato audio status per stanza ${code} (step ${step}): ${summary.completedCount}/${summary.totalStudents} hanno finito`);
          io.to(room).emit('session:students-audio-status', summary);
        } catch (err) {
          console.error('[Socket.IO] Errore in student:audio-status:', err.message);
        }
      });

      /**
       * Docente blocca / sblocca la navigazione libera degli studenti
       */
      socket.on('teacher:toggle-lock', async ({ sessionCode, sessionId, isLocked }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            throw new Error('Solo il docente titolare di questa visita può modificare i permessi di navigazione.');
          }

          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          if (querySessionId) {
            await GroupVisitService.updateProgress(querySessionId, user.id, { isLocked });
          }

          io.to(room).emit('session:lock-toggled', { isLocked });
          if (typeof callback === 'function') callback({ success: true, isLocked });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente invia una trasmissione audio / testo TTS condiviso
       */
      socket.on('teacher:broadcast-audio', async ({ sessionCode, text, language, audioUrl }) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code, user);
          if (!authorized) return;
          if (!code) return;
          const room = `session:${code}`;
          io.to(room).emit('session:audio-play', {
            text,
            language,
            audioUrl
          });
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:broadcast-audio:', err.message);
        }
      });

      /**
       * Studente alza la mano
       */
      socket.on('student:raise-hand', ({ sessionCode }) => {
        try {
          if (!sessionCode) return;
          const room = `session:${sessionCode.toUpperCase().trim()}`;
          const studentName = `${user.name || ''} ${user.surname || ''}`.trim() || user.email;
          io.to(room).emit('session:hand-raised', {
            studentId: user.id,
            studentName: studentName
          });
        } catch (err) {
          console.error('[Socket.IO] Errore in student:raise-hand:', err.message);
        }
      });

      socket.on('session:send-message', async ({ sessionCode, sessionId, text, stepIndex }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          if (!text || !text.trim()) {
            throw new Error('Il testo del messaggio non può essere vuoto.');
          }

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          let senderName = `${user.name || ''} ${user.surname || ''}`.trim();
          if (!senderName && mongoose.Types.ObjectId.isValid(user.id)) {
            try {
              const User = require('../data/model/User');
              const dbUser = await User.findById(user.id).select('name surname').lean();
              if (dbUser) {
                senderName = `${dbUser.name || ''} ${dbUser.surname || ''}`.trim();
              }
            } catch (e) {}
          }
          if (!senderName) {
            senderName = user.role === 'teacher' ? 'Docente' : 'Studente';
          }

          const msgObj = {
            id: new mongoose.Types.ObjectId().toString(),
            senderId: user.id,
            senderName: senderName,
            senderRole: user.role,
            text: text.trim(),
            stepIndex: typeof stepIndex === 'number' ? stepIndex : 0,
            createdAt: new Date()
          };

          if (querySessionId) {
            const studentId = (user.id && mongoose.Types.ObjectId.isValid(user.id))
              ? new mongoose.Types.ObjectId(user.id)
              : undefined;

            try {
              await GroupVisit.findByIdAndUpdate(querySessionId, {
                $push: {
                  questions: {
                    _id: new mongoose.Types.ObjectId(msgObj.id),
                    student: studentId,
                    studentName: senderName,
                    text: text.trim(),
                    stepIndex: msgObj.stepIndex,
                    status: 'pending',
                    createdAt: msgObj.createdAt
                  }
                }
              });
            } catch (dbErr) {
              console.warn('[Socket.IO] Avviso salvataggio messaggio:', dbErr.message);
            }
          }

          io.to(room).emit('session:new-message', msgObj);
          io.to(room).emit('session:new-question', msgObj);
          if (typeof callback === 'function') callback({ success: true, message: msgObj });
        } catch (err) {
          console.error('[Socket.IO] Errore in session:send-message:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      socket.on('student:ask-question', async ({ sessionCode, sessionId, text, stepIndex }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          let senderName = `${user.name || ''} ${user.surname || ''}`.trim();
          if (!senderName && mongoose.Types.ObjectId.isValid(user.id)) {
            try {
              const User = require('../data/model/User');
              const dbUser = await User.findById(user.id).select('name surname').lean();
              if (dbUser) {
                senderName = `${dbUser.name || ''} ${dbUser.surname || ''}`.trim();
              }
            } catch (e) {}
          }
          if (!senderName) {
            senderName = user.role === 'teacher' ? 'Docente' : 'Studente';
          }

          const msgObj = {
            id: new mongoose.Types.ObjectId().toString(),
            senderId: user.id,
            senderName: senderName,
            senderRole: user.role,
            text: (text || '').trim(),
            stepIndex: typeof stepIndex === 'number' ? stepIndex : 0,
            createdAt: new Date()
          };

          if (querySessionId) {
            const studentId = (user.id && mongoose.Types.ObjectId.isValid(user.id))
              ? new mongoose.Types.ObjectId(user.id)
              : undefined;

            try {
              await GroupVisit.findByIdAndUpdate(querySessionId, {
                $push: {
                  questions: {
                    _id: new mongoose.Types.ObjectId(msgObj.id),
                    student: studentId,
                    studentName: senderName,
                    text: msgObj.text,
                    stepIndex: msgObj.stepIndex,
                    status: 'pending',
                    createdAt: msgObj.createdAt
                  }
                }
              });
            } catch (dbErr) {
              console.warn('[Socket.IO] Avviso salvataggio domanda:', dbErr.message);
            }
          }

          io.to(room).emit('session:new-message', msgObj);
          io.to(room).emit('session:new-question', msgObj);
          if (typeof callback === 'function') callback({ success: true, question: msgObj, message: msgObj });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente risponde / archivia una domanda
       */
      socket.on('teacher:resolve-question', async ({ sessionCode, sessionId, questionId, status }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            if (typeof callback === 'function') callback({ success: false, error: 'Solo il docente titolare della visita può gestire le domande.' });
            return;
          }
          const room = `session:${code}`;
          const result = await GroupVisitService.updateQuestionStatus(sessionId, user.id, questionId, status);

          io.to(room).emit('session:question-resolved', result);
          if (typeof callback === 'function') callback({ success: true, result });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      socket.on('teacher:end-session', async ({ sessionCode, sessionId }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            if (typeof callback === 'function') callback({ success: false, error: 'Solo il docente titolare della visita può terminare la sessione.' });
            return;
          }
          if (!code) return;
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          let museumId = null;
          if (querySessionId) {
            const ended = await GroupVisitService.endSession(querySessionId, user.id);
            if (ended?.visit?.museum) {
              museumId = (ended.visit.museum._id || ended.visit.museum.id || ended.visit.museum).toString();
            }
          }

          io.to(room).emit('session:ended', {
            message: 'La visita guidata è stata terminata dal docente.',
            museumId
          });

          sessionAudioProgress.delete(code);
          sessionTeachers.delete(code);

          if (typeof callback === 'function') callback({ success: true, museumId });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      socket.on('teacher:start-quiz', async ({ sessionCode, sessionId, quizId }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            throw new Error('Solo il docente titolare della visita può avviare il quiz.');
          }

          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          const result = await GroupVisitService.startQuiz(querySessionId, user.id, quizId);

          const QuizService = require('../service/QuizService');
          const studentQuiz = await QuizService.getQuizById(quizId, false);

          io.to(room).emit('session:quiz-started', {
            sessionCode: code,
            quizState: 'in_progress',
            quiz: studentQuiz
          });

          if (typeof callback === 'function') {
            callback({
              success: true,
              quiz: result.quiz
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:start-quiz:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      socket.on('student:submit-quiz', async ({ sessionCode, answers }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          const studentName = `${user.name || ''} ${user.surname || ''}`.trim() || user.email;
          const QuizService = require('../service/QuizService');
          const result = await QuizService.submitQuizAnswers(code, user.id, studentName, answers);

          socket.to(room).emit('session:quiz-student-submitted', {
            studentId: user.id,
            studentName,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: result.percentage
          });

          if (typeof callback === 'function') {
            callback({
              success: true,
              ...result
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Errore in student:submit-quiz:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      socket.on('teacher:end-quiz', async ({ sessionCode, sessionId }, callback) => {
        try {
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          const authorized = await isSessionTeacher(code || sessionId, user);
          if (!authorized) {
            throw new Error('Solo il docente titolare della visita può concludere il quiz.');
          }

          if (!code) throw new Error('Codice sessione mancante.');
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          const result = await GroupVisitService.endQuiz(querySessionId, user.id);

          io.to(room).emit('session:quiz-ended', result);

          if (typeof callback === 'function') callback({ success: true, ...result });
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:end-quiz:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Disconnessione
       */
      socket.on('disconnect', async () => {
        try {
          console.log(`[Socket.IO] Disconnessione utente: ${user.email}`);
          if (socket.sessionCode) {
            const room = `session:${socket.sessionCode}`;
            await GroupVisitService.setParticipantOnlineStatus(socket.sessionCode, user.id, false);
            try {
              const updatedSession = await GroupVisitService.getSessionByCode(socket.sessionCode);
              if (updatedSession?.participants) {
                io.to(room).emit('participants:updated', updatedSession.participants);
              }
              let sessionMap = sessionAudioProgress.get(socket.sessionCode);
              if (sessionMap && sessionMap.has(user.id)) {
                sessionMap.delete(user.id);
                const summary = getSessionAudioSummary(socket.sessionCode, updatedSession?.currentStepIndex || 0);
                io.to(room).emit('session:students-audio-status', summary);
              }
            } catch (e) {}

            socket.to(room).emit('participant:left', {
              userId: user.id,
              email: user.email
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Errore gestito in disconnect:', err.message);
        }
      });
    });

  } catch (err) {
    console.warn('[Socket.IO] Non caricato o modulo non trovato. Installare con "npm i socket.io" nel backend se necessario:', err.message);
  }
}

function getIO() {
  return io;
}

module.exports = {
  initGroupVisitSocket,
  getIO
};
