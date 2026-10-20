import {
  Question,
  SubQuestion,
  UserResponse,
  QuestionEvaluation,
  AttemptEvaluation,
  ExamSettings,
  FlattenedQuestion,
} from '../types/test';
import { DEFAULT_QUESTION_ESTIMATES } from './duration';

/**
 * Flattens questions so paragraph subquestions become independent evaluable & navigable items.
 */
export function flattenQuestions(questions: Question[]): FlattenedQuestion[] {
  const flattened: FlattenedQuestion[] = [];
  let currentDisplay = 1;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.type === 'paragraph') {
      const parts = Array.isArray(q.parts) ? q.parts : [];
      parts.forEach((sub, subIdx) => {
        flattened.push({
          globalIndex: flattened.length,
          displayNumber: currentDisplay++,
          parentId: q.id,
          parentParagraphText: q.paragraph,
          subIndex: subIdx + 1,
          subTotal: parts.length,
          question: {
            ...sub,
            subject: sub.subject || q.subject || 'General',
            subtopic: sub.subtopic || q.subtopic || 'General',
          },
        });
      });
    } else {
      flattened.push({
        globalIndex: flattened.length,
        displayNumber: currentDisplay++,
        question: q as SubQuestion,
      });
    }
  }

  return flattened;
}

export function evaluateSingleQuestion(
  item: FlattenedQuestion,
  response: UserResponse | undefined,
  settings: ExamSettings
): QuestionEvaluation {
  const q = item.question;
  const timeSpent = response?.timeSpentSeconds || 0;
  const estimate = q.timeEstimateSeconds || DEFAULT_QUESTION_ESTIMATES[q.type] || 90;
  const maxMarks = q.marks !== undefined ? q.marks : 4;
  const negativePenalty = settings.allowNegativeMarking ? (q.negativeMarks !== undefined ? q.negativeMarks : 1) : 0;

  let isAttempted = false;
  let isCorrect = false;
  let isPartial = false;
  let marksObtained = 0;
  let userAnswerSummary = 'Not Attempted';
  let correctAnswerSummary = '';

  if (q.type === 'mcq') {
    correctAnswerSummary = `Option ${q.answer}`;
    if (response?.selectedOption) {
      isAttempted = true;
      userAnswerSummary = `Option ${response.selectedOption}`;
      if (response.selectedOption.trim().toUpperCase() === q.answer.trim().toUpperCase()) {
        isCorrect = true;
        marksObtained = maxMarks;
      } else {
        marksObtained = -negativePenalty;
      }
    }
  } else if (q.type === 'multiple') {
    const correctAnswers = (q.answers || []).map((a) => a.trim().toUpperCase()).sort();
    correctAnswerSummary = `Options ${correctAnswers.join(', ')}`;
    const selected = (response?.selectedOptions || []).map((s) => s.trim().toUpperCase()).sort();

    if (selected.length > 0) {
      isAttempted = true;
      userAnswerSummary = `Options ${selected.join(', ')}`;

      const exactMatch =
        selected.length === correctAnswers.length &&
        selected.every((val, idx) => val === correctAnswers[idx]);

      if (exactMatch) {
        isCorrect = true;
        marksObtained = maxMarks;
      } else if (settings.allowPartialMarking) {
        // Any incorrect choice selected => penalty
        const hasWrongOption = selected.some((opt) => !correctAnswers.includes(opt));
        if (hasWrongOption) {
          marksObtained = -negativePenalty;
        } else {
          // All chosen options are correct, but some are missing
          const correctChosenCount = selected.length;
          isPartial = true;
          // Standard JEE Advanced partial marking rule:
          // +1 for each correct option marked, provided NO incorrect option is marked
          marksObtained = Math.min(maxMarks - 1, correctChosenCount * 1);
        }
      } else {
        marksObtained = -negativePenalty;
      }
    }
  } else if (q.type === 'integer') {
    correctAnswerSummary = `${q.answer}`;
    const rawVal = response?.numericalAnswer;

    if (rawVal !== undefined && rawVal !== null && rawVal.trim() !== '') {
      isAttempted = true;
      userAnswerSummary = rawVal.trim();
      const numVal = parseFloat(rawVal.trim());
      const expected = Number(q.answer);
      const tolerance = q.tolerance !== undefined ? q.tolerance : 0.01;

      if (!isNaN(numVal) && !isNaN(expected)) {
        if (Math.abs(numVal - expected) <= tolerance) {
          isCorrect = true;
          marksObtained = maxMarks;
        } else {
          marksObtained = -negativePenalty;
        }
      } else {
        marksObtained = -negativePenalty;
      }
    }
  } else if (q.type === 'matching') {
    const correctPairs = Object.entries(q.correctMatch || {});
    correctAnswerSummary = correctPairs.map(([a, b]) => `${a}→${b}`).join(', ');

    const userMatches = response?.matchingSelections || {};
    const userEntries = Object.entries(userMatches).filter(([_, b]) => b && b.trim() !== '');

    if (userEntries.length > 0) {
      isAttempted = true;
      userAnswerSummary = userEntries.map(([a, b]) => `${a}→${b}`).join(', ');

      let correctPairsCount = 0;
      for (const [key, val] of Object.entries(q.correctMatch || {})) {
        if (userMatches[key] === val) {
          correctPairsCount++;
        }
      }

      if (correctPairsCount === correctPairs.length && correctPairs.length > 0) {
        isCorrect = true;
        marksObtained = maxMarks;
      } else if (settings.allowPartialMarking && correctPairsCount > 0) {
        isPartial = true;
        marksObtained = Math.round((correctPairsCount / (correctPairs.length || 1)) * maxMarks);
      } else {
        marksObtained = -negativePenalty;
      }
    }
  }

  let status: 'correct' | 'incorrect' | 'partial' | 'unanswered' = 'unanswered';
  if (!isAttempted) {
    status = 'unanswered';
  } else if (isCorrect) {
    status = 'correct';
  } else if (isPartial) {
    status = 'partial';
  } else {
    status = 'incorrect';
  }

  let speedCategory: 'fast_correct' | 'slow_correct' | 'fast_incorrect' | 'slow_incorrect' | 'skipped' = 'skipped';
  if (!isAttempted) {
    speedCategory = 'skipped';
  } else {
    const isFast = timeSpent <= estimate * 1.15;
    if (isCorrect || isPartial) {
      speedCategory = isFast ? 'fast_correct' : 'slow_correct';
    } else {
      speedCategory = isFast ? 'fast_incorrect' : 'slow_incorrect';
    }
  }

  return {
    questionId: q.id,
    globalIndex: item.globalIndex,
    subject: q.subject || 'General',
    subtopic: q.subtopic || 'General',
    type: q.type,
    isCorrect,
    isPartial,
    isAttempted,
    userAnswerSummary,
    correctAnswerSummary,
    marksObtained,
    maxMarks,
    negativeMarks: negativePenalty,
    timeSpentSeconds: timeSpent,
    timeEstimateSeconds: estimate,
    status,
    speedCategory,
  };
}

