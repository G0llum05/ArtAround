const TokenService = require('../service/TokenService');
const GroupVisitService = require('../service/GroupVisitService');

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
        origin: '*', // O configurato con il frontend URL
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    console.log('[Socket.IO] Inizializzato con successo.');

    // Middleware di autenticazione per Handshake Socket
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Autenticazione richiesta per la connessione WebSocket.'));
        }

        const decoded = TokenService.verifyAccessToken(token);
        socket.user = decoded; // { id, email, role, ... }
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
       * Docente cambia tappa dell'itinerario
       */
      socket.on('teacher:step-change', async ({ sessionCode, sessionId, stepIndex, activeItem }, callback) => {
        try {
          if (user.role !== 'teacher' && user.role !== 'admin') {
            throw new Error('Solo il docente può cambiare tappa.');
          }

          const room = `session:${sessionCode.toUpperCase().trim()}`;
          const updated = await GroupVisitService.updateProgress(sessionId, user.id, {
            currentStepIndex: stepIndex,
            activeItem: activeItem
          });

          // Broadcast dello step aggiornato a tutti gli studenti nella stanza
          io.to(room).emit('session:step-changed', {
            stepIndex: updated.currentStepIndex,
            activeItem: updated.activeItem
          });

          if (typeof callback === 'function') callback({ success: true, stepIndex: updated.currentStepIndex });
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

          const room = `session:${sessionCode.toUpperCase().trim()}`;
          await GroupVisitService.updateProgress(sessionId, user.id, { isLocked });

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
        if (user.role !== 'teacher' && user.role !== 'admin') return;
        const room = `session:${sessionCode.toUpperCase().trim()}`;
        io.to(room).emit('session:audio-play', {
          text,
          language,
          audioUrl
        });
      });

      /**
       * Studente alza la mano
       */
      socket.on('student:raise-hand', ({ sessionCode }) => {
        const room = `session:${sessionCode.toUpperCase().trim()}`;
        const studentName = `${user.name || ''} ${user.surname || ''}`.trim() || user.email;
        io.to(room).emit('session:hand-raised', {
          studentId: user.id,
          studentName: studentName
        });
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
          const room = `session:${sessionCode.toUpperCase().trim()}`;
          await GroupVisitService.endSession(sessionId, user.id);

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
        console.log(`[Socket.IO] Disconnessione utente: ${user.email}`);
        if (socket.sessionCode) {
          const room = `session:${socket.sessionCode}`;
          await GroupVisitService.setParticipantOnlineStatus(socket.sessionCode, user.id, false);
          socket.to(room).emit('participant:left', {
            userId: user.id,
            email: user.email
          });
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
