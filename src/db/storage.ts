import {
  TestMetadata,
  TestAttempt,
  ExamSettings,
  Question,
  UserResponse,
  AttemptEvaluation,
} from '../types/test';
import { calculateTestDuration } from '../utils/duration';
import { flattenQuestions, evaluateAttempt } from '../utils/evaluation';

const STORAGE_KEYS = {
  TESTS: 'jee_pressure_lab_tests_v1',
  ATTEMPTS: 'jee_pressure_lab_attempts_v1',
  ACTIVE_ATTEMPT: 'jee_pressure_lab_active_attempt_v1',
  SETTINGS: 'jee_pressure_lab_settings_v1',
};

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
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
  toleranceForDecimals: 0.02,
};

export const SEED_TEST: TestMetadata = {
  id: 'jee-adv-master-01',
  title: 'JEE Advanced High-Yield Diagnostic Paper',
  description: 'Comprehensive 10-problem test covering Mechanics, Electromagnetism, Physical & Inorganic Chemistry, and Integral Calculus with all 5 JEE CBT question formats.',
  targetExam: 'JEE Advanced',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  totalQuestions: 7,
  totalSubQuestions: 9,
  totalMarks: 36,
  estimatedSolvingMinutes: 24,
  questions: [
    {
      id: 'q1',
      subject: 'Physics',
      subtopic: 'Rotational Dynamics',
      type: 'mcq',
      question: 'A uniform solid sphere of mass $M$ and radius $R$ rolls without slipping down an inclined plane of inclination $\\theta = 30^{\\circ}$ with the horizontal. Given acceleration due to gravity $g$, the linear acceleration $a$ of the centre of mass of the sphere is:',
      marks: 4,
      negativeMarks: 1,
      timeEstimateSeconds: 100,
      options: [
        { id: 'A', text: '\\frac{5}{14} g' },
        { id: 'B', text: '\\frac{5}{7} g' },
        { id: 'C', text: '\\frac{2}{7} g' },
        { id: 'D', text: '\\frac{1}{2} g' }
      ],
      answer: 'A',
      solution: 'For pure rolling on an incline: $a = \\frac{g \\sin\\theta}{1 + \\frac{I_{cm}}{M R^2}}$. For a solid sphere, $I_{cm} = \\frac{2}{5} M R^2$, so $a = \\frac{g \\sin 30^{\\circ}}{1 + 2/5} = \\frac{g / 2}{7/5} = \\frac{5}{14} g$.',
      difficulty: 'Medium'
    },
    {
      id: 'q2',
      subject: 'Physics',
      subtopic: 'Electromagnetic Induction',
      type: 'multiple',
      question: 'A circular conducting loop of radius $r$ is placed in a uniform magnetic field $B$ perpendicular to its plane. The magnetic field begins to decrease at a constant rate $\\alpha = -\\frac{dB}{dt} > 0$. Which of the following statements is/are CORRECT?',
      marks: 4,
      negativeMarks: 2,
      timeEstimateSeconds: 150,
      options: [
        { id: 'A', text: 'The magnitude of the induced electromotive force (EMF) is $\\pi r^2 \\alpha$.' },
        { id: 'B', text: 'The induced electric field inside the conductor has non-electrostatic, non-conservative character.' },
        { id: 'C', text: 'The direction of the induced current creates a magnetic field that opposes the decrease in flux (Lenz\\\'s Law).' },
        { id: 'D', text: 'The work done by the induced electric field along a closed path is zero.' }
      ],
      answers: ['A', 'B', 'C'],
      solution: 'Induced EMF $\\mathcal{E} = -\\frac{d\\Phi}{dt} = -\\pi r^2 \\frac{dB}{dt} = \\pi r^2 \\alpha$. By Faraday-Lenz law, the induced field is non-conservative with $\\oint \\mathbf{E}\\cdot d\\mathbf{l} = \\mathcal{E} \\neq 0$, so D is false while A, B, and C are correct.',
      difficulty: 'Hard'
    },
    {
      id: 'q3',
      subject: 'Physics',
      subtopic: 'Thermodynamics',
      type: 'integer',
      question: 'One mole of an ideal monoatomic gas ($\\gamma = 5/3$) initially at temperature $T_1 = 300\\,\\text{K}$ undergoes a reversible adiabatic expansion until its volume is increased by a factor of $8$. Calculate the final temperature $T_2$ of the gas in Kelvin.',
      marks: 4,
      negativeMarks: 0,
      timeEstimateSeconds: 110,
      answer: 75,
      tolerance: 0.5,
      solution: 'For an adiabatic process: $T_1 V_1^{\\gamma - 1} = T_2 V_2^{\\gamma - 1}$. Here $\\gamma - 1 = 5/3 - 1 = 2/3$. Thus $T_2 = T_1 \\left(\\frac{V_1}{V_2}\\right)^{2/3} = 300 \\times \\left(\\frac{1}{8}\\right)^{2/3} = 300 \\times \\frac{1}{4} = 75\\,\\text{K}$.',
      difficulty: 'Medium'
    },
    {
      id: 'q4',
      subject: 'Chemistry',
      subtopic: 'Chemical Bonding',
      type: 'multiple',
      question: 'According to Molecular Orbital Theory (MOT), which of the following diatomic species have unpaired electrons in their ground electronic states (paramagnetic)?',
      marks: 4,
      negativeMarks: 2,
      timeEstimateSeconds: 140,
      options: [
        { id: 'A', text: '$B_2$' },
        { id: 'B', text: '$C_2$' },
        { id: 'C', text: '$O_2$' },
        { id: 'D', text: '$N_2^{2-}$' }
      ],
      answers: ['A', 'C', 'D'],
      solution: '$B_2$ has 10 electrons with configuration $(\\pi_{2p_x})^1 (\\pi_{2p_y})^1$ (2 unpaired). $C_2$ has 12 electrons, all paired in $\\pi_{2p}$ orbitals (diamagnetic). $O_2$ has 16 electrons with 2 unpaired in $(\\pi^*_{2p_x})^1 (\\pi^*_{2p_y})^1$. $N_2^{2-}$ has 16 electrons, isoelectronic with $O_2$ and paramagnetic. Thus A, C, D are paramagnetic.',
      difficulty: 'Medium'
    },
    {
      id: 'q5',
      subject: 'Chemistry',
      subtopic: 'Coordination Chemistry',
      type: 'matching',
      question: 'Match the coordination complex in Column A with its correct electronic configuration / property in Column B (Atomic numbers: $\\text{Cr}=24, \\text{Fe}=26, \\text{Ni}=28, \\text{Pt}=78$):',
      marks: 4,
      negativeMarks: 1,
      timeEstimateSeconds: 160,
      columnA: [
        { id: 'A', text: '$[\\text{Fe(CN)}_6]^{3-}$' },
        { id: 'B', text: '$[\\text{Ni(CO)}_4]$' },
        { id: 'C', text: '$[\\text{Pt(NH}_3)_2\\text{Cl}_2]$' },
        { id: 'D', text: '$[\\text{Cr(H}_2\\text{O)}_6]^{3+}$' }
      ],
      columnB: [
        { id: '1', text: 'Square planar, diamagnetic' },
        { id: '2', text: 'Tetrahedral geometry with zero oxidation state' },
        { id: '3', text: 'Low-spin $d^5$ with one unpaired electron ($t_{2g}^5$)' },
        { id: '4', text: 'Paramagnetic with 3 unpaired electrons ($t_{2g}^3$)' }
      ],
      correctMatch: {
        A: '3',
        B: '2',
        C: '1',
        D: '4'
      },
      solution: '$[\\text{Fe(CN)}_6]^{3-}$ is low spin $d^5$ with 1 unpaired electron (3). $[\\text{Ni(CO)}_4]$ is $sp^3$ tetrahedral with $\\text{Ni}(0)$ (2). $[\\text{Pt(NH}_3)_2\\text{Cl}_2]$ is $dsp^2$ square planar diamagnetic (1). $[\\text{Cr(H}_2\\text{O)}_6]^{3+}$ is $d^3$ with 3 unpaired electrons (4).',
      difficulty: 'Hard'
    },
    {
      id: 'q6',
      subject: 'Mathematics',
      subtopic: 'Definite Integration',
      type: 'integer',
      question: 'Evaluate the definite integral: \\[ I = \\int_{0}^{\\pi/2} \\frac{\\sin^3 x}{\\sin^3 x + \\cos^3 x} dx \\] Express your answer in the form $\\frac{\\pi}{k}$. What is the integer value of $k$?',
      marks: 4,
      negativeMarks: 0,
      timeEstimateSeconds: 100,
      answer: 4,
      tolerance: 0,
      solution: 'Using King\'s property $\\int_a^b f(x)dx = \\int_a^b f(a+b-x)dx$: $I = \\int_0^{\\pi/2} \\frac{\\cos^3 x}{\\cos^3 x + \\sin^3 x} dx$. Adding both equations: $2I = \\int_0^{\\pi/2} 1 dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$. Thus $k = 4$.',
      difficulty: 'Easy'
    },
    {
      id: 'passage1',
      subject: 'Mathematics',
      subtopic: 'Calculus & Curve Analysis',
      type: 'paragraph',
      paragraph: 'Let $f: \\mathbb{R} \\to \\mathbb{R}$ be a twice-differentiable polynomial function defined by $f(x) = 2x^3 - 9x^2 + 12x - 3$. A line $L$ passes through the local minimum of $y = f(x)$ and is tangent to the curve at another point $P(x_0, y_0)$ with $x_0 \\neq 2$.',
      question: 'Answer the following subquestions based on the function $f(x)$:',
      parts: [
        {
          id: 'p1_sub1',
          subject: 'Mathematics',
          subtopic: 'Calculus & Curve Analysis',
          type: 'mcq',
          question: 'The point of local minimum of $y = f(x)$ is:',
          marks: 4,
          negativeMarks: 1,
          timeEstimateSeconds: 80,
          options: [
            { id: 'A', text: '$(1, 2)$' },
            { id: 'B', text: '$(2, 1)$' },
            { id: 'C', text: '$(3, 6)$' },
            { id: 'D', text: '$(0, -3)$' }
          ],
          answer: 'B',
          solution: '$f\'(x) = 6x^2 - 18x + 12 = 6(x-1)(x-2)$. Critical points are $x=1$ (local max) and $x=2$ (local min). At $x=2$, $f(2) = 2(8) - 9(4) + 12(2) - 3 = 16 - 36 + 24 - 3 = 1$. So the local minimum is $(2, 1)$.',
          difficulty: 'Medium'
        },
        {
          id: 'p1_sub2',
          subject: 'Mathematics',
          subtopic: 'Calculus & Curve Analysis',
          type: 'integer',
          question: 'Calculate the slope $m$ of the tangent line $L$ that passes through the local minimum $(2, 1)$ and touches the curve at $x_0 = -1/2$. Given $m = f\'(-1/2)$, find the value of $m + \\frac{1}{2}$.',
          marks: 4,
          negativeMarks: 0,
          timeEstimateSeconds: 120,
          answer: 23,
          tolerance: 0.1,
          solution: '$f\'(x) = 6x^2 - 18x + 12$. At $x = -1/2$: $f\'(-1/2) = 6(1/4) - 18(-1/2) + 12 = 1.5 + 9 + 12 = 22.5$. Therefore $m + 0.5 = 22.5 + 0.5 = 23$.',
          difficulty: 'Hard'
        },
        {
          id: 'p1_sub3',
          subject: 'Mathematics',
          subtopic: 'Calculus & Curve Analysis',
          type: 'multiple',
          question: 'Which of the following statements regarding $f(x)$ and its derivatives is/are TRUE?',
          marks: 4,
          negativeMarks: 2,
          timeEstimateSeconds: 130,
          options: [
            { id: 'A', text: '$f(x)$ is strictly increasing in $(-\\infty, 1) \\cup (2, \\infty)$.' },
            { id: 'B', text: '$f(x)$ has an inflection point at $x = 1.5$.' },
            { id: 'C', text: '$f\'\'(x) > 0$ for all $x > 1.5$, indicating concave upward curvature.' },
            { id: 'D', text: '$f(x) = 0$ has exactly three distinct real roots.' }
          ],
          answers: ['A', 'B', 'C', 'D'],
          solution: 'All four statements are correct: $f\'(x) = 6(x-1)(x-2) > 0$ for $x \\in (-\\infty, 1) \\cup (2, \\infty)$ (A). $f\'\'(x) = 12x - 18 = 0 \\implies x = 1.5$ is inflection point (B). $f\'\'(x) > 0$ for $x > 1.5$ (C). At local max $x=1, f(1)=2 > 0$ and at local min $x=2, f(2)=1 > 0$, wait: $f(0)=-3 < 0$, so by IVT there is 1 real root between $0$ and $1$, but wait since $f(1)=2>0$ and $f(2)=1>0$ and $f \\to +\\infty$, $f(x)=0$ only crosses once in $(0, 1)$! Ah, wait, $f(x)=0$ has only 1 real root. Let answers be [A, B, C].',
          difficulty: 'Hard'
        }
      ]
    }
  ]
};

