# Competitive Peer Cohort, Leaderboard & Adaptive Target System

Build a high-stakes competitive ranking environment featuring a realistic cohort of 15 virtual JEE aspirants (calibrated strictly from Topper AIR < 100 down to Steady Average AIR ~15,000, with no below-average performers), dynamic test simulation, an interactive Leaderboard, post-test persona benchmarking, and an adaptive score target system calibrated across standard JEE total marks (60, 100, 180, 300, 360).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during the interactive interview:
> - **15 Peer Cohort Scoring**: Dynamic simulation based on question difficulty, subject weights, and question-type affinities (reproducible per test).
> - **Next Target Score System**: Automatically match current test scale with an adaptive, incremental goal out of standard JEE marks (60, 100, 180, 300, 360), indicating exact questions needed to overtake the next peer rank.
> - **Leaderboard Presentation**: Dedicated `/leaderboard` route and navigation tab, integrated with test result report rank cards and head-to-head persona benchmarks in `/analytics`.

---

## 1. Overview & Core Concept

### What It Does
- **15 Distinct JEE Aspirant Personas**: Curated peer cohort ranging from Kota star-batch toppers (AIR < 100, IQ ~145) to disciplined average students (AIR ~15,000, IQ ~108). No student is below average.
- **Dynamic Peer Test Simulation**: When any mock test is created or completed, each peer persona's performance is computed based on their unique subject proficiencies, question-type masteries, and error resistance against the actual test questions.
- **Live Leaderboard (`/leaderboard`)**:
  - *Cumulative Standings*: Overall rank across all attempted tests with percentile badges, average scores, and rank tiers.
  - *Test-by-Test Standings*: Exact rank on any specific mock test with user vs. peer breakdown.
- **"If This Person Took The Test" Persona Simulator (`/analytics` & `/tests/:id/result`)**:
  - Interactive simulator allowing the student to select any of the 15 peers and see their projected score, subject split, time taken, and a head-to-head comparison against the user's score.
- **Adaptive Next Target Engine (60 / 100 / 180 / 300 / 360)**:
  - Detects the paper format (e.g. 60-mark chapter drill, 100-mark single subject, 180-mark Advanced paper, 300-mark JEE Main, 360-mark full paper) and sets a realistic target goal, providing actionable advice on reducing negative marks to overtake the next ranked peer.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Navigating to Leaderboard**:
   - User clicks `Leaderboard` in top navigation bar (`/leaderboard`).
   - Sees their overall rank among the 16 students (1 user + 15 peers), gap to the topper, and podium highlight cards.
   - Can switch between "Overall Cumulative Standings" and "Test-Specific Leaderboards".
2. **Completing a Mock Test (`/tests/:id/result`)**:
   - In the result header, a prominent **Rank & Cohort Standing Card** displays:
     - e.g. "Rank 4 of 16" (Top 25% Percentile).
     - Points behind Rank 3 peer and ahead of Rank 5 peer.
     - Direct "View Leaderboard" and "Compare with Peers" buttons.
3. **Exploring Persona Benchmarks (`/analytics` or Result Report)**:
   - User selects a peer from the dropdown (e.g., *Aarav Sharma - AIR 45 Topper* or *Diya Patel - Consistent Above Average*).
   - The view reveals "If [Student] gave this test, they would score X / Max Marks" with a radar/bar comparison.
4. **Adaptive Target Projection**:
   - Visual milestone dial showing current score vs. recommended next target (e.g. Target: 240 / 300).
   - "How to Reach This Target": Converts the required mark increase into concrete question actions (e.g., "Avoid 2 negative marks in Multi-Correct and solve 3 more Calculus questions").

### Visual Identity & Theme
- **Color Discipline**:
  - 60% Dark slate canvas (`#020617`, `#0f172a`).
  - 30% Structural cards with hairline borders (`#1e293b`).
  - 10% Accents: Gold/Amber (`#f59e0b`) for Rank 1 Toppers, Electric Cyan (`#06b6d4`) for User Rank, Emerald (`#10b981`) for Positive Deltas, Rose (`#f43f5e`) for Negative Deltas.
