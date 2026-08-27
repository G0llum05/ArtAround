const GroupVisitService = require('../../service/GroupVisitService');

class GroupVisitController {
  /**
   * POST /api/groupvisit
   * Crea una nuova sessione di visita di gruppo (Riservato a Teacher e Admin)
   */
  static async createSession(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Crea una nuova sessione di visita di gruppo per una classe'
    */
    try {
      const { visitId, title, settings } = req.body;
      const session = await GroupVisitService.createSession(req.user.id, {
        visitId,
        title,
        settings
      });

      res.status(201).json({
        type: 'success',
        message: 'Sessione di visita creata con successo.',
        data: session
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/groupvisit/:id
   * Restituisce i dettagli completi di una sessione di visita per ID
   */
  static async getSessionById(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Recupera i dettagli di una sessione di visita per ID'
    */
    try {
      const session = await GroupVisitService.getSessionById(req.params.id);
      res.status(200).json({
        type: 'success',
        data: session
      });
    } catch (error) {
      res.status(404).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/groupvisit/code/:code
   * Cerca una sessione attiva tramite codice PIN (per lo studente)
   */
  static async getSessionByCode(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Cerca una sessione attiva tramite codice PIN'
    */
    try {
      const session = await GroupVisitService.getSessionByCode(req.params.code);
      res.status(200).json({
        type: 'success',
        data: session
      });
    } catch (error) {
      res.status(404).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/groupvisit/join
   * Uno studente si unisce a una sessione tramite codice PIN
   */
  static async joinSession(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Ingresso di uno studente in una sessione di gruppo tramite PIN'
    */
    try {
      const { sessionCode } = req.body;
      if (!sessionCode) {
        return res.status(400).json({
          type: 'error',
          message: 'Il codice della sessione è obbligatorio.'
        });
      }

      const session = await GroupVisitService.joinSession(sessionCode, req.user.id);
      res.status(200).json({
        type: 'success',
        message: 'Accesso alla sessione completato con successo.',
        data: session
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/groupvisit/my-teaching
   * Restituisce la lista di sessioni create dal docente loggato
   */
  static async getTeacherSessions(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Lista delle sessioni di visita gestite dal docente loggato'
    */
    try {
      const sessions = await GroupVisitService.getTeacherSessions(req.user.id);
      res.status(200).json({
        type: 'success',
        data: sessions
      });
    } catch (error) {
      res.status(500).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/groupvisit/my-participations
   * Restituisce la lista di sessioni a cui l'utente loggato ha partecipato come studente
   */
  static async getStudentSessions(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Lista delle sessioni a cui lo studente loggato ha preso parte'
    */
    try {
      const sessions = await GroupVisitService.getStudentSessions(req.user.id);
      res.status(200).json({
        type: 'success',
        data: sessions
      });
    } catch (error) {
      res.status(500).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/groupvisit/:id/progress
   * Aggiorna lo stato della sessione (tappa corrente, lock navigazione, ecc.)
   */
  static async updateProgress(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Aggiorna la tappa corrente e i parametri della visita (Docente)'
    */
    try {
      const updated = await GroupVisitService.updateProgress(req.params.id, req.user.id, req.body);
      res.status(200).json({
        type: 'success',
        message: 'Progresso aggiornato.',
        data: updated
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/groupvisit/:id/questions
   * Uno studente invia una domanda durante la visita
   */
  static async addQuestion(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Invia una domanda al docente durante la visita'
    */
    try {
      const { text, stepIndex } = req.body;
      const question = await GroupVisitService.addQuestion(req.params.id, req.user.id, text, stepIndex);
      res.status(201).json({
        type: 'success',
        message: 'Domanda inviata con successo.',
        data: question
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/groupvisit/:id/questions/:questionId
   * Il docente risponde o archivia una domanda
   */
  static async updateQuestionStatus(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Aggiorna lo stato di una domanda (Docente)'
    */
    try {
      const { status } = req.body;
      const result = await GroupVisitService.updateQuestionStatus(req.params.id, req.user.id, req.params.questionId, status);
      res.status(200).json({
        type: 'success',
        message: 'Stato domanda aggiornato.',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/groupvisit/:id/end
   * Conclude formalmente la sessione di visita
   */
  static async endSession(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Conclude la sessione di visita di gruppo'
    */
    try {
      const session = await GroupVisitService.endSession(req.params.id, req.user.id);
      res.status(200).json({
        type: 'success',
        message: 'Sessione conclusa con successo.',
        data: session
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }
}

module.exports = GroupVisitController;
