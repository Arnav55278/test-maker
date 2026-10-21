import { describe, it, expect } from 'vitest';
import {
  PEER_COHORT,
  simulatePeerAttempt,
  generateTestLeaderboard,
  generateCumulativeLeaderboard,
} from './cohortSimulation';
import {
  detectClosestScale,
  computeNextTargetPlan,
} from './targetEngine';
import { Question, TestMetadata, TestAttempt, ExamSettings } from '../types/test';

const DEFAULT_SETTINGS: ExamSettings = {
  durationMinutes: 45,
  enableFullscreen: true,
  warnOnFullscreenExit: true,
  warnOnTabSwitch: true,
  showTimer: true,
  showQuestionPalette: true,
  allowMarkForReview: true,
  autoSubmitOnZeroTime: true,
  scoringScheme: 'jee_advanced',
  allowNegativeMarking: true,
  allowPartialMarking: true,
  shuffleQuestions: false,
  enableKeyboardShortcuts: true,
};

const mockQuestions: Question[] = [
  {
    id: 'p_easy',
    subject: 'Physics',
    subtopic: 'Kinematics',
    difficulty: 'Easy',
    type: 'mcq',
    question: 'Easy kinematics problem',
    options: [
      { id: 'A', text: '10 m/s' },
      { id: 'B', text: '20 m/s' },
    ],
    answer: 'A',
    marks: 4,
    negativeMarks: 1,
    timeEstimateSeconds: 90,
  },
  {
    id: 'c_med',
    subject: 'Chemistry',
    subtopic: 'Thermodynamics',
    difficulty: 'Medium',
    type: 'mcq',
    question: 'Enthalpy change',
    options: [
      { id: 'A', text: 'Positive' },
      { id: 'B', text: 'Negative' },
    ],
    answer: 'B',
    marks: 4,
    negativeMarks: 1,
    timeEstimateSeconds: 120,
  },
  {
    id: 'm_hard',
    subject: 'Mathematics',
    subtopic: 'Definite Integrals',
    difficulty: 'Hard',
    type: 'integer',
    question: 'Evaluate integral',
    answer: 4,
    marks: 4,
    negativeMarks: 0,
    timeEstimateSeconds: 180,
  },
];

const mockTest: TestMetadata = {
  id: 'test_demo_1',
  title: 'JEE Advanced Physics & Math Drill',
  description: 'Practice test for cohort simulation testing',
  createdAt: '2026-10-21T00:00:00Z',
  updatedAt: '2026-10-21T00:00:00Z',
  questions: mockQuestions,
  totalMarks: 12,
  durationMinutes: 45,
  defaultSettings: DEFAULT_SETTINGS,
};

const mockUserAttempt: TestAttempt = {
  id: 'att_demo_1',
  testId: 'test_demo_1',
  testTitle: 'JEE Advanced Physics & Math Drill',
  startedAt: '2026-10-21T10:00:00Z',
  submittedAt: '2026-10-21T10:40:00Z',
  status: 'completed',
  timeSpentSeconds: 2400,
  userResponses: {},
  settingsSnapshot: DEFAULT_SETTINGS,
  evaluation: {
    totalQuestions: 3,
    attemptedQuestions: 2,
    correctQuestions: 2,
    incorrectQuestions: 0,
    unattemptedQuestions: 1,
    marksObtained: 8,
    maxMarks: 12,
    percentageScore: 66.7,
    accuracy: 100,
    totalTimeSpentSeconds: 2400,
    subjectBreakdown: {
      Physics: { marks: 4, maxMarks: 4, correct: 1, attempted: 1, accuracy: 100 },
      Chemistry: { marks: 4, maxMarks: 4, correct: 1, attempted: 1, accuracy: 100 },
    },
    questionResults: [],
  },
};

describe('Peer Cohort Roster & Constraints', () => {
  it('contains exactly 15 simulated peers and zero below-average students', () => {
    expect(PEER_COHORT.length).toBe(15);

    // Rule: IQ strictly topper to disciplined average, no one below average
    PEER_COHORT.forEach((peer) => {
      expect(peer.estimatedIq).toBeGreaterThanOrEqual(105);
      expect(peer.sillyMistakeResistance).toBeGreaterThanOrEqual(0.70);
      expect(peer.speedFactor).toBeGreaterThanOrEqual(0.70);
      expect(peer.name.length).toBeGreaterThan(0);
      expect(peer.avatarText.length).toBeGreaterThanOrEqual(2);
      expect(peer.targetAir).toBeDefined();
    });

    // Check tier distributions
    const superToppers = PEER_COHORT.filter((p) => p.tier === 'Super Topper');
    const toppers = PEER_COHORT.filter((p) => p.tier === 'Topper');
    const highAchievers = PEER_COHORT.filter((p) => p.tier === 'High Achiever');
    const aboveAvg = PEER_COHORT.filter((p) => p.tier === 'Above Average');
    const disciplinedAvg = PEER_COHORT.filter((p) => p.tier === 'Disciplined Average');

    expect(superToppers.length).toBe(2);
    expect(toppers.length).toBe(2);
    expect(highAchievers.length).toBe(3);
    expect(aboveAvg.length).toBe(4);
    expect(disciplinedAvg.length).toBe(4);
  });
});

