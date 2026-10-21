import { QuestionType } from './test';

export type StudentTier = 'Super Topper' | 'Topper' | 'High Achiever' | 'Above Average' | 'Disciplined Average';

export interface PeerStudent {
  id: string;
  name: string;
  avatarText: string;
  avatarBg: string;
  estimatedIq: number; // 108 to 148 (strictly no one below average)
  tier: StudentTier;
  targetAir: string; // e.g. "AIR 45", "AIR 250", "AIR 15,000"
  tagline: string;
  subjectProficiency: {
    Physics: number; // 0.65 to 0.98
    Chemistry: number;
    Mathematics: number;
  };
  typeMastery: Record<QuestionType, number>; // 0.60 to 0.96
  speedFactor: number; // 0.75 (fastest) to 1.30 (steady)
  sillyMistakeResistance: number; // 0.60 to 0.95
}

export interface PeerSimulationQuestionResult {
  questionId: string;
  isAttempted: boolean;
  isCorrect: boolean;
  marksObtained: number;
  timeSpentSeconds: number;
}

export interface PeerTestResult {
  studentId: string;
  studentName: string;
  tier: StudentTier;
  marksObtained: number;
  maxMarks: number;
  percentageScore: number;
  accuracy: number;
  totalTimeSpentSeconds: number;
  attemptedQuestions: number;
  correctQuestions: number;
  subjectBreakdown: Record<string, { marks: number; maxMarks: number; accuracy: number }>;
  questionResults: Record<string, PeerSimulationQuestionResult>;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  isUser: boolean;
  tier: StudentTier;
  targetAir: string;
  avatarText: string;
  avatarBg: string;
  marksObtained: number;
  maxMarks: number;
  percentageScore: number;
  accuracy: number;
  timeSpentSeconds: number;
  scoreDeltaToUser: number; // peer - user
}

export type TargetScale = 60 | 100 | 180 | 300 | 360;

export interface NextTargetPlan {
  standardScale: TargetScale;
  scaledCurrentScore: number;
  targetScore: number;
  pointsToGain: number;
  targetPercentile: number;
  targetRank: number; // e.g. Rank 3 of 16
  nextPeerToOvertake?: {
    name: string;
    rank: number;
    marksNeeded: number;
  };
  actionableTactics: {
    reduceNegativesCount: number;
    convertUnansweredCount: number;
    focusSubject: string;
    strategyDescription: string;
  };
}
