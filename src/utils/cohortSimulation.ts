import {
  PeerStudent,
  PeerTestResult,
  PeerSimulationQuestionResult,
  LeaderboardEntry,
} from '../types/cohort';
import { Question, TestMetadata, TestAttempt, ExamSettings } from '../types/test';
import { flattenQuestions } from './evaluation';

// The 15 Peer JEE Aspirants: Strictly from Top 50 AIR down to Disciplined Average (no below average)
export const PEER_COHORT: PeerStudent[] = [
  {
    id: 'peer-aarav-sharma',
    name: 'Aarav Sharma',
    avatarText: 'AS',
    avatarBg: 'bg-amber-600',
    estimatedIq: 146,
    tier: 'Super Topper',
    targetAir: 'AIR < 50',
    tagline: 'Kota Star Batch • Physics Olympiad Medalist',
    subjectProficiency: { Physics: 0.96, Chemistry: 0.91, Mathematics: 0.94 },
    typeMastery: { mcq: 0.96, multiple: 0.90, integer: 0.94, matching: 0.95, paragraph: 0.92 },
    speedFactor: 0.80,
    sillyMistakeResistance: 0.94,
  },
  {
    id: 'peer-ishaan-verma',
    name: 'Ishaan Verma',
    avatarText: 'IV',
    avatarBg: 'bg-emerald-600',
    estimatedIq: 142,
    tier: 'Super Topper',
    targetAir: 'AIR 120',
    tagline: 'Calculus Prodigy • High Speed & Blitz Solver',
    subjectProficiency: { Physics: 0.90, Chemistry: 0.88, Mathematics: 0.97 },
    typeMastery: { mcq: 0.94, multiple: 0.88, integer: 0.95, matching: 0.92, paragraph: 0.90 },
    speedFactor: 0.75,
    sillyMistakeResistance: 0.90,
  },
  {
    id: 'peer-ananya-sen',
    name: 'Ananya Sen',
    avatarText: 'AS',
    avatarBg: 'bg-purple-600',
    estimatedIq: 139,
    tier: 'Topper',
    targetAir: 'AIR 280',
    tagline: 'Inorganic Chem Virtuoso • Flawless Memory Retention',
    subjectProficiency: { Physics: 0.89, Chemistry: 0.97, Mathematics: 0.88 },
    typeMastery: { mcq: 0.93, multiple: 0.89, integer: 0.90, matching: 0.96, paragraph: 0.94 },
    speedFactor: 0.82,
    sillyMistakeResistance: 0.92,
  },
  {
    id: 'peer-rohan-kulkarni',
    name: 'Rohan Kulkarni',
    avatarText: 'RK',
    avatarBg: 'bg-blue-600',
    estimatedIq: 136,
    tier: 'Topper',
    targetAir: 'AIR 450',
    tagline: 'Disciplined Problem Solver • Zero Unforced Errors',
    subjectProficiency: { Physics: 0.92, Chemistry: 0.87, Mathematics: 0.89 },
    typeMastery: { mcq: 0.92, multiple: 0.86, integer: 0.89, matching: 0.93, paragraph: 0.90 },
    speedFactor: 0.88,
    sillyMistakeResistance: 0.93,
  },
  {
    id: 'peer-diya-patel',
    name: 'Diya Patel',
    avatarText: 'DP',
    avatarBg: 'bg-rose-600',
    estimatedIq: 133,
    tier: 'High Achiever',
    targetAir: 'AIR 850',
    tagline: 'Hyderabad Tech Campus • Rigorous Electro & Organic Prep',
    subjectProficiency: { Physics: 0.86, Chemistry: 0.90, Mathematics: 0.87 },
    typeMastery: { mcq: 0.90, multiple: 0.83, integer: 0.86, matching: 0.91, paragraph: 0.88 },
    speedFactor: 0.86,
    sillyMistakeResistance: 0.88,
  },
  {
    id: 'peer-siddharth-nair',
    name: 'Siddharth Nair',
    avatarText: 'SN',
    avatarBg: 'bg-cyan-600',
    estimatedIq: 130,
    tier: 'High Achiever',
    targetAir: 'AIR 1,200',
    tagline: 'Mechanics & Coordinate Geometry Specialist',
    subjectProficiency: { Physics: 0.89, Chemistry: 0.81, Mathematics: 0.90 },
    typeMastery: { mcq: 0.89, multiple: 0.81, integer: 0.88, matching: 0.89, paragraph: 0.86 },
    speedFactor: 0.90,
    sillyMistakeResistance: 0.86,
  },
  {
    id: 'peer-tanvi-deshmukh',
    name: 'Tanvi Deshmukh',
    avatarText: 'TD',
    avatarBg: 'bg-indigo-600',
    estimatedIq: 127,
    tier: 'High Achiever',
    targetAir: 'AIR 1,900',
    tagline: 'High Attempt Rate • Aggressive Option Strategy',
    subjectProficiency: { Physics: 0.84, Chemistry: 0.85, Mathematics: 0.84 },
    typeMastery: { mcq: 0.88, multiple: 0.79, integer: 0.83, matching: 0.88, paragraph: 0.84 },
    speedFactor: 0.82,
    sillyMistakeResistance: 0.82,
  },
  {
    id: 'peer-aditya-gupta',
    name: 'Aditya Gupta',
    avatarText: 'AG',
    avatarBg: 'bg-teal-600',
    estimatedIq: 125,
    tier: 'Above Average',
    targetAir: 'AIR 2,800',
    tagline: 'Formula Machine • Physical Chem & Modern Physics',
    subjectProficiency: { Physics: 0.85, Chemistry: 0.86, Mathematics: 0.79 },
    typeMastery: { mcq: 0.86, multiple: 0.77, integer: 0.82, matching: 0.87, paragraph: 0.82 },
    speedFactor: 0.92,
    sillyMistakeResistance: 0.84,
  },
  {
    id: 'peer-sneha-reddy',
    name: 'Sneha Reddy',
    avatarText: 'SR',
    avatarBg: 'bg-fuchsia-600',
    estimatedIq: 123,
    tier: 'Above Average',
    targetAir: 'AIR 3,600',
    tagline: 'Balanced PCM Aspirant • Steady & Resilient',
    subjectProficiency: { Physics: 0.82, Chemistry: 0.83, Mathematics: 0.82 },
    typeMastery: { mcq: 0.85, multiple: 0.75, integer: 0.80, matching: 0.86, paragraph: 0.81 },
    speedFactor: 0.95,
    sillyMistakeResistance: 0.83,
  },
  {
    id: 'peer-kabir-joshi',
    name: 'Kabir Joshi',
    avatarText: 'KJ',
    avatarBg: 'bg-violet-600',
    estimatedIq: 121,
    tier: 'Above Average',
    targetAir: 'AIR 4,900',
    tagline: 'Organic Chemistry & Thermodynamics Solver',
    subjectProficiency: { Physics: 0.78, Chemistry: 0.87, Mathematics: 0.80 },
    typeMastery: { mcq: 0.84, multiple: 0.74, integer: 0.78, matching: 0.85, paragraph: 0.80 },
    speedFactor: 0.97,
    sillyMistakeResistance: 0.81,
  },
  {
    id: 'peer-meera-krishnan',
    name: 'Meera Krishnan',
    avatarText: 'MK',
    avatarBg: 'bg-sky-600',
    estimatedIq: 119,
    tier: 'Above Average',
    targetAir: 'AIR 6,800',
    tagline: 'Math Enthusiast • Strong in Algebra & Trigonometry',
    subjectProficiency: { Physics: 0.77, Chemistry: 0.79, Mathematics: 0.85 },
    typeMastery: { mcq: 0.83, multiple: 0.72, integer: 0.82, matching: 0.83, paragraph: 0.79 },
    speedFactor: 0.98,
    sillyMistakeResistance: 0.80,
  },
  {
    id: 'peer-vikram-malhotra',
    name: 'Vikram Malhotra',
    avatarText: 'VM',
    avatarBg: 'bg-orange-600',
    estimatedIq: 116,
    tier: 'Disciplined Average',
    targetAir: 'AIR 8,500',
    tagline: 'Methodical Average Aspirant • Cautious Negative Control',
    subjectProficiency: { Physics: 0.79, Chemistry: 0.78, Mathematics: 0.76 },
    typeMastery: { mcq: 0.81, multiple: 0.70, integer: 0.75, matching: 0.82, paragraph: 0.77 },
    speedFactor: 1.05,
    sillyMistakeResistance: 0.82,
  },
  {
    id: 'peer-riya-singhania',
    name: 'Riya Singhania',
    avatarText: 'RS',
    avatarBg: 'bg-pink-600',
    estimatedIq: 114,
    tier: 'Disciplined Average',
    targetAir: 'AIR 10,800',
    tagline: 'NCERT & Standard Textbook Solid Foundation',
    subjectProficiency: { Physics: 0.75, Chemistry: 0.81, Mathematics: 0.75 },
    typeMastery: { mcq: 0.80, multiple: 0.68, integer: 0.74, matching: 0.81, paragraph: 0.76 },
    speedFactor: 1.08,
    sillyMistakeResistance: 0.79,
  },
  {
    id: 'peer-pranav-bhat',
    name: 'Pranav Bhat',
    avatarText: 'PB',
    avatarBg: 'bg-lime-600',
    estimatedIq: 111,
    tier: 'Disciplined Average',
    targetAir: 'AIR 13,200',
    tagline: 'Hardworking Aspirant • Moderate Accuracy in Hard Math',
    subjectProficiency: { Physics: 0.76, Chemistry: 0.76, Mathematics: 0.73 },
    typeMastery: { mcq: 0.78, multiple: 0.65, integer: 0.72, matching: 0.80, paragraph: 0.74 },
    speedFactor: 1.12,
    sillyMistakeResistance: 0.77,
  },
  {
    id: 'peer-aniket-das',
    name: 'Aniket Das',
    avatarText: 'AD',
    avatarBg: 'bg-slate-600',
    estimatedIq: 108,
    tier: 'Disciplined Average',
    targetAir: 'AIR 15,500',
    tagline: 'Steady Baseline Average • Dependable NCERT Concept Recall',
    subjectProficiency: { Physics: 0.73, Chemistry: 0.75, Mathematics: 0.71 },
    typeMastery: { mcq: 0.76, multiple: 0.62, integer: 0.70, matching: 0.78, paragraph: 0.72 },
    speedFactor: 1.15,
    sillyMistakeResistance: 0.75,
  },
];