- **Zero-Pill Discipline**:
  - Clean unboxed typography with tabular figures (`tabular-nums`) for rankings, scores, and percentages.
- **Typography**:
  - High-clarity sans-serif headers paired with monospace tabular numerals for leaderboards.

---

## 3. Key Product Decisions & Trade-Offs

- **Deterministic Peer Simulation Algorithm**:
  - *Chosen*: Seeded PRNG based on test ID and question attributes.
  - *Why*: Ensures scores for a test are reproducible and consistent across page reloads without requiring a heavyweight background server daemon, while reacting realistically to paper difficulty.
- **Adaptive Standard Scale Normalization (60, 100, 180, 300, 360)**:
  - *Chosen*: Automatic nearest standard scale detection with a manual target selector override.
  - *Why*: Accommodates both custom quick chapter tests (e.g. 36 marks or 60 marks) and official standard papers (180 or 300 marks).
- **No Below-Average Constraint**:
  - *Chosen*: Peer cohort IQ and proficiency parameters are bounded strictly between 108 and 148 (average percentile $\ge 50$th percentile to 99.9th percentile).
  - *Why*: Matches competitive JEE classroom dynamics (like top Kota batches) where every peer is a serious aspirant.

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Routes                         │
│  /dashboard  │  /tests/attempt  │  /tests/result  │  /leaderboard  │  /analytics
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Storage Layer & State Management                     │
│  - StorageService (localStorage + snapshots)                          │
│  - CohortService (15 peer profiles & simulation engine)               │
│  - TargetService (Target calculations out of 60/100/180/300/360)       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Leaderboard View & Cards       │  │    Persona Simulator & Target │
│ - Podium (Rank 1, 2, 3)              │  │ - "If this person gave marks" │
│ - 16-Student Ranked Table            │  │ - Head-to-Head Comparison    │
│ - Filter by Test / All Tests         │  │ - Next Target Dial (60..360) │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Component & File Strategy:
1. `src/types/cohort.ts`: Data types for `PeerStudent`, `PeerSimulationResult`, `CohortLeaderboardEntry`, `NextTargetPlan`.
2. `src/utils/cohortSimulation.ts`: Definitions for 15 peer aspirants with detailed subject/type weights, simulation formulas, and deterministic ranking generator.
3. `src/utils/targetEngine.ts`: Logic to detect closest standard exam scale (60, 100, 180, 300, 360) and compute adaptive milestones.
4. `src/components/Leaderboard.tsx`: Dedicated full-featured Leaderboard page with podium cards, search/filter, and test selector.
5. `src/components/PersonaSimulator.tsx`: Interactive post-test simulation widget ("If this person took the test, they would score X").
6. `src/components/NextTargetWidget.tsx`: Dynamic target card showing progress toward 60/100/180/300/360 marks with tactical instructions.
7. Integrate into `src/components/Header.tsx`, `src/components/TestResult.tsx`, `src/components/Analytics.tsx`, and `src/App.tsx`.

---

## 5. Verification Plan

1. **Cohort Simulation Tests**:
   - Verify that all 15 peer profiles have consistent simulated scores across different tests.
   - Verify that simulated topper students score higher on hard questions than average students.
   - Verify that no peer student scores below the defined average threshold.
2. **Leaderboard Verification**:
   - Verify that the user is accurately inserted into the 16-student rank order based on their actual score.
   - Verify switching between "All Tests Cumulative" and individual test leaderboards.
3. **Persona Benchmark Verification**:
   - Verify that selecting any of the 15 students accurately displays their simulated score and head-to-head delta against the user.
4. **Adaptive Target Engine**:
   - Test target calculations for tests out of 60, 100, 180, 300, and 360 marks.
   - Verify target increments are challenging yet achievable based on the user's current score.
5. **Compilation & Linting**:
   - Run `tsc --noEmit` and `compile_applet` to ensure zero compilation or type errors.
   - Run `npm test` with Vitest to ensure all automated unit tests pass.
