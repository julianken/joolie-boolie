// Question types
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'image';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  correctAnswer: string;
  wrongAnswers?: string[];  // For multiple choice
  category?: string;
  difficulty?: 'easy' | 'medium';
  imageUrl?: string;
  audioUrl?: string;
}

// Team
export interface Team {
  id: string;
  name: string;
  score: number;
  color?: string;
}

// Game state
export type GameStatus = 'idle' | 'playing' | 'paused' | 'showing_answer' | 'ended';

export interface TriviaGameState {
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  currentQuestionIndex: number;
  questionsPerRound: number;
  currentQuestion: Question | null;
  teams: Team[];
  timerSeconds: number;
  timerRunning: boolean;
  showAnswer: boolean;
  audioEnabled: boolean;
}

// Sync message types
export type TriviaSyncMessageType =
  | 'STATE_UPDATE'
  | 'REQUEST_SYNC'
  | 'TIMER_TICK'
  | 'ANSWER_REVEALED'
  | 'SCORE_UPDATED';

export interface TriviaSyncMessage {
  type: TriviaSyncMessageType;
  payload: TriviaGameState | null;
  timestamp: number;
}

// Question bank
export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
  category?: string;
  createdAt: string;
}

// API types
export interface CreateQuestionRequest {
  text: string;
  type: QuestionType;
  correctAnswer: string;
  wrongAnswers?: string[];
  category?: string;
  difficulty?: 'easy' | 'medium';
  imageUrl?: string;
}

// Template types
export interface TriviaTemplate {
  id: string;
  userId: string;
  name: string;
  rounds: number;
  questionsPerRound: number;
  timerSeconds: number;
  audioEnabled: boolean;
  questionSetIds?: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