// Simple deterministic hash based on strings to make dynamic simulations reproducible
function deterministicHash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 100000) / 100000; // Returns float 0..1
}

/**
 * Dynamically simulates a peer student's performance on a specific test.
 * Output is deterministic based on testId, studentId, and question parameters.
 */
export function simulatePeerAttempt(
  student: PeerStudent,
  questions: Question[],
  testId: string,
  settings: ExamSettings
): PeerTestResult {
  const flattened = flattenQuestions(questions);
  let totalMarks = 0;
  let marksObtained = 0;
  let attemptedQuestions = 0;
  let correctQuestions = 0;
  let totalTimeSpentSeconds = 0;

  const subjectBreakdown: Record<string, { marks: number; maxMarks: number; correct: number; attempted: number }> = {};
  const questionResults: Record<string, PeerSimulationQuestionResult> = {};

  flattened.forEach((item, idx) => {
    const q = item.question;
    const maxMarks = q.marks !== undefined ? q.marks : 4;
    const negativePenalty = settings.allowNegativeMarking ? (q.negativeMarks !== undefined ? q.negativeMarks : 1) : 0;
    totalMarks += maxMarks;

    const subject = q.subject || 'General';
    if (!subjectBreakdown[subject]) {
      subjectBreakdown[subject] = { marks: 0, maxMarks: 0, correct: 0, attempted: 0 };
    }
    subjectBreakdown[subject].maxMarks += maxMarks;

    // Difficulty modifier
    let diffMod = 0;
    if (q.difficulty === 'Easy') diffMod = 0.12;
    else if (q.difficulty === 'Hard') diffMod = -0.14;

    // Subject weight
    const subProf =
      subject.toLowerCase().includes('phys')
        ? student.subjectProficiency.Physics
        : subject.toLowerCase().includes('chem')
        ? student.subjectProficiency.Chemistry
        : subject.toLowerCase().includes('math')
        ? student.subjectProficiency.Mathematics
        : 0.80;

    // Type mastery
    const typeMast = student.typeMastery[q.type] || 0.75;

    // Deterministic seeds
    const seedAttempt = `${testId}_${student.id}_${q.id}_attempt`;
    const seedCorrect = `${testId}_${student.id}_${q.id}_correct`;
    const seedTime = `${testId}_${student.id}_${q.id}_time`;

    const randAttempt = deterministicHash(seedAttempt);
    const randCorrect = deterministicHash(seedCorrect);
    const randTime = deterministicHash(seedTime);

    // Probability of attempting
    // Toppers attempt almost everything (94-98%), Average students attempt 75-85%
    const attemptProb = Math.min(0.99, Math.max(0.72, (student.estimatedIq / 146) * 0.96 + diffMod * 0.5));
    const isAttempted = randAttempt <= attemptProb;

    // Time spent calculation
    const baseEstimate = q.timeEstimateSeconds || 100;
    const timeSpent = Math.max(25, Math.round(baseEstimate * student.speedFactor * (0.85 + randTime * 0.3)));
    totalTimeSpentSeconds += isAttempted ? timeSpent : 15;

    let isCorrect = false;
    let awardedMarks = 0;

    if (isAttempted) {
      attemptedQuestions++;
      subjectBreakdown[subject].attempted++;

      // Probability of answering correctly
      const baseProb = subProf * 0.55 + typeMast * 0.35 + (student.estimatedIq - 100) * 0.004;
      const finalProb = Math.min(0.98, Math.max(0.45, baseProb + diffMod));

      if (randCorrect <= finalProb) {
        isCorrect = true;
        correctQuestions++;
        awardedMarks = maxMarks;
        subjectBreakdown[subject].correct++;
      } else {
        // Did student make silly mistake and get negative, or partial?
        const isSillyTrap = deterministicHash(`${seedCorrect}_trap`) > student.sillyMistakeResistance;
        if (q.type === 'multiple' && settings.allowPartialMarking && !isSillyTrap) {
          // award partial +1
          awardedMarks = 1;
        } else {
          awardedMarks = -negativePenalty;
        }
      }

      marksObtained += awardedMarks;
      subjectBreakdown[subject].marks += awardedMarks;
    }

    questionResults[q.id] = {
      questionId: q.id,
      isAttempted,
      isCorrect,
      marksObtained: awardedMarks,
      timeSpentSeconds: isAttempted ? timeSpent : 15,
    };
  });

  const accuracy = attemptedQuestions > 0 ? (correctQuestions / attemptedQuestions) * 100 : 0;
  const percentageScore = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

  const finalSubjects: Record<string, { marks: number; maxMarks: number; accuracy: number }> = {};
  Object.entries(subjectBreakdown).forEach(([s, data]) => {
    finalSubjects[s] = {
      marks: data.marks,
      maxMarks: data.maxMarks,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
    };
  });

  return {
    studentId: student.id,
    studentName: student.name,
    tier: student.tier,
    marksObtained,
    maxMarks: totalMarks,
    percentageScore: Math.round(percentageScore * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    totalTimeSpentSeconds,
    attemptedQuestions,
    correctQuestions,
    subjectBreakdown: finalSubjects,
    questionResults,
  };
}

/**
 * Generates the ranked leaderboard for a specific mock test, seamlessly inserting the User.
 */
export function generateTestLeaderboard(
  test: TestMetadata,
  userAttempt: TestAttempt
): LeaderboardEntry[] {
  const settings = userAttempt.settingsSnapshot;
  const userEval = userAttempt.evaluation;

  // 1. Compute peer results
  const peerResults = PEER_COHORT.map((peer) => {
    const res = simulatePeerAttempt(peer, test.questions, test.id, settings);
    return {
      peer,
      res,
    };
  });

  // 2. Prepare raw entries
  const entries: {
    studentId: string;
    name: string;
    isUser: boolean;
    tier: any;
    targetAir: string;
    avatarText: string;
    avatarBg: string;
    marksObtained: number;
    maxMarks: number;
    percentageScore: number;
    accuracy: number;
    timeSpentSeconds: number;
  }[] = [];

  // Add User
  if (userEval) {
    entries.push({
      studentId: 'user-you',
      name: 'You (Aspirant)',
      isUser: true,
      tier: userEval.percentageScore >= 80 ? 'Topper' : userEval.percentageScore >= 55 ? 'High Achiever' : 'Disciplined Average',
      targetAir: 'Target: AIR < 500',
      avatarText: 'YOU',
      avatarBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
      marksObtained: userEval.marksObtained,
      maxMarks: userEval.maxMarks,
      percentageScore: userEval.percentageScore,
      accuracy: userEval.accuracy,
      timeSpentSeconds: userEval.totalTimeSpentSeconds,
    });
  }

  // Add 15 Peers
  peerResults.forEach(({ peer, res }) => {
    entries.push({
      studentId: peer.id,
      name: peer.name,
      isUser: false,
      tier: peer.tier,
      targetAir: peer.targetAir,
      avatarText: peer.avatarText,
      avatarBg: peer.avatarBg,
      marksObtained: res.marksObtained,
      maxMarks: res.maxMarks,
      percentageScore: res.percentageScore,
      accuracy: res.accuracy,
      timeSpentSeconds: res.totalTimeSpentSeconds,
    });
  });

  // 3. Sort strictly by marksObtained DESC, accuracy DESC, timeSpent ASC
  entries.sort((a, b) => {
    if (b.marksObtained !== a.marksObtained) {
      return b.marksObtained - a.marksObtained;
    }
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  const userEntry = entries.find((e) => e.isUser);
  const userMarks = userEntry ? userEntry.marksObtained : 0;

  // 4. Assign rank and delta
  return entries.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    scoreDeltaToUser: e.marksObtained - userMarks,
  }));
}

