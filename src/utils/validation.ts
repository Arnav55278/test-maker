import { Question, QuestionType, SubQuestion } from '../types/test';

export interface ValidationError {
  path: string; // e.g. "questions[1].answer"
  message: string;
  questionIndex?: number;
  questionId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  normalizedTitle: string;
  normalizedQuestions: Question[];
  stats: {
    totalQuestions: number;
    subQuestionsCount: number;
    subjectDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    totalMarks: number;
  };
}

export function normalizeQuestionType(rawType: unknown): QuestionType | null {
  if (typeof rawType !== 'string') return null;
  const t = rawType.trim().toLowerCase();
  if (t === 'mcq' || t === 'single' || t === 'single_choice') return 'mcq';
  if (t === 'multiple' || t === 'multi_select' || t === 'multiple_choice' || t === 'more_than_one') return 'multiple';
  if (t === 'integer' || t === 'numerical' || t === 'numeric' || t === 'nat') return 'integer';
  if (t === 'matching' || t === 'match' || t === 'matrix') return 'matching';
  if (t === 'paragraph' || t === 'comprehension' || t === 'passage') return 'paragraph';
  return null;
}

export function validateAndNormalizeTestJson(rawJsonString: string): ValidationResult {
  const errors: ValidationError[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(rawJsonString);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [
        {
          path: 'root',
          message: `JSON Syntax Error: ${err.message || 'Invalid JSON format'}`,
        },
      ],
      normalizedTitle: '',
      normalizedQuestions: [],
      stats: {
        totalQuestions: 0,
        subQuestionsCount: 0,
        subjectDistribution: {},
        typeDistribution: {},
        totalMarks: 0,
      },
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      isValid: false,
      errors: [{ path: 'root', message: 'Test data must be a JSON object with a "questions" array.' }],
      normalizedTitle: '',
      normalizedQuestions: [],
      stats: { totalQuestions: 0, subQuestionsCount: 0, subjectDistribution: {}, typeDistribution: {}, totalMarks: 0 },
    };
  }

  const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    errors.push({
      path: 'questions',
      message: 'The JSON must contain a non-empty "questions" array.',
    });
    return {
      isValid: false,
      errors,
      normalizedTitle: parsed.title || 'Untitled Test',
      normalizedQuestions: [],
      stats: { totalQuestions: 0, subQuestionsCount: 0, subjectDistribution: {}, typeDistribution: {}, totalMarks: 0 },
    };
  }

  const normalizedTitle = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'JEE Mock Practice Test';
  const normalizedQuestions: Question[] = [];
  const seenIds = new Set<string>();

  const subjectDistribution: Record<string, number> = {};
  const typeDistribution: Record<string, number> = {};
  let totalMarks = 0;
  let subQuestionsCount = 0;

  function validateSubQuestion(
    rawSub: any,
    pathPrefix: string,
    qIdx: number,
    parentSubject?: string
  ): SubQuestion | null {
    const subId = rawSub.id ? String(rawSub.id).trim() : `part_${Math.random().toString(36).substring(2, 7)}`;
    if (seenIds.has(subId)) {
      errors.push({
        path: `${pathPrefix}.id`,
        message: `Duplicate question ID detected: "${subId}". All question and subquestion IDs must be unique.`,
        questionIndex: qIdx,
        questionId: subId,
      });
    } else {
      seenIds.add(subId);
    }

    const type = normalizeQuestionType(rawSub.type);
    if (!type || type === 'paragraph') {
      errors.push({
        path: `${pathPrefix}.type`,
        message: `Invalid question type "${rawSub.type}". Supported subquestion types: "mcq", "multiple", "integer", "matching".`,
        questionIndex: qIdx,
        questionId: subId,
      });
      return null;
    }

    if (!rawSub.question || typeof rawSub.question !== 'string' || !rawSub.question.trim()) {
      errors.push({
        path: `${pathPrefix}.question`,
        message: 'Question text is required and cannot be empty.',
        questionIndex: qIdx,
        questionId: subId,
      });
    }

    const marks = typeof rawSub.marks === 'number' && rawSub.marks >= 0 ? rawSub.marks : 4;
    const negativeMarks = typeof rawSub.negativeMarks === 'number' && rawSub.negativeMarks >= 0 ? rawSub.negativeMarks : 1;
    const timeEstimateSeconds = typeof rawSub.timeEstimateSeconds === 'number' && rawSub.timeEstimateSeconds > 0 ? rawSub.timeEstimateSeconds : undefined;
    const subject = rawSub.subject || parentSubject || 'General';

    if (type === 'mcq') {
      if (!Array.isArray(rawSub.options) || rawSub.options.length < 2) {
        errors.push({
          path: `${pathPrefix}.options`,
          message: 'MCQ questions require an "options" array with at least 2 choices.',
          questionIndex: qIdx,
          questionId: subId,
        });
      }
      if (!rawSub.answer || typeof rawSub.answer !== 'string') {
        errors.push({
          path: `${pathPrefix}.answer`,
          message: 'MCQ questions require a correct "answer" matching an option ID (e.g. "A").',
          questionIndex: qIdx,
          questionId: subId,
        });
      } else if (Array.isArray(rawSub.options)) {
        const optionIds = rawSub.options.map((o: any) => String(o.id).toUpperCase());
        if (!optionIds.includes(String(rawSub.answer).toUpperCase())) {
          errors.push({
            path: `${pathPrefix}.answer`,
            message: `Correct answer "${rawSub.answer}" does not exist in options [${optionIds.join(', ')}].`,
            questionIndex: qIdx,
            questionId: subId,
          });
        }
      }

      return {
        id: subId,
        subject,
        subtopic: rawSub.subtopic || 'General',
        question: String(rawSub.question || ''),
        type: 'mcq',
        marks,
        negativeMarks,
        timeEstimateSeconds,
        options: Array.isArray(rawSub.options)
          ? rawSub.options.map((o: any, idx: number) => ({
              id: String(o.id || String.fromCharCode(65 + idx)),
              text: String(o.text || o),
            }))
          : [],
        answer: String(rawSub.answer || 'A'),
        solution: rawSub.solution,
        difficulty: rawSub.difficulty,
      };
    }

    if (type === 'multiple') {
      if (!Array.isArray(rawSub.options) || rawSub.options.length < 2) {
        errors.push({
          path: `${pathPrefix}.options`,
          message: 'Multiple-correct questions require an "options" array with at least 2 choices.',
          questionIndex: qIdx,
          questionId: subId,
        });
      }
      const rawAnswers = Array.isArray(rawSub.answers) ? rawSub.answers : (rawSub.answer ? [rawSub.answer] : []);
      if (rawAnswers.length === 0) {
        errors.push({
          path: `${pathPrefix}.answers`,
          message: 'Multiple-correct questions require an "answers" array with at least one correct option ID.',
          questionIndex: qIdx,
          questionId: subId,
        });
      } else if (Array.isArray(rawSub.options)) {
        const optionIds = rawSub.options.map((o: any) => String(o.id).toUpperCase());
        const invalidAnswers = rawAnswers.filter((a: any) => !optionIds.includes(String(a).toUpperCase()));
        if (invalidAnswers.length > 0) {
          errors.push({
            path: `${pathPrefix}.answers`,
            message: `Answers [${invalidAnswers.join(', ')}] do not exist in options [${optionIds.join(', ')}].`,
            questionIndex: qIdx,
            questionId: subId,
          });
        }
      }

      return {
        id: subId,
        subject,
        subtopic: rawSub.subtopic || 'General',
        question: String(rawSub.question || ''),
        type: 'multiple',
        marks,
        negativeMarks: typeof rawSub.negativeMarks === 'number' ? rawSub.negativeMarks : 2,
        timeEstimateSeconds,
        options: Array.isArray(rawSub.options)
          ? rawSub.options.map((o: any, idx: number) => ({
              id: String(o.id || String.fromCharCode(65 + idx)),
              text: String(o.text || o),
            }))
          : [],
        answers: rawAnswers.map((a: any) => String(a)),
        solution: rawSub.solution,
        difficulty: rawSub.difficulty,
      };
    }

    if (type === 'integer') {
      if (rawSub.answer === undefined || rawSub.answer === null || isNaN(Number(rawSub.answer))) {
        errors.push({
          path: `${pathPrefix}.answer`,
          message: 'Integer/numerical questions require a numeric "answer" (e.g. 42 or 3.14).',
          questionIndex: qIdx,
          questionId: subId,
        });
      }

      return {
        id: subId,
        subject,
        subtopic: rawSub.subtopic || 'General',
        question: String(rawSub.question || ''),
        type: 'integer',
        marks,
        negativeMarks: typeof rawSub.negativeMarks === 'number' ? rawSub.negativeMarks : 0,
        timeEstimateSeconds,
        answer: Number(rawSub.answer || 0),
        tolerance: typeof rawSub.tolerance === 'number' ? rawSub.tolerance : 0.01,
        allowDecimals: rawSub.allowDecimals ?? true,
        solution: rawSub.solution,
        difficulty: rawSub.difficulty,
      };
    }

    if (type === 'matching') {
      if (!Array.isArray(rawSub.columnA) || rawSub.columnA.length === 0) {
        errors.push({
          path: `${pathPrefix}.columnA`,
          message: 'Matching questions require a non-empty "columnA" array.',
          questionIndex: qIdx,
          questionId: subId,
        });
      }
      if (!Array.isArray(rawSub.columnB) || rawSub.columnB.length === 0) {
        errors.push({
          path: `${pathPrefix}.columnB`,
          message: 'Matching questions require a non-empty "columnB" array.',
          questionIndex: qIdx,
          questionId: subId,
        });
      }
      if (!rawSub.correctMatch || typeof rawSub.correctMatch !== 'object') {
        errors.push({
          path: `${pathPrefix}.correctMatch`,
          message: 'Matching questions require a "correctMatch" map object (e.g. {"A": "3", "B": "2"}).',
          questionIndex: qIdx,
          questionId: subId,
        });
      }

      return {
        id: subId,
        subject,
        subtopic: rawSub.subtopic || 'General',
        question: String(rawSub.question || ''),
        type: 'matching',
        marks,
        negativeMarks,
        timeEstimateSeconds,
        columnA: Array.isArray(rawSub.columnA)
          ? rawSub.columnA.map((item: any, i: number) => ({
              id: String(item.id || String.fromCharCode(65 + i)),
              text: String(item.text || item),
            }))
          : [],
        columnB: Array.isArray(rawSub.columnB)
          ? rawSub.columnB.map((item: any, i: number) => ({
              id: String(item.id || String(i + 1)),
              text: String(item.text || item),
            }))
          : [],
        correctMatch: typeof rawSub.correctMatch === 'object' ? rawSub.correctMatch : {},
        solution: rawSub.solution,
        difficulty: rawSub.difficulty,
      };
    }

    return null;
  }

  rawQuestions.forEach((rawQ: any, index: number) => {
    const qId = rawQ.id ? String(rawQ.id).trim() : `q_${index + 1}`;
    const type = normalizeQuestionType(rawQ.type);

    if (!type) {
      errors.push({
        path: `questions[${index}].type`,
        message: `Unknown question type "${rawQ.type}". Supported: "mcq", "multiple", "integer", "matching", "paragraph".`,
        questionIndex: index,
        questionId: qId,
      });
      return;
    }

    if (type === 'paragraph') {
      if (seenIds.has(qId)) {
        errors.push({
          path: `questions[${index}].id`,
          message: `Duplicate question ID "${qId}".`,
          questionIndex: index,
          questionId: qId,
        });
      } else {
        seenIds.add(qId);
      }

      if (!rawQ.paragraph || typeof rawQ.paragraph !== 'string' || !rawQ.paragraph.trim()) {
        errors.push({
          path: `questions[${index}].paragraph`,
          message: 'Paragraph passage questions must have a non-empty "paragraph" text.',
          questionIndex: index,
          questionId: qId,
        });
      }

      if (!Array.isArray(rawQ.parts) || rawQ.parts.length === 0) {
        errors.push({
          path: `questions[${index}].parts`,
          message: 'Paragraph questions require a "parts" array with at least 1 subquestion.',
          questionIndex: index,
          questionId: qId,
        });
        return;
      }

      const validatedParts: SubQuestion[] = [];
      rawQ.parts.forEach((sub: any, subIdx: number) => {
        const validatedSub = validateSubQuestion(
          sub,
          `questions[${index}].parts[${subIdx}]`,
          index,
          rawQ.subject
        );
        if (validatedSub) {
          validatedParts.push(validatedSub);
          subQuestionsCount++;
          const subSubject = validatedSub.subject || rawQ.subject || 'General';
          subjectDistribution[subSubject] = (subjectDistribution[subSubject] || 0) + 1;
          typeDistribution[validatedSub.type] = (typeDistribution[validatedSub.type] || 0) + 1;
          totalMarks += validatedSub.marks || 4;
        }
      });

      normalizedQuestions.push({
        id: qId,
        subject: rawQ.subject || 'General',
        subtopic: rawQ.subtopic || 'Comprehension',
        question: rawQ.question || 'Answer the questions based on the following passage:',
        type: 'paragraph',
        paragraph: String(rawQ.paragraph || ''),
        parts: validatedParts,
        solution: rawQ.solution,
      });
    } else {
      const validated = validateSubQuestion(rawQ, `questions[${index}]`, index, rawQ.subject);
      if (validated) {
        normalizedQuestions.push(validated);
        subQuestionsCount++;
        const sub = validated.subject || 'General';
        subjectDistribution[sub] = (subjectDistribution[sub] || 0) + 1;
        typeDistribution[validated.type] = (typeDistribution[validated.type] || 0) + 1;
        totalMarks += validated.marks || 4;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    normalizedTitle,
    normalizedQuestions,
    stats: {
      totalQuestions: rawQuestions.length,
      subQuestionsCount,
      subjectDistribution,
      typeDistribution,
      totalMarks,
    },
  };
}
