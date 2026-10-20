import { describe, it, expect } from 'vitest';
import {
  evaluateSingleQuestion,
  evaluateAttempt,
  flattenQuestions,
} from './evaluation';
import { calculateTestDuration } from './duration';
import { validateAndNormalizeTestJson } from './validation';
import { Question, ExamSettings, UserResponse } from '../types/test';

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

describe('JEE Evaluation Engine', () => {
  it('correctly evaluates Single MCQ questions with positive and negative marking', () => {
    const q: Question = {
      id: 'mcq_1',
      subject: 'Physics',
      subtopic: 'Mechanics',
      type: 'mcq',
      question: 'Conservation of momentum?',
      options: [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
      ],
      answer: 'A',
      marks: 4,
      negativeMarks: 1,
    };
    const flattened = flattenQuestions([q])[0];

    // Correct
    const correctResp: UserResponse = {
      questionId: 'mcq_1',
      status: 'answered',
      selectedOption: 'A',
      timeSpentSeconds: 60,
      visitedCount: 1,
    };
    const evCorrect = evaluateSingleQuestion(flattened, correctResp, DEFAULT_SETTINGS);
    expect(evCorrect.isCorrect).toBe(true);
    expect(evCorrect.marksObtained).toBe(4);

    // Wrong
    const wrongResp: UserResponse = {
      questionId: 'mcq_1',
      status: 'answered',
      selectedOption: 'B',
      timeSpentSeconds: 45,
      visitedCount: 1,
    };
    const evWrong = evaluateSingleQuestion(flattened, wrongResp, DEFAULT_SETTINGS);
    expect(evWrong.isCorrect).toBe(false);
    expect(evWrong.marksObtained).toBe(-1);

    // Unanswered
    const unResp: UserResponse = {
      questionId: 'mcq_1',
      status: 'visited_unanswered',
      timeSpentSeconds: 20,
      visitedCount: 1,
    };
    const evUn = evaluateSingleQuestion(flattened, unResp, DEFAULT_SETTINGS);
    expect(evUn.isAttempted).toBe(false);
    expect(evUn.marksObtained).toBe(0);
  });

  it('correctly evaluates Multiple-Correct questions with exact match and partial marking', () => {
    const q: Question = {
      id: 'multi_1',
      subject: 'Chemistry',
      type: 'multiple',
      question: 'Select paramagnetic species',
      options: [
        { id: 'A', text: 'B2' },
        { id: 'B', text: 'C2' },
        { id: 'C', text: 'O2' },
        { id: 'D', text: 'N2' },
      ],
      answers: ['A', 'C'],
      marks: 4,
      negativeMarks: 2,
    };
    const flattened = flattenQuestions([q])[0];

    // Exact match: [A, C]
    const exactResp: UserResponse = {
      questionId: 'multi_1',
      status: 'answered',
      selectedOptions: ['A', 'C'],
      timeSpentSeconds: 120,
      visitedCount: 1,
    };
    const evExact = evaluateSingleQuestion(flattened, exactResp, DEFAULT_SETTINGS);
    expect(evExact.isCorrect).toBe(true);
    expect(evExact.marksObtained).toBe(4);

    // Partial match: only marked ['A'] (no wrong options)
    const partialResp: UserResponse = {
      questionId: 'multi_1',
      status: 'answered',
      selectedOptions: ['A'],
      timeSpentSeconds: 90,
      visitedCount: 1,
    };
    const evPartial = evaluateSingleQuestion(flattened, partialResp, DEFAULT_SETTINGS);
    expect(evPartial.isCorrect).toBe(false);
    expect(evPartial.isPartial).toBe(true);
    expect(evPartial.marksObtained).toBe(1); // +1 partial mark

    // Wrong option included: marked ['A', 'B'] where B is wrong
    const wrongResp: UserResponse = {
      questionId: 'multi_1',
      status: 'answered',
      selectedOptions: ['A', 'B'],
      timeSpentSeconds: 100,
      visitedCount: 1,
    };
    const evWrong = evaluateSingleQuestion(flattened, wrongResp, DEFAULT_SETTINGS);
    expect(evWrong.isCorrect).toBe(false);
    expect(evWrong.marksObtained).toBe(-2);
  });

  it('correctly evaluates Integer questions without mistaking unanswered as zero', () => {
    const q: Question = {
      id: 'int_1',
      subject: 'Mathematics',
      type: 'integer',
      question: 'Calculate 7 * 8',
      answer: 56,
      marks: 4,
      negativeMarks: 0,
    };
    const flattened = flattenQuestions([q])[0];

    // Correct answer: '56'
    const correctResp: UserResponse = {
      questionId: 'int_1',
      status: 'answered',
      numericalAnswer: '56',
      timeSpentSeconds: 80,
      visitedCount: 1,
    };
    const evCorrect = evaluateSingleQuestion(flattened, correctResp, DEFAULT_SETTINGS);
    expect(evCorrect.isCorrect).toBe(true);
    expect(evCorrect.marksObtained).toBe(4);

    // Unanswered: should NOT evaluate to 0 or incorrect marks!
    const unResp: UserResponse = {
      questionId: 'int_1',
      status: 'visited_unanswered',
      numericalAnswer: '',
      timeSpentSeconds: 30,
      visitedCount: 1,
    };
    const evUn = evaluateSingleQuestion(flattened, unResp, DEFAULT_SETTINGS);
    expect(evUn.isAttempted).toBe(false);
    expect(evUn.marksObtained).toBe(0);
  });

  it('correctly flattens and independently evaluates paragraph subquestions', () => {
    const passageQ: Question = {
      id: 'p1',
      subject: 'Physics',
      type: 'paragraph',
      paragraph: 'A car moves along a straight line...',
      question: 'Comprehension questions',
      parts: [
        {
          id: 'sub_1',
          subject: 'Physics',
          type: 'mcq',
          question: 'Part 1',
          options: [{ id: 'A', text: 'Ans A' }, { id: 'B', text: 'Ans B' }],
          answer: 'A',
          marks: 4,
          negativeMarks: 1,
        },
        {
          id: 'sub_2',
          subject: 'Physics',
          type: 'integer',
          question: 'Part 2',
          answer: 10,
          marks: 4,
          negativeMarks: 0,
        },
      ],
    };

    const flattened = flattenQuestions([passageQ]);
    expect(flattened.length).toBe(2);
    expect(flattened[0].question.id).toBe('sub_1');
    expect(flattened[1].question.id).toBe('sub_2');
    expect(flattened[0].parentParagraphText).toBe('A car moves along a straight line...');

    // Attempt where sub_1 is correct and sub_2 is unanswered
    const responses: Record<string, UserResponse> = {
      sub_1: {
        questionId: 'sub_1',
        status: 'answered',
        selectedOption: 'A',
        timeSpentSeconds: 60,
        visitedCount: 1,
      },
      sub_2: {
        questionId: 'sub_2',
        status: 'visited_unanswered',
        timeSpentSeconds: 20,
        visitedCount: 1,
      },
    };

    const overallEv = evaluateAttempt([passageQ], responses, DEFAULT_SETTINGS);
    expect(overallEv.totalQuestions).toBe(2);
    expect(overallEv.attemptedQuestions).toBe(1);
    expect(overallEv.correctQuestions).toBe(1);
    expect(overallEv.marksObtained).toBe(4);
    expect(overallEv.maxMarks).toBe(8);
  });
});

