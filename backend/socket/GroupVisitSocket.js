const mongoose = require('mongoose');
const TokenService = require('../service/TokenService');
const GroupVisitService = require('../service/GroupVisitService');
const GroupVisit = require('../data/model/GroupVisit');

let io = null;

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
          name: decoded.name,
          surname: decoded.surname
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

          const room = `session:${sessionCode.toUpperCase().trim()}`;
          socket.join(room);
          socket.sessionCode = sessionCode.toUpperCase().trim();

          // Registra l'ingresso nel DB
          await GroupVisitService.setParticipantOnlineStatus(sessionCode, user.id, true);
          const updatedSession = await GroupVisitService.getSessionByCode(sessionCode);

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

          // Invia stato corrente al client che si è appena collegato
          if (typeof callback === 'function') {
            callback({
              success: true,
              session: updatedSession
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
          if (user.role !== 'teacher' && user.role !== 'admin') {
            throw new Error('Solo il docente o un amministratore può avviare la visita.');
          }

          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
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
          if (user.role !== 'teacher' && user.role !== 'admin') {
            throw new Error('Solo il docente può cambiare tappa.');
          }

          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
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

          console.log(`[Socket.IO] Broadcast cambio tappa a stanza ${room}: nuovo step ${updated?.currentStepIndex ?? stepIndex}`);

          // Broadcast dello step aggiornato a tutti gli studenti nella stanza
          io.to(room).emit('session:step-changed', {
            stepIndex: updated ? updated.currentStepIndex : stepIndex,
            activeItem: updated?.activeItem || activeItem
          });

          if (typeof callback === 'function') callback({ success: true, stepIndex: updated ? updated.currentStepIndex : stepIndex });
        } catch (err) {
          console.error('[Socket.IO] Errore in teacher:step-change:', err.message);
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente blocca / sblocca la navigazione libera degli studenti
       */
      socket.on('teacher:toggle-lock', async ({ sessionCode, sessionId, isLocked }, callback) => {
        try {
          if (user.role !== 'teacher' && user.role !== 'admin') {
            throw new Error('Solo il docente può modificare i permessi di navigazione.');
          }

          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
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
      socket.on('teacher:broadcast-audio', ({ sessionCode, text, language, audioUrl }) => {
        try {
          if (user.role !== 'teacher' && user.role !== 'admin') return;
          if (!sessionCode) return;
          const room = `session:${sessionCode.toUpperCase().trim()}`;
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

      /**
       * Studente invia una domanda testuale
       */
      socket.on('student:ask-question', async ({ sessionCode, sessionId, text, stepIndex }, callback) => {
        try {
          const room = `session:${sessionCode.toUpperCase().trim()}`;
          const question = await GroupVisitService.addQuestion(sessionId, user.id, text, stepIndex);

          io.to(room).emit('session:new-question', question);
          if (typeof callback === 'function') callback({ success: true, question });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente risponde / archivia una domanda
       */
      socket.on('teacher:resolve-question', async ({ sessionCode, sessionId, questionId, status }, callback) => {
        try {
          if (user.role !== 'teacher' && user.role !== 'admin') return;
          const room = `session:${sessionCode.toUpperCase().trim()}`;
          const result = await GroupVisitService.updateQuestionStatus(sessionId, user.id, questionId, status);

          io.to(room).emit('session:question-resolved', result);
          if (typeof callback === 'function') callback({ success: true, result });
        } catch (err) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      });

      /**
       * Docente termina la visita di gruppo
       */
      socket.on('teacher:end-session', async ({ sessionCode, sessionId }, callback) => {
        try {
          if (user.role !== 'teacher' && user.role !== 'admin') return;
          const code = (sessionCode || socket.sessionCode)?.toUpperCase().trim();
          if (!code) return;
          const room = `session:${code}`;

          let querySessionId = sessionId;
          if (!querySessionId || !mongoose.Types.ObjectId.isValid(querySessionId)) {
            const found = await GroupVisit.findOne({ sessionCode: code });
            if (found) querySessionId = found._id.toString();
          }

          if (querySessionId) {
            await GroupVisitService.endSession(querySessionId, user.id);
          }

          io.to(room).emit('session:ended', {
            message: 'La visita guidata è stata terminata dal docente.'
          });

          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
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
