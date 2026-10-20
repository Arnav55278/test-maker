import React, { useState, useMemo } from 'react';
import {
  TestMetadata,
  TestAttempt,
  FlattenedQuestion,
  McqQuestion,
  MultipleCorrectQuestion,
} from '../types/test';
import { AppRoute } from '../utils/router';
import { flattenQuestions } from '../utils/evaluation';
import { LatexRenderer } from '../utils/latex';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  HelpCircle,
  RotateCcw,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';

interface TestReviewProps {
  test: TestMetadata;
  attempt: TestAttempt;
  onNavigate: (route: AppRoute) => void;
}

export const TestReview: React.FC<TestReviewProps> = ({ test, attempt, onNavigate }) => {
  const flattenedQuestions = useMemo(() => {
    return flattenQuestions(attempt.questionsSnapshot);
  }, [attempt.questionsSnapshot]);

  const ev = attempt.evaluation;

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    flattenedQuestions[0]?.question.id || ''
  );

  // Available subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    flattenedQuestions.forEach((q) => set.add(q.question.subject || 'General'));
    return Array.from(set);
  }, [flattenedQuestions]);

  // Filtered question items
  const filteredItems = useMemo(() => {
    return flattenedQuestions.filter((item) => {
      const resp = attempt.responses[item.question.id];
      const qEv = ev?.questionEvaluations.find((e) => e.questionId === item.question.id);

      // Search match
      const matchesSearch =
        item.question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.question.subtopic && item.question.subtopic.toLowerCase().includes(searchQuery.toLowerCase()));

      // Subject filter
      const matchesSubject =
        filterSubject === 'all' || (item.question.subject || 'General') === filterSubject;

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'incorrect') {
        matchesStatus = qEv?.status === 'incorrect';
      } else if (filterStatus === 'correct') {
        matchesStatus = qEv?.status === 'correct';
      } else if (filterStatus === 'unanswered') {
        matchesStatus = !qEv?.isAttempted;
      } else if (filterStatus === 'review') {
        matchesStatus =
          resp?.status === 'marked_for_review' || resp?.status === 'answered_marked';
      } else if (filterStatus === 'slow') {
        matchesStatus =
          (resp?.timeSpentSeconds || 0) > (item.question.timeEstimateSeconds || 90);
      }

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [flattenedQuestions, attempt.responses, ev, filterStatus, filterSubject, searchQuery]);

  // Current item being inspected
  const currentItem = useMemo(() => {
    return (
      flattenedQuestions.find((q) => q.question.id === activeQuestionId) ||
      flattenedQuestions[0]
    );
  }, [flattenedQuestions, activeQuestionId]);

  const currentEval = useMemo(() => {
    return ev?.questionEvaluations.find((e) => e.questionId === currentItem?.question.id);
  }, [ev, currentItem]);

  const currentResp = useMemo(() => {
    return currentItem ? attempt.responses[currentItem.question.id] : undefined;
  }, [attempt.responses, currentItem]);

  const currentGlobalIdx = flattenedQuestions.findIndex(
    (q) => q.question.id === currentItem?.question.id
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onNavigate({
                  path: 'tests/result',
                  testId: test.id,
                  attemptId: attempt.id,
                })
              }
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Back to Result Report"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Detailed Test Review &amp; Solution Analysis
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {test.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Score: <strong className="text-emerald-400">{ev?.marksObtained}</strong> / {ev?.maxMarks}
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Accuracy: <strong className="text-cyan-400">{ev?.accuracy}%</strong>
            </div>
            <button
              onClick={() => onNavigate({ path: 'dashboard' })}
              className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-semibold text-slate-300 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Filters and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All (${flattenedQuestions.length})` },
              { id: 'incorrect', label: `Incorrect (${ev?.incorrectQuestions || 0})` },
              { id: 'correct', label: `Correct (${ev?.correctQuestions || 0})` },
              { id: 'unanswered', label: `Unanswered (${ev?.unansweredQuestions || 0})` },
              { id: 'review', label: 'Marked Review' },
              { id: 'slow', label: 'Time Exceeded' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search topic or question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* 2-Column Review Layout: Left question palette / list, Right question solution & inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Question Palette & List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[720px] overflow-y-auto space-y-2">
            <span className="text-xs font-bold text-slate-400 block mb-2">
              Question Navigator ({filteredItems.length} matches)
            </span>

            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No questions match the current filter.
              </div>
            ) : (
              filteredItems.map((item) => {
                const qEv = ev?.questionEvaluations.find((e) => e.questionId === item.question.id);
                const isSelected = item.question.id === currentItem?.question.id;

                let badge = (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    Unanswered
                  </span>
                );

                if (qEv?.status === 'correct') {
                  badge = (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                      +{qEv.marksObtained} Correct
                    </span>
                  );
                } else if (qEv?.status === 'incorrect') {
                  badge = (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-mono">
                      {qEv.marksObtained} Wrong
                    </span>
                  );
                } else if (qEv?.status === 'partial') {
                  badge = (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono">
                      +{qEv.marksObtained} Partial
                    </span>
                  );
                }

                return (
                  <button
                    key={item.question.id}
                    onClick={() => setActiveQuestionId(item.question.id)}
                    className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold font-mono text-xs w-6 text-slate-400">
                        Q{item.displayNumber}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">
                          {item.question.subject}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {item.question.subtopic || item.question.type}
                        </span>
                      </div>
                    </div>
                    <div>{badge}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Question Solution Inspector (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            {currentItem ? (
              <div>
                {/* Header for this question */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold bg-blue-600 px-3 py-1 rounded text-white">
                      Question {currentItem.displayNumber}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {currentItem.question.subject}
                    </span>
                    {currentItem.question.subtopic && (
                      <span className="text-xs text-slate-400">
                        • {currentItem.question.subtopic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Time Spent: <strong className="text-cyan-400">{currentResp?.timeSpentSeconds || 0}s</strong> / {currentItem.question.timeEstimateSeconds || 90}s
                    </span>

                    {currentEval && (
                      <span
                        className={`px-2.5 py-1 rounded font-bold ${
                          currentEval.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : currentEval.isPartial
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : currentEval.isAttempted
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {currentEval.marksObtained >= 0
                          ? `+${currentEval.marksObtained}`
                          : currentEval.marksObtained}{' '}
                        Marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Paragraph passage if present */}
                {currentItem.parentId && currentItem.parentParagraphText && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 my-4 text-xs text-slate-300 leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                      Comprehension Passage
                    </span>
                    <LatexRenderer content={currentItem.parentParagraphText} />
                  </div>
                )}

                {/* Question Statement */}
                <div className="my-5 text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                  <LatexRenderer content={currentItem.question.question} />
                </div>

                {/* Student's Answer vs Correct Answer Summary Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                  <div
                    className={`p-4 rounded-xl border ${
                      currentEval?.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : currentEval?.isPartial
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : currentEval?.isAttempted
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-slate-400">
                      Your Response
                    </span>
                    <div className="font-mono text-sm font-bold">
                      {currentEval?.userAnswerSummary || 'Not Attempted'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-emerald-400">
                      Official Correct Answer
                    </span>
                    <div className="font-mono text-sm font-bold text-white">
                      {currentEval?.correctAnswerSummary || '—'}
                    </div>
                  </div>
                </div>

                {/* Options List with Visual Badges for MCQ & Multi-Correct */}
                {(currentItem.question.type === 'mcq' || currentItem.question.type === 'multiple') &&
                  currentItem.question.options && (
                    <div className="space-y-3 mb-6">
                      <span className="text-xs font-bold text-slate-400 block">All Options:</span>
                      {currentItem.question.options.map((opt) => {
                        const isChosen =
                          currentItem.question.type === 'mcq'
                            ? currentResp?.selectedOption === opt.id
                            : (currentResp?.selectedOptions || []).includes(opt.id);

                        const isCorrectOption =
                          currentItem.question.type === 'mcq'
                            ? (currentItem.question as McqQuestion).answer === opt.id
                            : (currentItem.question as MultipleCorrectQuestion).answers?.includes(opt.id);

                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
                              isCorrectOption
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                                : isChosen
                                ? 'bg-rose-950/40 border-rose-500/60 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                                  isCorrectOption
                                    ? 'bg-emerald-600 text-white'
                                    : isChosen
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <LatexRenderer content={opt.text} />
                            </div>

                            <div className="text-xs font-mono">
                              {isCorrectOption && (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Correct Option
                                </span>
                              )}
                              {isChosen && !isCorrectOption && (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 stroke-[3]" /> Your Selection
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Detailed Solution / Explanation */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Solution &amp; Conceptual Derivation</span>
                  </div>

                  {currentItem.question.solution ? (
                    <div className="text-sm text-slate-200 leading-relaxed pt-2">
                      <LatexRenderer content={currentItem.question.solution} />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">
                      No explanation supplied for this question in the imported JSON set.
                    </p>
                  )}
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                  <button
                    disabled={currentGlobalIdx === 0}
                    onClick={() => {
                      if (currentGlobalIdx > 0) {
                        setActiveQuestionId(flattenedQuestions[currentGlobalIdx - 1].question.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
                      currentGlobalIdx === 0
                        ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-white transition'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Question</span>
                  </button>

                  <button
                    disabled={currentGlobalIdx === flattenedQuestions.length - 1}
                    onClick={() => {
                      if (currentGlobalIdx < flattenedQuestions.length - 1) {
                        setActiveQuestionId(flattenedQuestions[currentGlobalIdx + 1].question.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
                      currentGlobalIdx === flattenedQuestions.length - 1
                        ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white transition'
                    }`}
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
