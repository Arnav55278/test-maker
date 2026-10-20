import React, { useMemo } from 'react';
import { TestAttempt, TestMetadata } from '../types/test';
import { AppRoute } from '../utils/router';
import { StorageService } from '../db/storage';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  Flame,
  HelpCircle,
  History,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

interface TestResultProps {
  test: TestMetadata;
  attempt: TestAttempt;
  onNavigate: (route: AppRoute) => void;
}

const COLORS = {
  correct: '#10B981', // Emerald
  incorrect: '#F43F5E', // Rose
  partial: '#F59E0B', // Amber
  unanswered: '#475569', // Slate
  physics: '#3B82F6', // Blue
  chemistry: '#10B981', // Green
  math: '#8B5CF6', // Purple
};

export const TestResult: React.FC<TestResultProps> = ({ test, attempt, onNavigate }) => {
  const ev = attempt.evaluation;

  // Format time spent helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Performance breakdown chart data
  const breakdownData = useMemo(() => {
    if (!ev) return [];
    return [
      { name: 'Correct', value: ev.correctQuestions, color: COLORS.correct },
      { name: 'Incorrect', value: ev.incorrectQuestions, color: COLORS.incorrect },
      { name: 'Partial', value: ev.partialQuestions, color: COLORS.partial },
      { name: 'Unanswered', value: ev.unansweredQuestions, color: COLORS.unanswered },
    ].filter((item) => item.value > 0);
  }, [ev]);

  // Subject-wise performance bar chart data
  const subjectChartData = useMemo(() => {
    if (!ev) return [];
    return Object.entries(ev.subjectBreakdown).map(([subject, data]) => ({
      subject,
      'Marks Obtained': data.marksObtained,
      'Max Marks': data.maxMarks,
      'Accuracy %': Math.round(data.accuracy),
      'Time Spent (m)': Math.round(data.timeSpentSeconds / 60),
    }));
  }, [ev]);

  // Time Analysis per question data (Actual vs Estimated Benchmark)
  const timeAnalysisData = useMemo(() => {
    if (!ev) return [];
    return ev.questionEvaluations.map((q, idx) => ({
      question: `Q${idx + 1}`,
      'Actual Time (s)': q.timeSpentSeconds,
      'Benchmark (s)': q.timeEstimateSeconds,
      status: q.status,
    }));
  }, [ev]);

  // Speed Quadrant Distribution
  const speedQuadrant = useMemo(() => {
    if (!ev) {
      return {
        fastCorrect: [],
        slowCorrect: [],
        fastIncorrect: [],
        slowIncorrect: [],
        skipped: [],
      };
    }

    const fastCorrect = ev.questionEvaluations.filter((q) => q.speedCategory === 'fast_correct');
    const slowCorrect = ev.questionEvaluations.filter((q) => q.speedCategory === 'slow_correct');
    const fastIncorrect = ev.questionEvaluations.filter((q) => q.speedCategory === 'fast_incorrect');
    const slowIncorrect = ev.questionEvaluations.filter((q) => q.speedCategory === 'slow_incorrect');
    const skipped = ev.questionEvaluations.filter((q) => q.speedCategory === 'skipped');

    return { fastCorrect, slowCorrect, fastIncorrect, slowIncorrect, skipped };
  }, [ev]);

  // Historical attempt trend for this specific test
  const testAttemptsTrend = useMemo(() => {
    const allAttempts = StorageService.getAttemptsByTestId(test.id).filter(
      (a) => a.status === 'completed' && a.evaluation
    );
    return allAttempts
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map((a, i) => ({
        attemptName: `Attempt ${i + 1}`,
        'Score %': a.evaluation!.percentageScore,
        'Accuracy %': a.evaluation!.accuracy,
        Marks: a.evaluation!.marksObtained,
      }));
  }, [test.id]);

  // Actionable Insights based on real empirical metrics
  const insights = useMemo(() => {
    if (!ev) return [];
    const list: { title: string; desc: string; type: 'positive' | 'warning' | 'info' }[] = [];

    // Check speed vs accuracy on incorrect
    if (speedQuadrant.fastIncorrect.length >= 2) {
      list.push({
        title: 'Impulsive Negative Mark Risk',
        desc: `You answered ${speedQuadrant.fastIncorrect.length} questions quickly but incorrectly. Slowing down by just 15-20 seconds on reading question nuances will prevent major mark leakages.`,
        type: 'warning',
      });
    }

    // Check time sinks
    if (speedQuadrant.slowIncorrect.length >= 1) {
      list.push({
        title: 'Severe Time-Sink Detected',
        desc: `You spent excess time on ${speedQuadrant.slowIncorrect.length} questions without scoring marks. In real JEE exams, learn to cut losses and leave stubborn problems after 2.5 minutes.`,
        type: 'warning',
      });
    }

    // High speed & accuracy
    if (speedQuadrant.fastCorrect.length >= 3) {
      list.push({
        title: 'High-Efficiency Conceptual Mastery',
        desc: `You solved ${speedQuadrant.fastCorrect.length} questions faster than the benchmark pace with perfect accuracy. These represent your core strengths.`,
        type: 'positive',
      });
    }

    // Multi-correct check
    const multiEvaluations = ev.questionEvaluations.filter((q) => q.type === 'multiple');
    const multiIncorrect = multiEvaluations.filter((q) => q.status === 'incorrect');
    if (multiIncorrect.length > 0) {
      list.push({
        title: 'Multi-Correct Option Trap',
        desc: `Lost marks on ${multiIncorrect.length} multiple-correct questions. Make sure to re-verify every option independently rather than guessing full sets.`,
        type: 'info',
      });
    }

    return list;
  }, [ev, speedQuadrant]);

  if (!ev) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Evaluation Pending</h2>
          <p className="text-xs text-slate-400 mt-2">
            This test attempt is still in progress or could not be evaluated.
          </p>
          <button
            onClick={() => onNavigate({ path: 'dashboard' })}
            className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const attemptDateStr = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(attempt.submittedAt || attempt.startTime));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner / Hero Report */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>OFFICIAL EVALUATION SEALED</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {attempt.testTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-3">
                <span>Attempted on {attemptDateStr}</span>
                <span>•</span>
                <span>Total Time Used: <strong className="text-cyan-400 font-mono">{formatTime(ev.totalTimeSpentSeconds)}</strong></span>
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onNavigate({
                    path: 'tests/review',
                    testId: test.id,
                    attemptId: attempt.id,
                  })
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-md shadow-blue-600/30 transition active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Question Review</span>
              </button>

              <button
                onClick={() =>
                  onNavigate({
                    path: 'tests/configure',
                    testId: test.id,
                  })
                }
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake Mock</span>
              </button>

              <button
                onClick={() => onNavigate({ path: 'analytics' })}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg border border-slate-700 transition"
              >
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Analytics Suite</span>
              </button>

              <button
                onClick={() => onNavigate({ path: 'dashboard' })}
                className="px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Big Score Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Total Marks</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                {ev.marksObtained} <span className="text-xs text-slate-500 font-normal">/ {ev.maxMarks}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Net score with penalties</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Percentage</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 mt-1">
                {ev.percentageScore}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Overall paper yield</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Accuracy</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-400 mt-1">
                {ev.accuracy}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Correct / Attempted</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Attempt Rate</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
                {ev.attemptedQuestions} <span className="text-xs text-slate-500 font-normal">/ {ev.totalQuestions}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{ev.attemptRate}% paper covered</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Correct / Wrong</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">
                <span className="text-emerald-400">{ev.correctQuestions}</span>
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-rose-400">{ev.incorrectQuestions}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {ev.partialQuestions > 0 ? `+ ${ev.partialQuestions} partial credit` : '0 partial'}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block">Avg Speed</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 mt-1">
                {ev.averageTimePerAttempted}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Per attempted problem</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Empirical Actionable Insights Alert Cards */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Exam Temperament &amp; Strategy Diagnostics</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    ins.type === 'warning'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : ins.type === 'positive'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <strong className="block text-sm font-bold mb-1 text-white">{ins.title}</strong>
                  {ins.desc}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row 1: Performance Breakdown & Subject Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart A: Performance Breakdown Donut */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Accuracy &amp; Response Distribution</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {ev.totalQuestions} Questions Total
              </span>
            </div>

            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    label={(entry) => `${entry.name} (${entry.value})`}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart B: Subject-Wise Marks & Accuracy */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span>Subject-Wise Marks &amp; Accuracy</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Physics / Chem / Math</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="Marks Obtained" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Max Marks" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Solving Time Per Question vs Benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Time Spent per Question vs Benchmark Target</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare actual solving duration against target pacing to identify speed leaks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-3 bg-cyan-500 rounded"></span> Actual
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 bg-slate-600 rounded"></span> Target Pace
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeAnalysisData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="question" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="Actual Time (s)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Benchmark (s)" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Quadrant Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Speed &amp; Accuracy Quadrant Classification</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Classification of questions based on speed relative to expected duration and evaluation correctness.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Fast & Correct */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                <span>Fast &amp; Correct ({speedQuadrant.fastCorrect.length})</span>
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                High confidence, lightning pace. Target behavior for JEE scoring.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {speedQuadrant.fastCorrect.map((q) => (
                  <span
                    key={q.questionId}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                  >
                    Q{q.globalIndex + 1} ({q.timeSpentSeconds}s)
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Slow & Correct */}
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-2">
                <span>Slow &amp; Correct ({speedQuadrant.slowCorrect.length})</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Accurate but took longer than benchmark. Train calculation shortcuts.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {speedQuadrant.slowCorrect.map((q) => (
                  <span
                    key={q.questionId}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60"
                  >
                    Q{q.globalIndex + 1} ({q.timeSpentSeconds}s)
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Fast & Incorrect */}
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2">
                <span>Fast &amp; Incorrect ({speedQuadrant.fastIncorrect.length})</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Impulsive mistakes. Silly errors and misread conditions.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {speedQuadrant.fastIncorrect.map((q) => (
                  <span
                    key={q.questionId}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60"
                  >
                    Q{q.globalIndex + 1} ({q.timeSpentSeconds}s)
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Slow & Incorrect */}
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
                <span>Slow &amp; Incorrect ({speedQuadrant.slowIncorrect.length})</span>
                <XCircle className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Double loss: wasted exam time AND received negative mark penalty.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {speedQuadrant.slowIncorrect.map((q) => (
                  <span
                    key={q.questionId}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60"
                  >
                    Q{q.globalIndex + 1} ({q.timeSpentSeconds}s)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Progress Chart if multiple attempts exist */}
        {testAttemptsTrend.length > 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Multi-Attempt Progress on this Test ({testAttemptsTrend.length} Runs)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tracking your empirical score and accuracy improvement over repeated attempts
            </p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testAttemptsTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="attemptName" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Score %" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Accuracy %" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