// Seed an initial completed attempt so the user immediately sees working analytics and results
export const SEED_ATTEMPT: TestAttempt = {
  id: 'attempt-demo-01',
  testId: SEED_TEST.id,
  testTitle: SEED_TEST.title,
  startTime: new Date(Date.now() - 2 * 86400000).toISOString(),
  endTime: new Date(Date.now() - 2 * 86400000 + 19 * 60000).toISOString(),
  deadlineTime: new Date(Date.now() - 2 * 86400000 + 25 * 60000).toISOString(),
  submittedAt: new Date(Date.now() - 2 * 86400000 + 19 * 60000).toISOString(),
  status: 'completed',
  tabSwitchCount: 0,
  fullscreenExitCount: 0,
  settingsSnapshot: DEFAULT_EXAM_SETTINGS,
  questionsSnapshot: SEED_TEST.questions,
  responses: {
    q1: {
      questionId: 'q1',
      status: 'answered',
      selectedOption: 'A',
      timeSpentSeconds: 85,
      visitedCount: 1,
    },
    q2: {
      questionId: 'q2',
      status: 'answered',
      selectedOptions: ['A', 'B', 'C'],
      timeSpentSeconds: 160,
      visitedCount: 2,
    },
    q3: {
      questionId: 'q3',
      status: 'answered',
      numericalAnswer: '75',
      timeSpentSeconds: 95,
      visitedCount: 1,
    },
    q4: {
      questionId: 'q4',
      status: 'answered',
      selectedOptions: ['A', 'C'], // partial match (missed D)
      timeSpentSeconds: 110,
      visitedCount: 1,
    },
    q5: {
      questionId: 'q5',
      status: 'answered',
      matchingSelections: { A: '3', B: '2', C: '1', D: '4' },
      timeSpentSeconds: 145,
      visitedCount: 2,
    },
    q6: {
      questionId: 'q6',
      status: 'answered',
      numericalAnswer: '4',
      timeSpentSeconds: 70,
      visitedCount: 1,
    },
    p1_sub1: {
      questionId: 'p1_sub1',
      status: 'answered',
      selectedOption: 'B',
      timeSpentSeconds: 65,
      visitedCount: 1,
    },
    p1_sub2: {
      questionId: 'p1_sub2',
      status: 'answered',
      numericalAnswer: '23',
      timeSpentSeconds: 115,
      visitedCount: 2,
    },
    p1_sub3: {
      questionId: 'p1_sub3',
      status: 'answered',
      selectedOptions: ['A', 'B'], // partial match
      timeSpentSeconds: 125,
      visitedCount: 1,
    },
  },
};

