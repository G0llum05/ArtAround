const mongoose = require('mongoose');
const Quiz = require('../data/model/Quiz');
const Visit = require('../data/model/Visit');
const Artwork = require('../data/model/Artwork');
const GroupVisit = require('../data/model/GroupVisit');
const LLMService = require('./LLMService');

class QuizService {

  static async generateQuizWithLLM(visitId, creatorId, settings = {}) {
    if (!visitId) {
      throw new Error('ID visita obbligatorio per generare il quiz.');
    }

    const visit = await Visit.findById(visitId)
      .populate({
        path: 'steps.artwork',
        populate: { path: 'artists' }
      })
      .exec();

    if (!visit) {
      throw new Error('Visita non trovata.');
    }

    const artworksContext = (visit.steps || []).map((step, idx) => {
      const art = step.artwork;
      if (!art) return null;
      const artistNames = Array.isArray(art.artists)
        ? art.artists.map(a => `${a.name || ''} ${a.surname || ''}`.trim()).filter(Boolean).join(', ')
        : 'Autore sconosciuto';

      return {
        stepIndex: idx,
        artworkId: art._id ? art._id.toString() : null,
        title: art.title,
        startYear: art.startYear,
        endYear: art.endYear,
        artistName: artistNames,
        artisticCurrents: art.artisticCurrents || [],
        details: art.details || {}
      };
    }).filter(Boolean);

    const visitContext = {
      id: visit._id.toString(),
      title: visit.title,
      description: visit.description
    };

    const generatedData = await LLMService.generateQuiz(visitContext, artworksContext, settings);

    const titleToIdMap = new Map();
    for (const art of artworksContext) {
      if (art.title && art.artworkId) {
        titleToIdMap.set(art.title.toLowerCase().trim(), art.artworkId);
      }
    }

    const questions = (generatedData.questions || []).map(q => {
      let matchedArtworkId = null;
      if (q.relatedArtworkTitle) {
        matchedArtworkId = titleToIdMap.get(q.relatedArtworkTitle.toLowerCase().trim()) || null;
      }
      return {
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || '',
        relatedArtwork: matchedArtworkId ? new mongoose.Types.ObjectId(matchedArtworkId) : null
      };
    });

    const newQuiz = new Quiz({
      title: generatedData.title || `Quiz: ${visit.title}`,
      description: generatedData.description || `Quiz finale per la visita ${visit.title}`,
      visit: visit._id,
      difficulty: settings.difficulty || generatedData.difficulty || 'medium',
      targetAge: settings.targetAge || generatedData.targetAge || 'studente',
      language: settings.language || generatedData.language || 'it',
      questions: questions,
      isAIGenerated: true,
      creator: creatorId || null
    });

    const savedQuiz = await newQuiz.save();

    await Visit.findByIdAndUpdate(visit._id, {
      $addToSet: { quizzes: savedQuiz._id }
    });

    return savedQuiz;
  }

  static async getQuizzesByVisit(visitId) {
    if (!visitId) {
      throw new Error('ID visita obbligatorio.');
    }
    return await Quiz.find({ visit: visitId })
      .populate('creator', 'name surname email role')
      .populate('questions.relatedArtwork', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async getQuizById(quizId, includeAnswers = true) {
    if (!quizId) {
      throw new Error('ID quiz obbligatorio.');
    }
    const quiz = await Quiz.findById(quizId)
      .populate('visit', 'title description')
      .populate('creator', 'name surname email role')
      .populate('questions.relatedArtwork', 'title')
      .exec();

    if (!quiz) {
      throw new Error('Quiz non trovato.');
    }

    if (includeAnswers) {
      return quiz;
    }

    const sanitizedQuiz = quiz.toObject();
    sanitizedQuiz.questions = sanitizedQuiz.questions.map(q => {
      const { correctAnswerIndex, explanation, ...rest } = q;
      return rest;
    });

    return sanitizedQuiz;
  }

  static async createCustomQuiz(visitId, creatorId, quizData) {
    if (!visitId) {
      throw new Error('ID visita obbligatorio.');
    }
    if (!quizData?.title || !Array.isArray(quizData?.questions) || quizData.questions.length === 0) {
      throw new Error('Il quiz deve contenere un titolo e almeno una domanda.');
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      throw new Error('Visita non trovata.');
    }

    const newQuiz = new Quiz({
      title: quizData.title.trim(),
      description: quizData.description || '',
      visit: visit._id,
      difficulty: quizData.difficulty || 'medium',
      targetAge: quizData.targetAge || 'studente',
      language: quizData.language || 'it',
      questions: quizData.questions,
      isAIGenerated: false,
      creator: creatorId || null
    });

    const savedQuiz = await newQuiz.save();

    await Visit.findByIdAndUpdate(visit._id, {
      $addToSet: { quizzes: savedQuiz._id }
    });

    return savedQuiz;
  }

  static async deleteQuiz(quizId, userId, userRole) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz non trovato.');
    }

    const isAuthorized = userRole === 'admin' || userRole === 'museumstaff' || (quiz.creator && quiz.creator.toString() === userId.toString());
    if (!isAuthorized) {
      throw new Error('Non sei autorizzato a eliminare questo quiz.');
    }

    await Visit.findByIdAndUpdate(quiz.visit, {
      $pull: { quizzes: quiz._id }
    });

    await Quiz.findByIdAndDelete(quizId);
    return { success: true, message: 'Quiz eliminato con successo.' };
  }

  static async submitQuizAnswers(sessionCode, studentId, studentName, submittedAnswers = []) {
    const code = sessionCode?.toUpperCase().trim();
    const session = await GroupVisit.findOne({ sessionCode: code }).populate('activeQuiz');

    if (!session) {
      throw new Error('Sessione di gruppo non trovata.');
    }

    if (!session.activeQuiz) {
      throw new Error('Nessun quiz attivo per questa sessione.');
    }

    const quiz = session.activeQuiz;
    const questions = quiz.questions || [];
    let score = 0;

    const evaluatedAnswers = submittedAnswers.map(ans => {
      const qIndex = Number(ans.questionIndex);
      const sOption = Number(ans.selectedOption);
      const question = questions[qIndex];
      const isCorrect = question ? question.correctAnswerIndex === sOption : false;

      if (isCorrect) {
        score += 1;
      }

      return {
        questionIndex: qIndex,
        selectedOption: sOption,
        isCorrect
      };
    });

    const User = require('../data/model/User');
    const userDoc = await User.findById(studentId).lean();
    const sName = userDoc?.name || studentName || 'Studente';
    const sSurname = userDoc?.surname || '';
    const sEmail = userDoc?.email || '';

    const submission = {
      student: new mongoose.Types.ObjectId(studentId),
      studentName: sName,
      studentSurname: sSurname,
      studentEmail: sEmail,
      answers: evaluatedAnswers,
      score: score,
      totalQuestions: questions.length,
      submittedAt: new Date()
    };

    const existingIndex = session.quizSubmissions.findIndex(
      s => s.student.toString() === studentId.toString()
    );

    if (existingIndex >= 0) {
      session.quizSubmissions[existingIndex] = submission;
    } else {
      session.quizSubmissions.push(submission);
    }

    await session.save();

    return {
      score,
      totalQuestions: questions.length,
      percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
      evaluatedAnswers,
      quizDetails: quiz
    };
  }
}

module.exports = QuizService;