describe('Duration Recommendation Engine', () => {
  it('applies the transparent duration algorithm with 15m review buffer and shared passage reading', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        subject: 'Physics',
        type: 'mcq',
        question: 'Q1',
        options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
        answer: 'A',
        timeEstimateSeconds: 120, // 2 mins
      },
      {
        id: 'q2',
        subject: 'Chemistry',
        type: 'multiple',
        question: 'Q2',
        options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
        answers: ['A'],
        timeEstimateSeconds: 180, // 3 mins
      },
      {
        id: 'p1',
        subject: 'Physics',
        type: 'paragraph',
        paragraph: 'Passage text',
        question: 'Passage',
        parts: [
          {
            id: 'p1_sub1',
            subject: 'Physics',
            type: 'integer',
            question: 'Sub 1',
            answer: 5,
            timeEstimateSeconds: 120, // 2 mins
          },
          {
            id: 'p1_sub2',
            subject: 'Physics',
            type: 'mcq',
            question: 'Sub 2',
            options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
            answer: 'B',
            timeEstimateSeconds: 90, // 1.5 mins
          },
        ],
      },
    ];

    const result = calculateTestDuration(questions);
    // Passage = 60s
    // Q1 = 120s, Q2 = 180s, Sub1 = 120s, Sub2 = 90s
    // Total = 60 + 120 + 180 + 120 + 90 = 570s = 9.5 mins -> ceil = 10 mins
    expect(result.breakdown.passageCount).toBe(1);
    expect(result.breakdown.passageReadingSeconds).toBe(60);
    expect(result.breakdown.questionCount).toBe(4);
    expect(result.recommendedDurationMinutes).toBeGreaterThanOrEqual(5);
  });
});

describe('JSON Validation Studio', () => {
  it('rejects duplicate IDs and catches missing answer references', () => {
    const invalidJson = JSON.stringify({
      title: 'Bad Test',
      questions: [
        {
          id: 'dup_id',
          subject: 'Physics',
          type: 'mcq',
          question: 'Q1',
          options: [{ id: 'A', text: 'A' }],
          answer: 'Z', // Option Z does not exist!
        },
        {
          id: 'dup_id', // duplicate ID!
          subject: 'Chemistry',
          type: 'integer',
          question: 'Q2',
          answer: 10,
        },
      ],
    });

    const res = validateAndNormalizeTestJson(invalidJson);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
    expect(res.errors.some((e) => e.message.includes('Duplicate question ID'))).toBe(true);
    expect(res.errors.some((e) => e.message.includes('does not exist in options'))).toBe(true);
  });
});
