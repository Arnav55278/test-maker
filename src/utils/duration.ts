import { Question, QuestionType } from '../types/test';

export const DEFAULT_QUESTION_ESTIMATES: Record<QuestionType, number> = {
  mcq: 90,
  multiple: 150,
  integer: 120,
  matching: 150,
  paragraph: 60, // base passage reading time
};

export interface DurationCalculationResult {
  totalEstimatedSeconds: number;
  totalEstimatedMinutes: number;
  recommendedDurationMinutes: number;
  breakdown: {
    questionCount: number;
    passageCount: number;
    passageReadingSeconds: number;
    questionsSeconds: number;
  };
  explanation: string;
}

export function calculateTestDuration(questions: Question[]): DurationCalculationResult {
  let questionsSeconds = 0;
  let passageReadingSeconds = 0;
  let passageCount = 0;
  let subQuestionCount = 0;

  for (const q of questions) {
    if (q.type === 'paragraph') {
      passageCount += 1;
      passageReadingSeconds += 60; // 60 seconds of shared passage reading time
      if (Array.isArray(q.parts)) {
        for (const sub of q.parts) {
          subQuestionCount += 1;
          const est = sub.timeEstimateSeconds && sub.timeEstimateSeconds > 0
            ? sub.timeEstimateSeconds
            : (DEFAULT_QUESTION_ESTIMATES[sub.type] || 90);
          questionsSeconds += est;
        }
      }
    } else {
      subQuestionCount += 1;
      const est = q.timeEstimateSeconds && q.timeEstimateSeconds > 0
        ? q.timeEstimateSeconds
        : (DEFAULT_QUESTION_ESTIMATES[q.type] || 90);
      questionsSeconds += est;
    }
  }

  const totalEstimatedSeconds = passageReadingSeconds + questionsSeconds;
  const totalEstimatedMinutes = Math.ceil(totalEstimatedSeconds / 60);

  // Recommended test duration = max(5 minutes, estimated solving time − 15 minutes)
  // For shorter tests (e.g. under 20 mins), ensure a sensible floor (at least 5 mins or 75% of total time)
  let recommendedMinutes: number;
  let explanation = '';

  if (totalEstimatedMinutes <= 15) {
    recommendedMinutes = Math.max(5, Math.ceil(totalEstimatedMinutes * 0.8));
    explanation = `For quick practice sessions (${totalEstimatedMinutes}m total), we apply a tight pacing target of ${recommendedMinutes}m to train high-pressure speed.`;
  } else {
    recommendedMinutes = Math.max(5, totalEstimatedMinutes - 15);
    explanation = `Standard JEE examination pressure formula: Total estimated solving time (${totalEstimatedMinutes}m) minus 15m review buffer = ${recommendedMinutes}m.`;
  }

  return {
    totalEstimatedSeconds,
    totalEstimatedMinutes,
    recommendedDurationMinutes: recommendedMinutes,
    breakdown: {
      questionCount: subQuestionCount,
      passageCount,
      passageReadingSeconds,
      questionsSeconds,
    },
    explanation,
  };
}