describe('Peer Simulation Engine', () => {
  it('is deterministic for identical test seeds', () => {
    const student = PEER_COHORT[0]; // Aarav Sharma
    const result1 = simulatePeerAttempt(student, mockQuestions, 'mock_test_101', DEFAULT_SETTINGS);
    const result2 = simulatePeerAttempt(student, mockQuestions, 'mock_test_101', DEFAULT_SETTINGS);

    expect(result1.marksObtained).toBe(result2.marksObtained);
    expect(result1.attemptedQuestions).toBe(result2.attemptedQuestions);
    expect(result1.correctQuestions).toBe(result2.correctQuestions);
    expect(result1.accuracy).toBe(result2.accuracy);
  });

  it('reflects topper vs average performance', () => {
    const topper = PEER_COHORT.find((p) => p.tier === 'Super Topper')!;
    const avgStudent = PEER_COHORT.find((p) => p.tier === 'Disciplined Average')!;

    // Run over multiple test variations
    let topperMarksTotal = 0;
    let avgMarksTotal = 0;

    for (let i = 0; i < 5; i++) {
      const resT = simulatePeerAttempt(topper, mockQuestions, `test_round_${i}`, DEFAULT_SETTINGS);
      const resA = simulatePeerAttempt(avgStudent, mockQuestions, `test_round_${i}`, DEFAULT_SETTINGS);
      topperMarksTotal += resT.marksObtained;
      avgMarksTotal += resA.marksObtained;
    }

    expect(topperMarksTotal).toBeGreaterThan(avgMarksTotal);
  });
});

describe('Test & Cumulative Leaderboard Generation', () => {
  it('ranks all 16 aspirants (User + 15 peers) and accurately computes rank', () => {
    const leaderboard = generateTestLeaderboard(mockTest, mockUserAttempt);

    expect(leaderboard.length).toBe(16);
    const userEntry = leaderboard.find((e) => e.isUser);
    expect(userEntry).toBeDefined();
    expect(userEntry?.marksObtained).toBe(8);
    expect(userEntry?.rank).toBeGreaterThanOrEqual(1);
    expect(userEntry?.rank).toBeLessThanOrEqual(16);

    // Verify sorted in descending order of marks
    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].marksObtained).toBeGreaterThanOrEqual(leaderboard[i + 1].marksObtained);
      expect(leaderboard[i].rank).toBeLessThanOrEqual(leaderboard[i + 1].rank);
    }
  });

  it('generates cumulative leaderboard across historical attempts', () => {
    const cumulative = generateCumulativeLeaderboard([mockTest], [mockUserAttempt]);

    expect(cumulative.length).toBe(16);
    expect(cumulative.some((e) => e.isUser)).toBe(true);
    expect(cumulative[0].rank).toBe(1);
  });
});

describe('Next Target Engine (Scales: 60, 100, 180, 300, 360)', () => {
  it('detects standard JEE target scales correctly', () => {
    expect(detectClosestScale(50)).toBe(60);
    expect(detectClosestScale(90)).toBe(100);
    expect(detectClosestScale(180)).toBe(180);
    expect(detectClosestScale(290)).toBe(300);
    expect(detectClosestScale(360)).toBe(360);
  });

  it('computes realistic target goals and tactical conversion blueprints across scales', () => {
    const testLeaderboard = generateTestLeaderboard(mockTest, mockUserAttempt);

    // Current user score = 8 out of 12 (66.7%)
    const plan300 = computeNextTargetPlan(8, 12, testLeaderboard, 300);
    expect(plan300.targetScore).toBeGreaterThan(plan300.scaledCurrentScore);
    expect(plan300.targetScore).toBeLessThanOrEqual(300);
    expect(plan300.standardScale).toBe(300);
    expect(plan300.actionableTactics.strategyDescription.length).toBeGreaterThan(0);
    expect(plan300.actionableTactics.convertUnansweredCount).toBeGreaterThan(0);

    // Test on 60 scale
    const plan60 = computeNextTargetPlan(8, 12, testLeaderboard, 60);
    expect(plan60.standardScale).toBe(60);
    expect(plan60.targetScore).toBeGreaterThan(plan60.scaledCurrentScore);
    expect(plan60.targetScore).toBeLessThanOrEqual(60);

    // Test on 180 scale
    const plan180 = computeNextTargetPlan(8, 12, testLeaderboard, 180);
    expect(plan180.standardScale).toBe(180);
    expect(plan180.targetScore).toBeGreaterThan(plan180.scaledCurrentScore);
    expect(plan180.targetScore).toBeLessThanOrEqual(180);

    // Test on 360 scale
    const plan360 = computeNextTargetPlan(8, 12, testLeaderboard, 360);
    expect(plan360.standardScale).toBe(360);
    expect(plan360.targetScore).toBeGreaterThan(plan360.scaledCurrentScore);
    expect(plan360.targetScore).toBeLessThanOrEqual(360);
  });
});