/**
 * Generates an overall cumulative leaderboard across all attempted tests.
 */
export function generateCumulativeLeaderboard(
  tests: TestMetadata[],
  attempts: TestAttempt[]
): LeaderboardEntry[] {
  const completedAttempts = attempts.filter((a) => a.status === 'completed' && a.evaluation);

  if (completedAttempts.length === 0) {
    // Return initial seed leaderboard
    return PEER_COHORT.map((peer, idx) => ({
      rank: idx + 1,
      studentId: peer.id,
      name: peer.name,
      isUser: false,
      tier: peer.tier,
      targetAir: peer.targetAir,
      avatarText: peer.avatarText,
      avatarBg: peer.avatarBg,
      marksObtained: 0,
      maxMarks: 100,
      percentageScore: Math.round((peer.estimatedIq / 150) * 85),
      accuracy: Math.round((peer.estimatedIq / 150) * 90),
      timeSpentSeconds: 0,
      scoreDeltaToUser: 0,
    }));
  }

  // Aggregate user marks
  let userTotalMarks = 0;
  let userTotalMaxMarks = 0;
  let userTotalTime = 0;
  let userAccuracySum = 0;

  completedAttempts.forEach((a) => {
    const ev = a.evaluation!;
    userTotalMarks += ev.marksObtained;
    userTotalMaxMarks += ev.maxMarks;
    userTotalTime += ev.totalTimeSpentSeconds;
    userAccuracySum += ev.accuracy;
  });

  const userAvgAcc = userAccuracySum / completedAttempts.length;
  const userPct = userTotalMaxMarks > 0 ? (userTotalMarks / userTotalMaxMarks) * 100 : 0;

  // Aggregate peer marks for the exact same set of completed tests
  const peerTotals: Record<string, { marks: number; maxMarks: number; accuracySum: number; time: number }> = {};
  PEER_COHORT.forEach((p) => {
    peerTotals[p.id] = { marks: 0, maxMarks: 0, accuracySum: 0, time: 0 };
  });

  completedAttempts.forEach((att) => {
    const test = tests.find((t) => t.id === att.testId);
    if (!test) return;

    PEER_COHORT.forEach((peer) => {
      const res = simulatePeerAttempt(peer, test.questions, test.id, att.settingsSnapshot);
      peerTotals[peer.id].marks += res.marksObtained;
      peerTotals[peer.id].maxMarks += res.maxMarks;
      peerTotals[peer.id].accuracySum += res.accuracy;
      peerTotals[peer.id].time += res.totalTimeSpentSeconds;
    });
  });

  const list: {
    studentId: string;
    name: string;
    isUser: boolean;
    tier: any;
    targetAir: string;
    avatarText: string;
    avatarBg: string;
    marksObtained: number;
    maxMarks: number;
    percentageScore: number;
    accuracy: number;
    timeSpentSeconds: number;
  }[] = [];

  // Add User
  list.push({
    studentId: 'user-you',
    name: 'You (Aspirant)',
    isUser: true,
    tier: userPct >= 80 ? 'Topper' : userPct >= 60 ? 'High Achiever' : 'Disciplined Average',
    targetAir: 'Target: AIR < 500',
    avatarText: 'YOU',
    avatarBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    marksObtained: userTotalMarks,
    maxMarks: userTotalMaxMarks,
    percentageScore: Math.round(userPct * 10) / 10,
    accuracy: Math.round(userAvgAcc * 10) / 10,
    timeSpentSeconds: userTotalTime,
  });

  // Add Peers
  PEER_COHORT.forEach((peer) => {
    const d = peerTotals[peer.id];
    const avgAcc = completedAttempts.length > 0 ? d.accuracySum / completedAttempts.length : 80;
    const pct = d.maxMarks > 0 ? (d.marks / d.maxMarks) * 100 : 0;
    list.push({
      studentId: peer.id,
      name: peer.name,
      isUser: false,
      tier: peer.tier,
      targetAir: peer.targetAir,
      avatarText: peer.avatarText,
      avatarBg: peer.avatarBg,
      marksObtained: d.marks,
      maxMarks: d.maxMarks,
      percentageScore: Math.round(pct * 10) / 10,
      accuracy: Math.round(avgAcc * 10) / 10,
      timeSpentSeconds: d.time,
    });
  });

  // Sort
  list.sort((a, b) => {
    if (b.marksObtained !== a.marksObtained) return b.marksObtained - a.marksObtained;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  return list.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    scoreDeltaToUser: e.marksObtained - userTotalMarks,
  }));
}
