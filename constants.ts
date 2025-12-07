import { QuizSettings, Difficulty, QuestionType, ScoringType } from './types';

export const DEFAULT_SETTINGS: QuizSettings = {
  numberOfQuestions: 10,
  difficulty: Difficulty.Mixed,
  questionTypes: [QuestionType.MultipleChoice, QuestionType.TrueFalse],
  maxCharsPerQuestion: 150,
  maxCharsPerAnswer: 50,
  scoringType: ScoringType.Standard,
  explanationsEnabled: true,
};

export const MAX_QUESTIONS_LIMIT = 200; // Increased limit
export const MIN_QUESTIONS_LIMIT = 1;

export const PLACEHOLDER_TEXT = `Paste your study notes, article text, or documentation here...`;

export const WELCOME_MESSAGE = "YOUR HOME FOR LEARNING";

export const DAILY_QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you.",
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "Expertise is not a destination, but a journey.",
  "Study hard, for the well is deep, and our brains are shallow.",
  "Learning never exhausts the mind.",
  "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Don't let what you cannot do interfere with what you can do.",
  "Strive for progress, not perfection."
];