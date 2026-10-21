import React, { useState, useMemo } from 'react';
import { TestAttempt, TestMetadata } from '../types/test';
import { AppRoute } from '../utils/router';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Award,
  BarChart2,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  History,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { generateCumulativeLeaderboard } from '../utils/cohortSimulation';
import { PersonaSimulator } from './PersonaSimulator';
import { NextTargetWidget } from './NextTargetWidget';

interface AnalyticsProps {
  tests: TestMetadata[];
  attempts: TestAttempt[];
  onNavigate: (route: AppRoute) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ tests, attempts, onNavigate }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<'all' | '30d' | '7d'>('all');

  // Filter completed attempts with evaluations
  const completedAttempts = useMemo(() => {
    return attempts
      .filter((a) => a.status === 'completed' && a.evaluation)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [attempts]);

  const cumulativeLeaderboard = useMemo(() => {
    return generateCumulativeLeaderboard(tests, attempts);
  }, [tests, attempts]);

  const activeTestForSimulation = tests[0];
  const activeAttemptForSimulation = completedAttempts[completedAttempts.length - 1];

  // Overall aggregate stats
  const overallMetrics = useMemo(() => {
    if (completedAttempts.length === 0) {
      return {
        totalAttempts: 0,
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        avgPacePerQuestion: 0,
        questionsWithinEstimatePct: 0,
        bestPercentage: 0,
      };
    }

    let totalSolved = 0;
    let totalCorrect = 0;
    let totalTimeSpent = 0;
    let totalWithinBenchmark = 0;
    let bestPct = 0;

    completedAttempts.forEach((att) => {
      const ev = att.evaluation!;
      totalSolved += ev.attemptedQuestions;
      totalCorrect += ev.correctQuestions;
      totalTimeSpent += ev.totalTimeSpentSeconds;
      if (ev.percentageScore > bestPct) bestPct = ev.percentageScore;

      ev.questionEvaluations.forEach((q) => {
        if (q.isAttempted && q.timeSpentSeconds <= q.timeEstimateSeconds * 1.1) {
          totalWithinBenchmark++;
        }
      });
    });

    const overallAccuracy = totalSolved > 0 ? (totalCorrect / totalSolved) * 100 : 0;
    const avgPace = totalSolved > 0 ? Math.round(totalTimeSpent / totalSolved) : 0;
    const questionsWithinEstimatePct =
      totalSolved > 0 ? Math.round((totalWithinBenchmark / totalSolved) * 100) : 0;

    return {
      totalAttempts: completedAttempts.length,
      totalQuestionsAnswered: totalSolved,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
      avgPacePerQuestion: avgPace,
      questionsWithinEstimatePct,
      bestPercentage: Math.round(bestPct * 10) / 10,
    };
  }, [completedAttempts]);

  // Chronological score & accuracy trend data
  const trendData = useMemo(() => {
    return completedAttempts.map((att, idx) => ({
      name: `Test ${idx + 1}`,
      date: new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(
        new Date(att.startTime)
      ),
      'Score %': att.evaluation!.percentageScore,
      'Accuracy %': att.evaluation!.accuracy,
      'Marks Net': att.evaluation!.marksObtained,
      'Pace (s)': att.evaluation!.averageTimePerAttempted,
    }));
  }, [completedAttempts]);

  // Subject accuracy & distribution across attempts
  const subjectPerformance = useMemo(() => {
    const subjectsMap: Record<
      string,
      { attempted: number; correct: number; totalMarks: number; maxMarks: number; time: number }
    > = {
      Physics: { attempted: 0, correct: 0, totalMarks: 0, maxMarks: 0, time: 0 },
      Chemistry: { attempted: 0, correct: 0, totalMarks: 0, maxMarks: 0, time: 0 },
      Mathematics: { attempted: 0, correct: 0, totalMarks: 0, maxMarks: 0, time: 0 },
    };

    completedAttempts.forEach((att) => {
      Object.entries(att.evaluation!.subjectBreakdown).forEach(([sub, data]) => {
        if (!subjectsMap[sub]) {
          subjectsMap[sub] = { attempted: 0, correct: 0, totalMarks: 0, maxMarks: 0, time: 0 };
        }
        subjectsMap[sub].attempted += data.attempted;
        subjectsMap[sub].correct += data.correct;
        subjectsMap[sub].totalMarks += data.marksObtained;
        subjectsMap[sub].maxMarks += data.maxMarks;
        subjectsMap[sub].time += data.timeSpentSeconds;
      });
    });

    return Object.entries(subjectsMap).map(([subject, d]) => {
      const accuracy = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
      const avgTime = d.attempted > 0 ? Math.round(d.time / d.attempted) : 0;
      return {
        subject,
        'Accuracy %': accuracy,
        'Average Time (s)': avgTime,
        Attempted: d.attempted,
        'Net Marks': d.totalMarks,
      };
    });
  }, [completedAttempts]);

  // Question type difficulty comparison
  const questionTypeComparison = useMemo(() => {
    const types: Record<string, { total: number; attempted: number; correct: number; time: number }> = {
      mcq: { total: 0, attempted: 0, correct: 0, time: 0 },
      multiple: { total: 0, attempted: 0, correct: 0, time: 0 },
      integer: { total: 0, attempted: 0, correct: 0, time: 0 },
      matching: { total: 0, attempted: 0, correct: 0, time: 0 },
    };

    completedAttempts.forEach((att) => {
      att.evaluation!.questionEvaluations.forEach((q) => {
        if (!types[q.type]) {
          types[q.type] = { total: 0, attempted: 0, correct: 0, time: 0 };
        }
        types[q.type].total++;
        types[q.type].time += q.timeSpentSeconds;
        if (q.isAttempted) {
          types[q.type].attempted++;
          if (q.isCorrect) types[q.type].correct++;
        }
      });
    });

    const labels: Record<string, string> = {
      mcq: 'Single MCQ',
      multiple: 'Multi-Correct',
      integer: 'Numerical',
      matching: 'Matrix Match',
    };

    return Object.entries(types).map(([key, data]) => {
      const accuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
      const avgPace = data.total > 0 ? Math.round(data.time / data.total) : 0;
      return {
        type: labels[key] || key.toUpperCase(),
        'Accuracy %': accuracy,
        'Average Time (s)': avgPace,
        Attempted: data.attempted,
      };
    });
  }, [completedAttempts]);

  // Topic mastery list with minimum sample threshold
  const topicMasteryList = useMemo(() => {
    const map: Record<string, { subject: string; attempted: number; correct: number; totalTime: number }> = {};

    completedAttempts.forEach((att) => {
      Object.entries(att.evaluation!.topicBreakdown).forEach(([name, data]) => {
        if (!map[name]) {
          map[name] = { subject: data.subject, attempted: 0, correct: 0, totalTime: 0 };
        }
        map[name].attempted += data.attempted;
        map[name].correct += data.correct;
        map[name].totalTime += data.averageTimeSeconds * data.attempted;
      });
    });

    return Object.entries(map)
      .map(([name, d]) => {
        const accuracy = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
        const avgTime = d.attempted > 0 ? Math.round(d.totalTime / d.attempted) : 0;
        return {
          topic: name,
          subject: d.subject,
          attempted: d.attempted,
          correct: d.correct,
          accuracy,
          avgTime,
          confidence: d.attempted >= 3 ? 'High' : d.attempted >= 2 ? 'Medium' : 'Initial',
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [completedAttempts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                <BarChart2 className="w-4 h-4" />
                <span>LONG-TERM PERFORMANCE INTELLIGENCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Speed, Accuracy &amp; Topic Mastery
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Synthesized metrics across {completedAttempts.length} completed mock examinations. All values derived from real response logs.
              </p>
            </div>

            <button
              onClick={() => onNavigate({ path: 'dashboard' })}
              className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Total Mock Runs</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {overallMetrics.totalAttempts}
              </div>
              <span className="text-[10px] text-slate-500">{overallMetrics.totalQuestionsAnswered} problems solved</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Overall Precision</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {overallMetrics.overallAccuracy}%
              </div>
              <span className="text-[10px] text-slate-500">Net accuracy rate</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Average Question Pace</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {overallMetrics.avgPacePerQuestion}s
              </div>
              <span className="text-[10px] text-slate-500">JEE target: &lt; 120s</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Pacing Discipline</span>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {overallMetrics.questionsWithinEstimatePct}%
              </div>
              <span className="text-[10px] text-slate-500">Solved within benchmark</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Peak Mock Score</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {overallMetrics.bestPercentage}%
              </div>
              <span className="text-[10px] text-slate-500">Personal record</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Adaptive Score Target Engine Widget (60 / 100 / 180 / 300 / 360) */}
        <NextTargetWidget
          currentMarks={
            completedAttempts.reduce((acc, a) => acc + (a.evaluation?.marksObtained || 0), 0)
          }
          currentMaxMarks={
            completedAttempts.reduce((acc, a) => acc + (a.evaluation?.maxMarks || 0), 0) || 100
          }
          leaderboard={cumulativeLeaderboard}
        />

        {/* Persona Simulator: "If this person gave the marks, how much would they score?" */}
        {activeTestForSimulation && (
          <PersonaSimulator
            test={activeTestForSimulation}
            attempt={activeAttemptForSimulation}
          />
        )}

        {/* Row 1: Chronological Score & Accuracy Progression */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Score &amp; Accuracy Progression Across Attempts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Measures whether your accuracy stabilizes as you push faster solving speeds
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-blue-400 font-semibold">• Score %</span>
              <span className="text-emerald-400 font-semibold">• Accuracy %</span>
            </div>
          </div>

          {trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No completed tests yet. Attempt your first mock test to generate trend lines.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="Score %" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Accuracy %" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Subject Mastery vs Question Type Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart: Subject-wise Accuracy Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Subject Performance Comparison</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Empirical accuracy and average solving time across Physics, Chemistry, and Mathematics
            </p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="Accuracy %" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Average Time (s)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart: Question Type Difficulty */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Question Type Mastery</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Track whether Multi-Correct, Matrix Matching, or Numerical problems cause negative marks
            </p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionTypeComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="Accuracy %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Average Time (s)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Topic-by-Topic Empirical Mastery Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Topic Mastery Ledger (All Attempted Concepts)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Qualified by attempt count to prevent misleading single-problem conclusions
              </p>
            </div>
          </div>

          {topicMasteryList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No topic attempts recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {topicMasteryList.map((top) => (
                <div
                  key={top.topic}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{top.topic}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {top.subject}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          top.confidence === 'High'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Confidence: {top.confidence} ({top.attempted} Qs)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                      {top.correct} of {top.attempted} correct • Avg pace: {top.avgTime}s
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${
                          top.accuracy >= 75
                            ? 'bg-emerald-500'
                            : top.accuracy >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${top.accuracy}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded text-xs ${
                        top.accuracy >= 75
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : top.accuracy >= 50
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {top.accuracy}% Accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
