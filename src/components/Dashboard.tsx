import React, { useState, useMemo } from 'react';
import { TestMetadata, TestAttempt } from '../types/test';
import { AppRoute } from '../utils/router';
import {
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  History,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';

interface DashboardProps {
  tests: TestMetadata[];
  attempts: TestAttempt[];
  activeAttempt: TestAttempt | null;
  onNavigate: (route: AppRoute) => void;
  onDeleteTest?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tests,
  attempts,
  activeAttempt,
  onNavigate,
  onDeleteTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date');

  // Compute actual aggregated statistics from completed attempts
  const completedAttempts = useMemo(() => {
    return attempts.filter((a) => a.status === 'completed' && a.evaluation);
  }, [attempts]);

  const stats = useMemo(() => {
    const totalAttempted = completedAttempts.length;
    if (totalAttempted === 0) {
      return {
        totalTestsAttempted: 0,
        averageAccuracy: 0,
        averagePercentageScore: 0,
        averageTimePerQuestion: 0,
        totalQuestionsAttempted: 0,
        bestScorePercentage: 0,
        bestScoreMarks: 0,
      };
    }

    let sumAccuracy = 0;
    let sumPercentage = 0;
    let sumQuestionsAttempted = 0;
    let sumTimeSpent = 0;
    let totalQuestionsCount = 0;
    let bestScorePct = 0;
    let bestMarks = 0;

    completedAttempts.forEach((a) => {
      const ev = a.evaluation!;
      sumAccuracy += ev.accuracy;
      sumPercentage += ev.percentageScore;
      sumQuestionsAttempted += ev.attemptedQuestions;
      sumTimeSpent += ev.totalTimeSpentSeconds;
      totalQuestionsCount += ev.totalQuestions;

      if (ev.percentageScore > bestScorePct) {
        bestScorePct = ev.percentageScore;
        bestMarks = ev.marksObtained;
      }
    });

    return {
      totalTestsAttempted: totalAttempted,
      averageAccuracy: Math.round((sumAccuracy / totalAttempted) * 10) / 10,
      averagePercentageScore: Math.round((sumPercentage / totalAttempted) * 10) / 10,
      averageTimePerQuestion:
        sumQuestionsAttempted > 0 ? Math.round(sumTimeSpent / sumQuestionsAttempted) : 0,
      totalQuestionsAttempted: sumQuestionsAttempted,
      bestScorePercentage: Math.round(bestScorePct * 10) / 10,
      bestScoreMarks: bestMarks,
    };
  }, [completedAttempts]);

  // Aggregate topics across all completed attempts to find genuine weak and strong topics
  const { strongTopics, weakTopics } = useMemo(() => {
    const topicStats: Record<string, { subject: string; attempted: number; correct: number; totalTime: number }> = {};

    completedAttempts.forEach((attempt) => {
      if (!attempt.evaluation) return;
      Object.entries(attempt.evaluation.topicBreakdown).forEach(([topicName, data]) => {
        if (!topicStats[topicName]) {
          topicStats[topicName] = { subject: data.subject, attempted: 0, correct: 0, totalTime: 0 };
        }
        topicStats[topicName].attempted += data.attempted;
        topicStats[topicName].correct += data.correct;
        topicStats[topicName].totalTime += data.averageTimeSeconds * data.attempted;
      });
    });

    const topicList = Object.entries(topicStats).map(([name, d]) => {
      const accuracy = d.attempted > 0 ? (d.correct / d.attempted) * 100 : 0;
      const avgTime = d.attempted > 0 ? Math.round(d.totalTime / d.attempted) : 0;
      return {
        name,
        subject: d.subject,
        attempted: d.attempted,
        correct: d.correct,
        accuracy: Math.round(accuracy),
        avgTime,
      };
    });

    // Qualified topics (attempted >= 2 questions)
    const qualified = topicList.filter((t) => t.attempted >= 2);
    const sortedByAcc = [...qualified].sort((a, b) => b.accuracy - a.accuracy);

    const strong = sortedByAcc.filter((t) => t.accuracy >= 70).slice(0, 3);
    const weak = [...qualified].sort((a, b) => a.accuracy - b.accuracy).filter((t) => t.accuracy < 70).slice(0, 3);

    return { strongTopics: strong, weakTopics: weak };
  }, [completedAttempts]);

  // Filter and sort tests
  const filteredTests = useMemo(() => {
    return tests
      .filter((t) => {
        const matchesQuery =
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Subject filter
        let matchesSubject = true;
        if (selectedSubject !== 'all') {
          matchesSubject = t.questions.some(
            (q) => q.subject.toLowerCase() === selectedSubject.toLowerCase()
          );
        }

        // Status filter
        let matchesStatus = true;
        const testAttempts = attempts.filter((a) => a.testId === t.id);
        const hasCompleted = testAttempts.some((a) => a.status === 'completed');
        const hasInProgress =
          (activeAttempt && activeAttempt.testId === t.id) ||
          testAttempts.some((a) => a.status === 'in_progress');

        if (selectedStatus === 'completed') {
          matchesStatus = hasCompleted;
        } else if (selectedStatus === 'in_progress') {
          matchesStatus = hasInProgress;
        } else if (selectedStatus === 'unattempted') {
          matchesStatus = !hasCompleted && !hasInProgress;
        }

        return matchesQuery && matchesSubject && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        // By default sort by creation date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tests, attempts, activeAttempt, searchQuery, selectedSubject, selectedStatus, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero / Quick Status Banner */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border-b border-slate-800/80 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                <Target className="w-3.5 h-3.5" />
                <span>JEE MAIN &amp; ADVANCED CBT PREPARATION</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Test Command &amp; Performance Lab
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Replicate authentic NTA &amp; IIT JEE exam pressure. Track precision, eliminate negative marks,
                and improve time-per-question with empirical mock metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeAttempt && (
                <button
                  onClick={() =>
                    onNavigate({
                      path: 'tests/attempt',
                      testId: activeAttempt.testId,
                      attemptId: activeAttempt.id,
                    })
                  }
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 transition active:scale-95 animate-pulse"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Test in Progress</span>
                </button>
              )}

              <button
                onClick={() => onNavigate({ path: 'tests/new' })}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Mock</span>
              </button>
            </div>
          </div>

          {/* Performance Summary Cards (Actual Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Tests Attempted</span>
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{stats.totalTestsAttempted}</div>
              <div className="text-[11px] text-slate-500 mt-1">Completed mock exams</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Avg Accuracy</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {stats.totalTestsAttempted > 0 ? `${stats.averageAccuracy}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Correct / attempted</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Avg Score %</span>
                <Award className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-400 font-mono">
                {stats.totalTestsAttempted > 0 ? `${stats.averagePercentageScore}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Net marks / maximum</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Avg Solving Time</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {stats.averageTimePerQuestion > 0 ? `${stats.averageTimePerQuestion}s` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Per attempted problem</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Problems Solved</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 font-mono">
                {stats.totalQuestionsAttempted}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Independent questions</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Personal Best</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {stats.bestScorePercentage > 0 ? `${stats.bestScorePercentage}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Highest percentage</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Speed & Topic Diagnostic Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Diagnostic: Strong Topics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-3">
              <TrendingUp className="w-4 h-4" />
              <span>Highest Accuracy Topics</span>
            </div>
            {strongTopics.length > 0 ? (
              <div className="space-y-3">
                {strongTopics.map((top) => (
                  <div key={top.name} className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">{top.name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        {top.correct}/{top.attempted} correct • {top.avgTime}s avg
                      </div>
                    </div>
                    <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {top.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed py-2">
                Complete at least one full test with multiple topic attempts to establish strong topic confidence.
              </p>
            )}
          </div>

          {/* Diagnostic: Weak Topics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-400 mb-3">
              <TrendingDown className="w-4 h-4" />
              <span>Topics Needing Revision</span>
            </div>
            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.map((top) => (
                  <div key={top.name} className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">{top.name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        {top.correct}/{top.attempted} correct • {top.avgTime}s avg
                      </div>
                    </div>
                    <span className="font-bold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {top.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed py-2">
                No high-error topics detected yet. Once tests are submitted, negative marking patterns will surface here.
              </p>
            )}
          </div>

          {/* Speed & Examination Temperament Insight */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400 mb-2">
                <Zap className="w-4 h-4" />
                <span>CBT Pacing Target</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                JEE Advanced benchmarks recommend averaging under <strong>120 seconds</strong> for single-choice MCQs and <strong>150 seconds</strong> for multi-correct problems.
              </p>
              <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span>Current solving pace</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {stats.averageTimePerQuestion > 0 ? `${stats.averageTimePerQuestion}s / Q` : '120s Target'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((180 - (stats.averageTimePerQuestion || 120)) / 180) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Full Analytics Suite</span>
              <button
                onClick={() => onNavigate({ path: 'analytics' })}
                className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                <span>View charts</span> &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Previous Tests Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Test Library &amp; History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved mock exams, question sets, and previous attempt records
              </p>
            </div>

            {/* Filters and search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
                />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="mathematics">Mathematics</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="unattempted">Not Attempted</option>
              </select>
            </div>
          </div>

          {/* Test List Table / Cards */}
          {filteredTests.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No mock tests found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No tests match your filter criteria, or you haven&apos;t created any tests yet. Click below to paste your questions.
              </p>
              <button
                onClick={() => onNavigate({ path: 'tests/new' })}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Test</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredTests.map((test) => {
                const testAttempts = attempts.filter((a) => a.testId === test.id);
                const latestCompleted = [...testAttempts]
                  .filter((a) => a.status === 'completed' && a.evaluation)
                  .sort(
                    (a, b) =>
                      new Date(b.submittedAt || b.endTime || 0).getTime() -
                      new Date(a.submittedAt || a.endTime || 0).getTime()
                  )[0];
                const isInProgress =
                  (activeAttempt && activeAttempt.testId === test.id) ||
                  testAttempts.some((a) => a.status === 'in_progress');

                // Subject tags
                const subjects = Array.from(
                  new Set(test.questions.map((q) => q.subject).filter(Boolean))
                );

                return (
                  <div
                    key={test.id}
                    className="p-5 hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white hover:text-blue-400 transition">
                          {test.title}
                        </span>

                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            In Progress
                          </span>
                        )}

                        {latestCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Attempted ({testAttempts.length})
                          </span>
                        )}

                        {!latestCompleted && !isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Not Attempted
                          </span>
                        )}
                      </div>

                      {test.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{test.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{test.totalSubQuestions || test.questions.length} Questions</span>
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{test.estimatedSolvingMinutes || 45} mins est.</span>
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{test.totalMarks || 36} Max Marks</span>
                        </span>

                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                          {subjects.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800/80 text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side stats & action buttons */}
                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/80">
                      {latestCompleted && latestCompleted.evaluation && (
                        <div className="text-right hidden sm:block pr-3 border-r border-slate-800">
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {latestCompleted.evaluation.marksObtained} / {latestCompleted.evaluation.maxMarks}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {latestCompleted.evaluation.accuracy}% Acc • {latestCompleted.evaluation.percentageScore}%
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {latestCompleted && (
                          <>
                            <button
                              onClick={() =>
                                onNavigate({
                                  path: 'tests/result',
                                  testId: test.id,
                                  attemptId: latestCompleted.id,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                              Report
                            </button>
                            <button
                              onClick={() =>
                                onNavigate({
                                  path: 'tests/review',
                                  testId: test.id,
                                  attemptId: latestCompleted.id,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                              Review
                            </button>
                          </>
                        )}

                        <button
                          onClick={() =>
                            onNavigate({
                              path: 'tests/configure',
                              testId: test.id,
                            })
                          }
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{latestCompleted ? 'Retake Test' : 'Start Test'}</span>
                        </button>

                        {onDeleteTest && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete test "${test.title}" from your library?`)) {
                                onDeleteTest(test.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
