
export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Mixed = 'Mixed',
}

export enum QuestionType {
  MultipleChoice = 'multiple_choice',
  TrueFalse = 'true_false',
  Identification = 'identification',
  FillInBlank = 'fill_in_blank',
}

export enum ScoringType {
  Standard = 'Standard',   // 1 point per question
  Weighted = 'Weighted',   // Harder = more points
  Percentage = 'Percentage' // 0-100%
}

export interface QuizSettings {
  numberOfQuestions: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
  maxCharsPerQuestion: number;
  maxCharsPerAnswer: number;
  scoringType: ScoringType;
  explanationsEnabled: boolean;
}

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // For MC and TF
  correct_answer: string;
  explanation?: string;
}

export interface StudyPlanItem {
  day: string;
  topic: string;
  activity: string;
}

export interface QuizMetadata {
  source: string;
  number_of_questions: number;
  difficulty: string;
  types: string[];
}

export interface QuizData {
  metadata: QuizMetadata;
  questions: Question[];
  summary?: string;
  keywords?: string[];
  study_plan?: StudyPlanItem[];
}

export interface QuizSession {
  id: string;
  timestamp: number;
  title: string;
  data: QuizData;
  score?: number; // Last score
}

export enum AppState {
  Input = 'Input',
  Generating = 'Generating',
  Quiz = 'Quiz',
  Flashcards = 'Flashcards',
  MemoryMatch = 'MemoryMatch', // New Game Mode
  Results = 'Results',
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 or Text
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  questionsAnswered: number;
}
