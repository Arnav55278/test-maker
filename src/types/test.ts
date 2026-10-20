export type QuestionType = 'mcq' | 'multiple' | 'integer' | 'matching' | 'paragraph';

export interface BaseQuestion {
  id: string;
  subject: string;
  subtopic?: string;
  question: string;
  type: QuestionType;
  marks?: number;
  negativeMarks?: number;
  timeEstimateSeconds?: number;
  solution?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface McqOption {
  id: string;
  text: string;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  options: McqOption[];
  answer: string;
}

export interface MultipleCorrectQuestion extends BaseQuestion {
  type: 'multiple';
  options: McqOption[];
  answers: string[];
}

export interface IntegerQuestion extends BaseQuestion {
  type: 'integer';
  answer: number;
  tolerance?: number; // e.g. ±0.01 for decimals
  allowDecimals?: boolean;
}

export interface MatchingItem {
  id: string;
  text: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  columnA: MatchingItem[];
  columnB: MatchingItem[];
  correctMatch: Record<string, string>; // e.g. { "A": "3", "B": "2" }
}

export type SubQuestion = McqQuestion | MultipleCorrectQuestion | IntegerQuestion | MatchingQuestion;

export interface ParagraphQuestion extends BaseQuestion {
  type: 'paragraph';
  paragraph: string;
  parts: SubQuestion[];
}

export type Question = McqQuestion | MultipleCorrectQuestion | IntegerQuestion | MatchingQuestion | ParagraphQuestion;

// Flattened question for test attempt navigation and palette
export interface FlattenedQuestion {
  globalIndex: number; // 0-based
  displayNumber: number; // 1-based
  parentId?: string; // if part of paragraph
  parentParagraphText?: string;
  subIndex?: number;
  subTotal?: number;
  question: SubQuestion;
}

export interface ExamSettings {
  durationMinutes: number;
  enableFullscreen: boolean;
  warnOnFullscreenExit: boolean;
  warnOnTabSwitch: boolean;
  showTimer: boolean;
  showQuestionPalette: boolean;
  allowMarkForReview: boolean;
  autoSubmitOnZeroTime: boolean;
  scoringScheme: 'jee_advanced' | 'jee_main' | 'custom';
  allowNegativeMarking: boolean;
  allowPartialMarking: boolean;
  shuffleQuestions: boolean;
  enableKeyboardShortcuts: boolean;
  toleranceForDecimals?: number;
}

export interface TestMetadata {
  id: string;
  title: string;
  description?: string;
  targetExam?: 'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'Custom';
  createdAt: string;
  updatedAt: string;
  totalQuestions: number;
  totalSubQuestions: number;
  totalMarks: number;
  estimatedSolvingMinutes: number;
  questions: Question[];
  rawJson?: string;
}

export type QuestionAttemptStatus = 'not_visited' | 'visited_unanswered' | 'answered' | 'marked_for_review' | 'answered_marked';

export interface UserResponse {
  questionId: string;
  status: QuestionAttemptStatus;
  selectedOption?: string; // for mcq
  selectedOptions?: string[]; // for multiple
  numericalAnswer?: string; // for integer / float
  matchingSelections?: Record<string, string>; // for matching e.g. { A: "1", B: "2" }
  timeSpentSeconds: number;
  visitedCount: number;
}

export interface QuestionEvaluation {
  questionId: string;
  globalIndex: number;
  subject: string;
  subtopic: string;
  type: QuestionType;
  isCorrect: boolean;
  isPartial: boolean;
  isAttempted: boolean;
  userAnswerSummary: string;
  correctAnswerSummary: string;
  marksObtained: number;
  maxMarks: number;
  negativeMarks: number;
  timeSpentSeconds: number;
  timeEstimateSeconds: number;
  status: 'correct' | 'incorrect' | 'partial' | 'unanswered';
  speedCategory: 'fast_correct' | 'slow_correct' | 'fast_incorrect' | 'slow_incorrect' | 'skipped';
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  startTime: string; // ISO
  endTime?: string;
  deadlineTime: string; // ISO
  submittedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  settingsSnapshot: ExamSettings;
  questionsSnapshot: Question[];
  responses: Record<string, UserResponse>; // questionId -> UserResponse
  tabSwitchCount: number;
  fullscreenExitCount: number;
  evaluation?: AttemptEvaluation;
}

export interface AttemptEvaluation {
  totalQuestions: number;
  attemptedQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  unansweredQuestions: number;
  partialQuestions: number;
  maxMarks: number;
  marksObtained: number;
  percentageScore: number;
  accuracy: number;
  attemptRate: number;
  totalTimeSpentSeconds: number;
  averageTimePerQuestion: number;
  averageTimePerAttempted: number;
  averageTimePerCorrect: number;
  subjectBreakdown: Record<string, {
    totalQuestions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    marksObtained: number;
    maxMarks: number;
    accuracy: number;
    timeSpentSeconds: number;
  }>;
  topicBreakdown: Record<string, {
    subject: string;
    total: number;
    attempted: number;
    correct: number;
    accuracy: number;
    averageTimeSeconds: number;
  }>;
  questionEvaluations: QuestionEvaluation[];
}
