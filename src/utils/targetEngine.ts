import { TargetScale, NextTargetPlan, LeaderboardEntry } from '../types/cohort';

export const STANDARD_SCALES: TargetScale[] = [60, 100, 180, 300, 360];

export const SCALE_DESCRIPTIONS: Record<TargetScale, { title: string; subtitle: string }> = {
  60: {
    title: '60 Marks Scale',
    subtitle: '15-Question Speed Drill / Single Chapter Test',
  },
  100: {
    title: '100 Marks Scale',
    subtitle: 'Single Subject Paper (Physics, Chem, or Math) / BITSAT',
  },
  180: {
    title: '180 Marks Scale',
    subtitle: 'JEE Advanced Single Paper (Paper 1 or Paper 2)',
  },
  300: {
    title: '300 Marks Scale',
    subtitle: 'Standard JEE Main Full Mock Exam (75 Qs × 4)',
  },
  360: {
    title: '360 Marks Scale',
    subtitle: 'Full JEE Advanced Combined Aggregate (P1 + P2)',
  },
};

/**
 * Finds the closest standard JEE scale for a given max mark.
 */
export function detectClosestScale(maxMarks: number): TargetScale {
  if (maxMarks <= 80) return 60;
  if (maxMarks <= 140) return 100;
  if (maxMarks <= 240) return 180;
  if (maxMarks <= 330) return 300;
  return 360;
}

/**
 * Computes the adaptive next target goal, tactical question breakdown,
 * and the specific peer to overtake in the rankings.
 */
export function computeNextTargetPlan(
  userMarks: number,
  userMaxMarks: number,
  leaderboard: LeaderboardEntry[],
  selectedScale?: TargetScale
): NextTargetPlan {
  const safeMax = userMaxMarks > 0 ? userMaxMarks : 100;
  const currentRatio = Math.max(0, userMarks / safeMax);
  const currentPct = currentRatio * 100;

  const standardScale = selectedScale || detectClosestScale(safeMax);
  const scaledCurrentScore = Math.round(currentRatio * standardScale);

  // Target increment based on current performance band
  let targetRatioIncrement = 0.10;
  if (currentPct < 40) {
    targetRatioIncrement = 0.18;
  } else if (currentPct < 60) {
    targetRatioIncrement = 0.12;
  } else if (currentPct < 75) {
    targetRatioIncrement = 0.08;
  } else if (currentPct < 88) {
    targetRatioIncrement = 0.05;
  } else {
    targetRatioIncrement = 0.03;
  }

  const targetRatio = Math.min(0.96, currentRatio + targetRatioIncrement);
  const targetScore = Math.min(standardScale, Math.ceil(targetRatio * standardScale));
  const pointsToGain = Math.max(4, targetScore - scaledCurrentScore);

  // Find next peer to overtake
  const userEntry = leaderboard.find((e) => e.isUser);
  const userRank = userEntry ? userEntry.rank : 8;

  let nextPeer: { name: string; rank: number; marksNeeded: number } | undefined;
  if (userRank > 1) {
    const higherPeer = leaderboard.find((e) => e.rank === userRank - 1);
    if (higherPeer) {
      const peerRatio = higherPeer.marksObtained / (higherPeer.maxMarks || safeMax);
      const peerScaled = Math.round(peerRatio * standardScale);
      const gap = Math.max(2, peerScaled - scaledCurrentScore + 2);
      nextPeer = {
        name: higherPeer.name,
        rank: higherPeer.rank,
        marksNeeded: gap,
      };
    }
  }

  // Tactical breakdown (assuming standard +4 / -1 format)
  // Converting 1 negative to 1 correct yields +5 marks
  // Solving 1 new question yields +4 marks
  const reduceNegativesCount = Math.min(3, Math.max(1, Math.floor(pointsToGain / 8)));
  const remainingPoints = pointsToGain - reduceNegativesCount * 2;
  const convertUnansweredCount = Math.max(1, Math.ceil(remainingPoints / 4));

  // Determine focus area
  let focusSubject = 'Physics';
  if (standardScale === 300 || standardScale === 360) {
    focusSubject = 'Mathematics & Multi-Correct Physics';
  } else if (standardScale === 100) {
    focusSubject = 'High-Yield Formula Problems';
  } else {
    focusSubject = 'Negative Mark Elimination';
  }

  const targetRank = Math.max(1, userRank - 2);
  const targetPercentile = Math.round(((16 - targetRank) / 16) * 100);

  let strategyDescription = '';
  if (nextPeer) {
    strategyDescription = `Eliminate ${reduceNegativesCount} negative penalty traps and solve ${convertUnansweredCount} more questions accurately to overtake ${nextPeer.name} (Rank ${nextPeer.rank}).`;
  } else {
    strategyDescription = `You are currently leading the cohort! Maintain pace and refine speed to reach ${targetScore}/${standardScale} marks.`;
  }

  return {
    standardScale,
    scaledCurrentScore,
    targetScore,
    pointsToGain,
    targetPercentile,
    targetRank,
    nextPeerToOvertake: nextPeer,
    actionableTactics: {
      reduceNegativesCount,
      convertUnansweredCount,
      focusSubject,
      strategyDescription,
    },
  };
}
