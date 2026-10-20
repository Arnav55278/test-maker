# JEE Pressure Lab — CBT Mock Test & Performance Analytics Platform

JEE Pressure Lab is an authentic Computer-Based Testing (CBT) mock exam simulation and deep performance analytics platform built for JEE Main & Advanced aspirants. It replicates realistic examination pressure, trains speed under strict time ceilings, detects impulsive negative markings, and provides granular topic diagnostics over weeks and months of mock test practice.

---

## 1. Core Architecture & Features

### Realistic CBT Exam Interface (`/tests/:id/attempt`)
- **2-Panel Desktop Layout**: Left question canvas with LaTeX equation rendering via KaTeX, right sidebar with live question palette and countdown timer.
- **5 Supported Question Types**:
  1. `mcq` — Single choice with option cards.
  2. `multiple` — Multi-correct checkboxes with JEE Advanced exact and partial marking (+1 per correct option without penalties).
  3. `integer` — Numerical input field, decimal tolerance evaluation, negative numbers, and on-screen keypad. Unanswered inputs are never conflated with zero.
  4. `matching` — Dual column matching with accessible selectors.
  5. `paragraph` — Comprehension passage with multiple independently answerable, individually scored subquestions.
- **Real Deadline-Based Timer**: Uses timestamp differentials (`deadline - now`) so that page refreshes or tab switches never reset or inflate the clock.
- **Palette State Engine**: Distinct colors for Not Visited (gray), Visited & Unanswered (red), Answered (emerald), Marked for Review (purple), and Answered & Marked (purple with green indicator).
- **Exam Discipline Safeguards**: Tracks browser tab switches and fullscreen exits with warning alerts to instill competitive exam focus.
- **Continuous Autosave**: Responses are persisted locally to prevent data loss on browser refresh.

### JSON Import Studio (`/tests/new`)
- Monospace editor with line numbering and syntax validation.
- Format JSON and Clear actions with safety confirmation.
- One-click template loader with pre-filled JEE problems.
- Real-time schema validation with exact field and question index error reporting.
- Live question preview with rendered KaTeX formulas before test creation.

### Pacing Engine & Configuration (`/tests/:id/configure`)
- Transparent duration calculation:
  $$\text{Recommended Duration} = \max(5\text{m}, \sum \text{Estimates} - 15\text{m})$$
- Configurable negative marking, partial marking rules, fullscreen requests, and keyboard shortcuts (`1-4`, `N`, `P`, `R`, `C`).

### Empirical Analytics & Reports (`/tests/:id/result`, `/tests/:id/review`, `/analytics`)
- **Speed Quadrant Matrix**: Fast & Correct, Slow & Correct, Fast & Incorrect (impulsive errors), Slow & Incorrect (severe time sinks).
- **Detailed Solution Review**: Filter by Incorrect, Unanswered, Marked for Review, or Time Exceeded; displays complete step-by-step LaTeX solutions.
- **Multi-Attempt Progression**: Tracks whether accuracy improves over repeated retakes without overwriting previous attempts.

---

## 2. JSON Question Schema

Import your own custom mock tests using this structured format:

```json
{
  "title": "JEE Advanced Mechanics & Calculus Drill",
  "questions": [
    {
      "id": "q1",
      "subject": "Physics",
      "subtopic": "Rotational Dynamics",
      "type": "mcq",
      "question": "A solid sphere rolls down an incline of angle $\\\\theta$. Find linear acceleration.",
      "options": [
        { "id": "A", "text": "$\\\\frac{5}{7} g\\\\sin\\\\theta$" },
        { "id": "B", "text": "$\\\\frac{2}{5} g\\\\sin\\\\theta$" }
      ],
      "answer": "A",
      "marks": 4,
      "negativeMarks": 1,
      "timeEstimateSeconds": 90,
      "solution": "Using $a = \\\\frac{g\\\\sin\\\\theta}{1 + I/MR^2} = \\\\frac{5}{7}g\\\\sin\\\\theta$."
    },
    {
      "id": "q2",
      "subject": "Chemistry",
      "subtopic": "Thermodynamics",
      "type": "multiple",
      "question": "Which properties are state functions?",
      "options": [
        { "id": "A", "text": "Internal Energy ($U$)" },
        { "id": "B", "text": "Enthalpy ($H$)" },
        { "id": "C", "text": "Work ($w$)" },
        { "id": "D", "text": "Entropy ($S$)" }
      ],
      "answers": ["A", "B", "D"],
      "marks": 4,
      "negativeMarks": 2,
      "timeEstimateSeconds": 140
    },
    {
      "id": "q3",
      "subject": "Mathematics",
      "subtopic": "Calculus",
      "type": "integer",
      "question": "Find the value of $\\\\lim_{x \\\\to 0} \\\\frac{\\\\sin 4x}{x}$.",
      "answer": 4,
      "tolerance": 0.01,
      "marks": 4,
      "negativeMarks": 0,
      "timeEstimateSeconds": 60
    },
    {
      "id": "passage_1",
      "subject": "Physics",
      "type": "paragraph",
      "paragraph": "A particle moves in a magnetic field $\\\\mathbf{B} = B_0\\\\hat{k}$ with initial velocity $\\\\mathbf{v}_0$...",
      "parts": [
        {
          "id": "p1_sub1",
          "subject": "Physics",
          "type": "mcq",
          "question": "The trajectory of the particle is:",
          "options": [
            { "id": "A", "text": "Circular" },
            { "id": "B", "text": "Helical" }
          ],
          "answer": "B",
          "marks": 4,
          "negativeMarks": 1
        }
      ]
    }
  ]
}
```

---

## 3. Getting Started

### Development
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### Running Unit Tests
```bash
npm run test
```
Executes the Vitest automated test suite verifying evaluation functions, partial scoring, tolerance matching, and duration algorithms.

### Production Build
```bash
npm run build
```
Generates the production bundle with tree-shaken assets and compiled KaTeX rendering.
