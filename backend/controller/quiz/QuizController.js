const QuizService = require('../../service/QuizService');

class QuizController {

  static async generateQuiz(req, res) {
    /* #swagger.tags = ['Quiz']
       #swagger.summary = 'Genera un nuovo quiz con AI per una visita'
    */
    try {
      const { visitId, numberOfQuestions, difficulty, targetAge, language } = req.body;
      const quiz = await QuizService.generateQuizWithLLM(visitId, req.user.id, {
        numberOfQuestions: numberOfQuestions ? Number(numberOfQuestions) : 5,
        difficulty,
        targetAge,
        language
      });

      res.status(201).json({
        type: 'success',
        message: 'Quiz generato con successo tramite AI.',
        data: quiz
      });
    } catch (err) {
      res.status(400).json({
        type: 'error',
        message: err.message || 'Errore durante la generazione del quiz.'
      });
    }
  }

  static async createCustomQuiz(req, res) {
    /* #swagger.tags = ['Quiz']
       #swagger.summary = 'Crea un quiz personalizzato per una visita'
    */
    try {
      const { visitId, ...quizData } = req.body;
      const quiz = await QuizService.createCustomQuiz(visitId, req.user.id, quizData);

      res.status(201).json({
        type: 'success',
        message: 'Quiz creato con successo.',
        data: quiz
      });
    } catch (err) {
      res.status(400).json({
        type: 'error',
        message: err.message || 'Errore durante la creazione del quiz.'
      });
    }
  }

  static async getQuizzesByVisit(req, res) {
    /* #swagger.tags = ['Quiz']
       #swagger.summary = 'Ottiene la lista dei quiz associati a una visita'
    */
    try {
      const quizzes = await QuizService.getQuizzesByVisit(req.params.visitId);
      res.status(200).json({
        type: 'success',
        data: quizzes
      });
    } catch (err) {
      res.status(400).json({
        type: 'error',
        message: err.message || 'Errore durante il recupero dei quiz.'
      });
    }
  }

  static async getQuizById(req, res) {
    /* #swagger.tags = ['Quiz']
       #swagger.summary = 'Ottiene il dettaglio di un quiz'
    */
    try {
      const includeAnswers = req.query.includeAnswers !== 'false';
      const quiz = await QuizService.getQuizById(req.params.id, includeAnswers);
      res.status(200).json({
        type: 'success',
        data: quiz
      });
    } catch (err) {
      res.status(404).json({
        type: 'error',
        message: err.message || 'Quiz non trovato.'
      });
    }
  }

  static async deleteQuiz(req, res) {
    /* #swagger.tags = ['Quiz']
       #swagger.summary = 'Elimina un quiz'
    */
    try {
      const result = await QuizService.deleteQuiz(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        type: 'success',
        message: result.message
      });
    } catch (err) {
      res.status(400).json({
        type: 'error',
        message: err.message || 'Errore durante l\'eliminazione del quiz.'
      });
    }
  }
}

module.exports = QuizController;
