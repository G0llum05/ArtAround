export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  relatedArtwork?: string;
  relatedArtworkTitle?: string;
}

export interface Quiz {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  visit: string;
  museum?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  targetAge?: 'bambino' | 'studente' | 'adulto' | 'specialista';
  language?: string;
  questions: QuizQuestion[];
  isAIGenerated?: boolean;
  creator?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizSubmissionAnswer {
  questionIndex: number;
  selectedOption: number;
  isCorrect?: boolean;
}

export interface QuizSubmission {
  student?: string;
  studentName: string;
  answers: QuizSubmissionAnswer[];
  score: number;
  totalQuestions: number;
  percentage?: number;
  submittedAt?: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  evaluatedAnswers: QuizSubmissionAnswer[];
  quizDetails?: Quiz;
}
