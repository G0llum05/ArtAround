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
   * POST /api/groupvisit/leave
   * Uno studente lascia la sessione di visita
   */
  static async leaveSession(req, res) {
    /* #swagger.tags = ['Group Visit']
       #swagger.summary = 'Uscita di uno studente dalla sessione di gruppo'
    */
    try {
      const { sessionCode } = req.body;
      if (sessionCode) {
        await GroupVisitService.setParticipantOnlineStatus(sessionCode, req.user.id, false);
      }
      res.status(200).json({
        type: 'success',
        message: 'Uscita dalla sessione completata.'
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