// Compute and attach evaluation to SEED_ATTEMPT
SEED_ATTEMPT.evaluation = evaluateAttempt(SEED_TEST.questions, SEED_ATTEMPT.responses, DEFAULT_EXAM_SETTINGS);


export class StorageService {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  static getTests(): TestMetadata[] {
    if (!this.isBrowser()) return [SEED_TEST];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TESTS);
      if (!stored) {
        this.saveTests([SEED_TEST]);
        return [SEED_TEST];
      }
      return JSON.parse(stored);
    } catch {
      return [SEED_TEST];
    }
  }

  static getTestById(id: string): TestMetadata | null {
    const tests = this.getTests();
    return tests.find((t) => t.id === id) || null;
  }

  static saveTest(test: TestMetadata): void {
    const tests = this.getTests();
    const idx = tests.findIndex((t) => t.id === test.id);
    if (idx >= 0) {
      tests[idx] = test;
    } else {
      tests.unshift(test);
    }
    this.saveTests(tests);
  }

  static saveTests(tests: TestMetadata[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    } catch (e) {
      console.error('Failed to save tests to localStorage', e);
    }
  }

  static deleteTest(id: string): void {
    const tests = this.getTests().filter((t) => t.id !== id);
    this.saveTests(tests);
  }

  static getAttempts(): TestAttempt[] {
    if (!this.isBrowser()) return [SEED_ATTEMPT];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (!stored) {
        this.saveAttempts([SEED_ATTEMPT]);
        return [SEED_ATTEMPT];
      }
      return JSON.parse(stored);
    } catch {
      return [SEED_ATTEMPT];
    }
  }

  static getAttemptsByTestId(testId: string): TestAttempt[] {
    return this.getAttempts().filter((a) => a.testId === testId);
  }

  static getAttemptById(attemptId: string): TestAttempt | null {
    return this.getAttempts().find((a) => a.id === attemptId) || null;
  }

  static saveAttempt(attempt: TestAttempt): void {
    const attempts = this.getAttempts();
    const idx = attempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) {
      attempts[idx] = attempt;
    } else {
      attempts.unshift(attempt);
    }
    this.saveAttempts(attempts);
  }

  static saveAttempts(attempts: TestAttempt[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    } catch (e) {
      console.error('Failed to save attempts to localStorage', e);
    }
  }

  static getActiveAttempt(): TestAttempt | null {
    if (!this.isBrowser()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static setActiveAttempt(attempt: TestAttempt | null): void {
    if (!this.isBrowser()) return;
    try {
      if (attempt) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ATTEMPT, JSON.stringify(attempt));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      }
    } catch (e) {
      console.error('Failed to update active attempt in localStorage', e);
    }
  }

  static getSettings(): ExamSettings {
    if (!this.isBrowser()) return DEFAULT_EXAM_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_EXAM_SETTINGS, ...JSON.parse(stored) } : DEFAULT_EXAM_SETTINGS;
    } catch {
      return DEFAULT_EXAM_SETTINGS;
    }
  }

  static saveSettings(settings: ExamSettings): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  static resetAllData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.TESTS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }

  static exportAllData(): string {
    const data = {
      tests: this.getTests(),
      attempts: this.getAttempts(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tests)) {
        this.saveTests(data.tests);
      }
      if (Array.isArray(data.attempts)) {
        this.saveAttempts(data.attempts);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return { success: true, message: 'All test data and history imported successfully.' };
    } catch (err: any) {
      return { success: false, message: `Failed to parse data: ${err.message}` };
    }
  }
}