export function evaluateAttempt(
  questions: Question[],
  responses: Record<string, UserResponse>,
  settings: ExamSettings
): AttemptEvaluation {
  const flattened = flattenQuestions(questions);
  const questionEvaluations: QuestionEvaluation[] = [];

  let totalQuestions = flattened.length;
  let attemptedQuestions = 0;
  let correctQuestions = 0;
  let incorrectQuestions = 0;
  let unansweredQuestions = 0;
  let partialQuestions = 0;
  let maxMarks = 0;
  let marksObtained = 0;
  let totalTimeSpentSeconds = 0;
  let timeSpentOnAttempted = 0;
  let timeSpentOnCorrect = 0;

  const subjectBreakdown: Record<string, {
    totalQuestions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    marksObtained: number;
    maxMarks: number;
    accuracy: number;
    timeSpentSeconds: number;
  }> = {};

  const topicBreakdown: Record<string, {
    subject: string;
    total: number;
    attempted: number;
    correct: number;
    accuracy: number;
    averageTimeSeconds: number;
    totalTime: number;
  }> = {};

  flattened.forEach((item) => {
    const resp = responses[item.question.id];
    const evaluation = evaluateSingleQuestion(item, resp, settings);
    questionEvaluations.push(evaluation);

    maxMarks += evaluation.maxMarks;
    marksObtained += evaluation.marksObtained;
    totalTimeSpentSeconds += evaluation.timeSpentSeconds;

    if (evaluation.isAttempted) {
      attemptedQuestions++;
      timeSpentOnAttempted += evaluation.timeSpentSeconds;
      if (evaluation.isCorrect) {
        correctQuestions++;
        timeSpentOnCorrect += evaluation.timeSpentSeconds;
      } else if (evaluation.isPartial) {
        partialQuestions++;
      } else {
        incorrectQuestions++;
      }
    } else {
      unansweredQuestions++;
    }

    // Subject breakdown
    const sub = evaluation.subject || 'General';
    if (!subjectBreakdown[sub]) {
      subjectBreakdown[sub] = {
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        marksObtained: 0,
        maxMarks: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      };
    }
    subjectBreakdown[sub].totalQuestions += 1;
    subjectBreakdown[sub].marksObtained += evaluation.marksObtained;
    subjectBreakdown[sub].maxMarks += evaluation.maxMarks;
    subjectBreakdown[sub].timeSpentSeconds += evaluation.timeSpentSeconds;
    if (evaluation.isAttempted) {
      subjectBreakdown[sub].attempted += 1;
      if (evaluation.isCorrect || evaluation.isPartial) {
        subjectBreakdown[sub].correct += 1;
      } else {
        subjectBreakdown[sub].incorrect += 1;
      }
    }

    // Topic breakdown
    const topicKey = `${sub} - ${evaluation.subtopic || 'General'}`;
    if (!topicBreakdown[topicKey]) {
      topicBreakdown[topicKey] = {
        subject: sub,
        total: 0,
        attempted: 0,
        correct: 0,
        accuracy: 0,
        averageTimeSeconds: 0,
        totalTime: 0,
      };
    }
    topicBreakdown[topicKey].total += 1;
    topicBreakdown[topicKey].totalTime += evaluation.timeSpentSeconds;
    if (evaluation.isAttempted) {
      topicBreakdown[topicKey].attempted += 1;
      if (evaluation.isCorrect || evaluation.isPartial) {
        topicBreakdown[topicKey].correct += 1;
      }
    }
  });

  // Calculate percentages and averages safely
  const accuracy = attemptedQuestions > 0 ? (correctQuestions / attemptedQuestions) * 100 : 0;
  const attemptRate = totalQuestions > 0 ? (attemptedQuestions / totalQuestions) * 100 : 0;
  const percentageScore = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpentSeconds / totalQuestions : 0;
  const averageTimePerAttempted = attemptedQuestions > 0 ? timeSpentOnAttempted / attemptedQuestions : 0;
  const averageTimePerCorrect = correctQuestions > 0 ? timeSpentOnCorrect / correctQuestions : 0;

  // Finalize subject accuracies
  Object.keys(subjectBreakdown).forEach((s) => {
    const item = subjectBreakdown[s];
    item.accuracy = item.attempted > 0 ? (item.correct / item.attempted) * 100 : 0;
  });

  // Finalize topic breakdowns
  const cleanTopicBreakdown: Record<string, {
    subject: string;
    total: number;
    attempted: number;
    correct: number;
    accuracy: number;
    averageTimeSeconds: number;
  }> = {};

  Object.entries(topicBreakdown).forEach(([key, val]) => {
    cleanTopicBreakdown[key] = {
      subject: val.subject,
      total: val.total,
      attempted: val.attempted,
      correct: val.correct,
      accuracy: val.attempted > 0 ? (val.correct / val.attempted) * 100 : 0,
      averageTimeSeconds: val.total > 0 ? Math.round(val.totalTime / val.total) : 0,
    };
  });

  return {
    totalQuestions,
    attemptedQuestions,
    correctQuestions,
    incorrectQuestions,
    unansweredQuestions,
    partialQuestions,
    maxMarks,
    marksObtained,
    percentageScore: Math.round(percentageScore * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    attemptRate: Math.round(attemptRate * 10) / 10,
    totalTimeSpentSeconds,
    averageTimePerQuestion: Math.round(averageTimePerQuestion),
    averageTimePerAttempted: Math.round(averageTimePerAttempted),
    averageTimePerCorrect: Math.round(averageTimePerCorrect),
    subjectBreakdown,
    topicBreakdown: cleanTopicBreakdown,
    questionEvaluations,
  };
}
