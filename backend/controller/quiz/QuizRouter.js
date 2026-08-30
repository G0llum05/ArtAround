const express = require('express');
const QuizController = require('./QuizController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

/* #swagger.tags = ['Quiz'] */

router.post(
  '/generate',
  authenticateJWT,
  authorizeRoles('teacher', 'museumstaff', 'admin'),
  QuizController.generateQuiz
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('teacher', 'museumstaff', 'admin'),
  QuizController.createCustomQuiz
);

router.get(
  '/visit/:visitId',
  QuizController.getQuizzesByVisit
);

router.get(
  '/:id',
  QuizController.getQuizById
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('teacher', 'museumstaff', 'admin'),
  QuizController.deleteQuiz
);

module.exports = router;
