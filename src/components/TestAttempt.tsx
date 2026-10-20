import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TestAttempt,
  UserResponse,
  QuestionAttemptStatus,
  FlattenedQuestion,
  MatchingQuestion,
} from '../types/test';
import { AppRoute } from '../utils/router';
import { flattenQuestions, evaluateAttempt } from '../utils/evaluation';
import { StorageService } from '../db/storage';
import { LatexRenderer } from '../utils/latex';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Eye,
  HelpCircle,
  Maximize,
  Maximize2,
  Minimize2,
  Radio,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface TestAttemptProps {
  attempt: TestAttempt;
  onNavigate: (route: AppRoute) => void;
  onAttemptSubmitted: (attempt: TestAttempt) => void;
}

export const TestAttemptComponent: React.FC<TestAttemptProps> = ({
  attempt: initialAttempt,
  onNavigate,
  onAttemptSubmitted,
}) => {
  const [attempt, setAttempt] = useState<TestAttempt>(initialAttempt);
  const flattenedQuestions = useMemo(() => {
    return flattenQuestions(attempt.questionsSnapshot);
  }, [attempt.questionsSnapshot]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [fullscreenAlert, setFullscreenAlert] = useState(false);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Time tracking per question
  const questionStartTimeRef = useRef<number>(Date.now());
  const activeInputRef = useRef<boolean>(false);

  // Current active question
  const currentItem: FlattenedQuestion | undefined = flattenedQuestions[currentIndex];

  // Subjects in this test
  const subjects = useMemo(() => {
    const set = new Set<string>();
    flattenedQuestions.forEach((q) => {
      set.add(q.question.subject || 'General');
    });
    return Array.from(set);
  }, [flattenedQuestions]);

  // Current question response state
  const currentResponse: UserResponse = useMemo(() => {
    if (!currentItem) {
      return {
        questionId: '',
        status: 'not_visited',
        timeSpentSeconds: 0,
        visitedCount: 0,
      };
    }
    const existing = attempt.responses[currentItem.question.id];
    if (existing) {
      return existing;
    }
    return {
      questionId: currentItem.question.id,
      status: 'visited_unanswered',
      timeSpentSeconds: 0,
      visitedCount: 1,
    };
  }, [attempt.responses, currentItem]);

  // Real deadline-based countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const deadlineMs = new Date(attempt.deadlineTime).getTime();
    const nowMs = Date.now();
    return Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
  });

  // Commit current question's time spent and visit state
  const commitTimeSpent = useCallback(() => {
    if (!currentItem) return;
    const now = Date.now();
    const elapsedSec = Math.round((now - questionStartTimeRef.current) / 1000);
    questionStartTimeRef.current = now;

    if (elapsedSec > 0) {
      setAttempt((prev) => {
        const qId = currentItem.question.id;
        const prevResp = prev.responses[qId] || {
          questionId: qId,
          status: 'visited_unanswered',
          timeSpentSeconds: 0,
          visitedCount: 0,
        };
        const updatedResponses = {
          ...prev.responses,
          [qId]: {
            ...prevResp,
            timeSpentSeconds: prevResp.timeSpentSeconds + elapsedSec,
          },
        };
        const updatedAttempt = { ...prev, responses: updatedResponses };
        StorageService.setActiveAttempt(updatedAttempt);
        return updatedAttempt;
      });
    }
  }, [currentItem]);

  // Final submission handler
  const handleFinalSubmit = useCallback(() => {
    commitTimeSpent();
    const now = new Date().toISOString();
    const finalResponses = { ...attempt.responses };

    // Mark any unvisited questions explicitly
    flattenedQuestions.forEach((item) => {
      if (!finalResponses[item.question.id]) {
        finalResponses[item.question.id] = {
          questionId: item.question.id,
          status: 'not_visited',
          timeSpentSeconds: 0,
          visitedCount: 0,
        };
      }
    });

    const evaluated = evaluateAttempt(
      attempt.questionsSnapshot,
      finalResponses,
      attempt.settingsSnapshot
    );

    const completedAttempt: TestAttempt = {
      ...attempt,
      endTime: now,
      submittedAt: now,
      status: 'completed',
      responses: finalResponses,
      evaluation: evaluated,
    };

    StorageService.setActiveAttempt(null);
    StorageService.saveAttempt(completedAttempt);
    onAttemptSubmitted(completedAttempt);
    onNavigate({
      path: 'tests/result',
      testId: completedAttempt.testId,
      attemptId: completedAttempt.id,
    });
  }, [attempt, flattenedQuestions, commitTimeSpent, onAttemptSubmitted, onNavigate]);

  // Timer interval with deadline drift correction
  useEffect(() => {
    const deadlineMs = new Date(attempt.deadlineTime).getTime();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
      setRemainingSeconds(diffSec);

      // Time warnings
      if (diffSec === 900) {
        setTimeWarning('15 minutes remaining');
      } else if (diffSec === 300) {
        setTimeWarning('5 minutes remaining! Finish review.');
      } else if (diffSec === 60) {
        setTimeWarning('1 minute remaining! Answers will auto-submit.');
      }

      if (diffSec <= 0) {
        clearInterval(interval);
        if (attempt.settingsSnapshot.autoSubmitOnZeroTime) {
          handleFinalSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt.deadlineTime, attempt.settingsSnapshot.autoSubmitOnZeroTime, handleFinalSubmit]);

  // Mark current question visited upon navigation
  useEffect(() => {
    if (!currentItem) return;
    questionStartTimeRef.current = Date.now();

    setAttempt((prev) => {
      const qId = currentItem.question.id;
      const prevResp = prev.responses[qId];
      if (!prevResp) {
        const updated = {
          ...prev,
          responses: {
            ...prev.responses,
            [qId]: {
              questionId: qId,
              status: 'visited_unanswered' as QuestionAttemptStatus,
              timeSpentSeconds: 0,
              visitedCount: 1,
            },
          },
        };
        StorageService.setActiveAttempt(updated);
        return updated;
      }
      return prev;
    });
  }, [currentIndex, currentItem]);

  // Tab switch detection
  useEffect(() => {
    if (!attempt.settingsSnapshot.warnOnTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAttempt((prev) => {
          const updated = { ...prev, tabSwitchCount: (prev.tabSwitchCount || 0) + 1 };
          StorageService.setActiveAttempt(updated);
          return updated;
        });
        setTabSwitchAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt.settingsSnapshot.warnOnTabSwitch]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!attempt.settingsSnapshot.warnOnFullscreenExit) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attempt.settingsSnapshot.enableFullscreen) {
        setFullscreenAlert(true);
        setAttempt((prev) => {
          const updated = { ...prev, fullscreenExitCount: (prev.fullscreenExitCount || 0) + 1 };
          StorageService.setActiveAttempt(updated);
          return updated;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [attempt.settingsSnapshot.warnOnFullscreenExit, attempt.settingsSnapshot.enableFullscreen]);

  // Format time remaining string (HH:MM:SS)
  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Helper to persist answer updates with saving indicator
  const updateCurrentResponse = (updater: (prev: UserResponse) => Partial<UserResponse>) => {
    if (!currentItem) return;
    setSaveStatus('saving');
    const qId = currentItem.question.id;

    setAttempt((prev) => {
      const existing = prev.responses[qId] || {
        questionId: qId,
        status: 'visited_unanswered' as QuestionAttemptStatus,
        timeSpentSeconds: 0,
        visitedCount: 1,
      };
      const changes = updater(existing);
      const updated = {
        ...prev,
        responses: {
          ...prev.responses,
          [qId]: {
            ...existing,
            ...changes,
          },
        },
      };
      StorageService.setActiveAttempt(updated);
      setTimeout(() => setSaveStatus('saved'), 150);
      return updated;
    });
  };

  // Answer selection handlers
  const handleSelectMcq = (optId: string) => {
    updateCurrentResponse((prev) => ({
      selectedOption: optId,
      status: prev.status === 'marked_for_review' || prev.status === 'answered_marked'
        ? 'answered_marked'
        : 'answered',
    }));
  };

  const handleToggleMultiple = (optId: string) => {
    updateCurrentResponse((prev) => {
      const currentList = prev.selectedOptions || [];
      const exists = currentList.includes(optId);
      const nextList = exists
        ? currentList.filter((id) => id !== optId)
        : [...currentList, optId];

      const hasAnswers = nextList.length > 0;
      let newStatus: QuestionAttemptStatus;
      if (prev.status === 'marked_for_review' || prev.status === 'answered_marked') {
        newStatus = hasAnswers ? 'answered_marked' : 'marked_for_review';
      } else {
        newStatus = hasAnswers ? 'answered' : 'visited_unanswered';
      }

      return {
        selectedOptions: nextList,
        status: newStatus,
      };
    });
  };

  const handleNumericalInput = (val: string) => {
    updateCurrentResponse((prev) => {
      const hasVal = val.trim() !== '';
      let newStatus: QuestionAttemptStatus;
      if (prev.status === 'marked_for_review' || prev.status === 'answered_marked') {
        newStatus = hasVal ? 'answered_marked' : 'marked_for_review';
      } else {
        newStatus = hasVal ? 'answered' : 'visited_unanswered';
      }

      return {
        numericalAnswer: val,
        status: newStatus,
      };
    });
  };

  const handleMatchingChange = (colAId: string, colBId: string) => {
    updateCurrentResponse((prev) => {
      const currentMap = { ...(prev.matchingSelections || {}) };
      if (!colBId) {
        delete currentMap[colAId];
      } else {
        currentMap[colAId] = colBId;
      }

      const hasSelections = Object.keys(currentMap).length > 0;
      let newStatus: QuestionAttemptStatus;
      if (prev.status === 'marked_for_review' || prev.status === 'answered_marked') {
        newStatus = hasSelections ? 'answered_marked' : 'marked_for_review';
      } else {
        newStatus = hasSelections ? 'answered' : 'visited_unanswered';
      }

      return {
        matchingSelections: currentMap,
        status: newStatus,
      };
    });
  };

  const handleClearResponse = () => {
    updateCurrentResponse((prev) => ({
      selectedOption: undefined,
      selectedOptions: [],
      numericalAnswer: undefined,
      matchingSelections: {},
      status: prev.status === 'marked_for_review' || prev.status === 'answered_marked'
        ? 'marked_for_review'
        : 'visited_unanswered',
    }));
  };

  const handleToggleMarkForReview = () => {
    updateCurrentResponse((prev) => {
      const hasAnswer =
        prev.selectedOption !== undefined ||
        (prev.selectedOptions && prev.selectedOptions.length > 0) ||
        (prev.numericalAnswer && prev.numericalAnswer.trim() !== '') ||
        (prev.matchingSelections && Object.keys(prev.matchingSelections).length > 0);

      let nextStatus: QuestionAttemptStatus;
      if (prev.status === 'marked_for_review') {
        nextStatus = hasAnswer ? 'answered' : 'visited_unanswered';
      } else if (prev.status === 'answered_marked') {
        nextStatus = 'answered';
      } else {
        nextStatus = hasAnswer ? 'answered_marked' : 'marked_for_review';
      }

      return { status: nextStatus };
    });
  };

  const handleNavigateQuestion = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= flattenedQuestions.length) return;
    commitTimeSpent();
    setCurrentIndex(newIndex);
  };

  const handleSaveAndNext = () => {
    handleNavigateQuestion(currentIndex + 1);
  };

  const handlePrev = () => {
    handleNavigateQuestion(currentIndex - 1);
  };

  // Keyboard shortcut listeners (1-4, N, P, R, C)
  useEffect(() => {
    if (!attempt.settingsSnapshot.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in numerical input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleSaveAndNext();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleToggleMarkForReview();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClearResponse();
      } else if (['1', '2', '3', '4'].includes(e.key) && currentItem?.question.type === 'mcq') {
        e.preventDefault();
        const optLetter = String.fromCharCode(64 + parseInt(e.key));
        handleSelectMcq(optLetter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attempt.settingsSnapshot.enableKeyboardShortcuts, currentItem, handleSaveAndNext, handlePrev]);

  // Statistics counters for the palette header
  const paletteStats = useMemo(() => {
    let answered = 0;
    let notVisited = 0;
    let visitedUnanswered = 0;
    let markedForReview = 0;
    let answeredMarked = 0;

    flattenedQuestions.forEach((item) => {
      const resp = attempt.responses[item.question.id];
      const st = resp?.status || 'not_visited';

      if (st === 'answered') answered++;
      else if (st === 'answered_marked') answeredMarked++;
      else if (st === 'marked_for_review') markedForReview++;
      else if (st === 'visited_unanswered') visitedUnanswered++;
      else notVisited++;
    });

    return {
      answered,
      answeredMarked,
      markedForReview,
      visitedUnanswered,
      notVisited,
      totalAttempted: answered + answeredMarked,
    };
  }, [flattenedQuestions, attempt.responses]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top CBT Navigation & Status Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white text-sm sm:text-base tracking-tight truncate max-w-xs sm:max-w-md">
              {attempt.testTitle}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span>Subject:</span>
            <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">
              {currentItem?.question.subject || 'All'}
            </span>
          </div>
        </div>

        {/* Center / Right: Timer & Autosave Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400 animate-spin'
              }`}
            />
            <span className="hidden sm:inline font-mono text-[11px]">
              {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
            </span>
          </div>

          {/* Fullscreen toggle button */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Fullscreen</span>
          </button>

          {/* Prominent Deadline Timer */}
          <div
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base ${
              remainingSeconds < 300
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : remainingSeconds < 900
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                : 'bg-slate-950 border-slate-700 text-cyan-400'
            }`}
          >
            <Clock className="w-4 h-4 text-current" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            onClick={() => {
              commitTimeSpent();
              setShowSubmitModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow-md shadow-emerald-600/30 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Warning Banners (Tab switch, Fullscreen, Time) */}
      {tabSwitchAlert && (
        <div className="bg-amber-950/90 border-b border-amber-600 text-amber-200 px-4 py-2 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Exam Discipline Alert:</strong> You navigated away from the exam tab (Total exits: {attempt.tabSwitchCount}). Maintain strict focus to simulate real exam pressure.
            </span>
          </div>
          <button onClick={() => setTabSwitchAlert(false)} className="text-amber-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {timeWarning && (
        <div className="bg-rose-950/90 border-b border-rose-600 text-rose-200 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{timeWarning}</span>
          </div>
          <button onClick={() => setTimeWarning(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Panel CBT Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left & Center Panel: Question Workspace */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {/* Question sub-header */}
          <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white text-base font-mono bg-blue-600 px-2.5 py-0.5 rounded">
                Q.{currentItem?.displayNumber || 1}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {currentItem?.question.subject}
              </span>
              {currentItem?.question.subtopic && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {currentItem.question.subtopic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="uppercase text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                Type: {currentItem?.question.type}
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                +{currentItem?.question.marks ?? 4}
              </span>
              <span className="font-mono text-rose-400 font-bold">
                -{attempt.settingsSnapshot.allowNegativeMarking ? (currentItem?.question.negativeMarks ?? 1) : 0}
              </span>
              {currentItem?.question.timeEstimateSeconds && (
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  ⏱ {currentItem.question.timeEstimateSeconds}s target
                </span>
              )}
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 p-6 sm:p-8 max-w-4xl">
            {currentItem ? (
              <div className="space-y-6">
                {/* Paragraph passage if present */}
                {currentItem.parentId && currentItem.parentParagraphText && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-400 pb-2 mb-2 border-b border-slate-800">
                      <span>Shared Comprehension Passage</span>
                      <span>Subquestion {currentItem.subIndex} of {currentItem.subTotal}</span>
                    </div>
                    <LatexRenderer
                      content={currentItem.parentParagraphText}
                      className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2"
                    />
                  </div>
                )}

                {/* Question Statement */}
                <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                  <LatexRenderer content={currentItem.question.question} />
                </div>

                {/* Answer Input Area by Question Type */}
                <div className="pt-4 border-t border-slate-800/80">
                  {/* 1. MCQ Single Choice */}
                  {currentItem.question.type === 'mcq' && (
                    <div className="space-y-3">
                      <span className="text-xs text-slate-400 block mb-2 font-medium">
                        Choose one correct option:
                      </span>
                      {currentItem.question.options.map((opt) => {
                        const isSelected = currentResponse.selectedOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectMcq(opt.id)}
                            className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition text-sm ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <div className="flex-1">
                              <LatexRenderer content={opt.text} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Multiple-Correct Choice */}
                  {currentItem.question.type === 'multiple' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Select ONE OR MORE correct options:</span>
                        <span className="text-[11px] text-amber-400">Multiple selection enabled</span>
                      </div>
                      {currentItem.question.options.map((opt) => {
                        const isChecked = (currentResponse.selectedOptions || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleToggleMultiple(opt.id)}
                            className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition text-sm ${
                              isChecked
                                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition ${
                                isChecked
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
                            </span>
                            <div className="flex-1">
                              <LatexRenderer content={opt.text} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Integer / Numerical Question */}
                  {currentItem.question.type === 'integer' && (
                    <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Enter Numerical Value:
                        </label>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Negative values and decimals supported. Answers evaluate within tolerance.
                        </p>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={currentResponse.numericalAnswer || ''}
                          onChange={(e) => handleNumericalInput(e.target.value)}
                          placeholder="e.g. 42 or -3.14"
                          className="w-full bg-slate-950 border-2 border-slate-700 focus:border-blue-500 text-xl font-mono font-bold text-white px-4 py-3 rounded-lg text-center tracking-wider focus:outline-none transition"
                        />
                      </div>

                      {/* Quick On-Screen Keypad for Numerical Inputs */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '-'].map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const curr = currentResponse.numericalAnswer || '';
                              if (key === '-' && curr.includes('-')) return;
                              if (key === '.' && curr.includes('.')) return;
                              handleNumericalInput(curr + key);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold py-2 rounded-lg text-sm border border-slate-700 transition active:scale-95"
                          >
                            {key}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleClearResponse}
                        className="w-full text-xs text-rose-400 hover:text-rose-300 py-1.5 rounded bg-rose-950/20 border border-rose-900/30 transition"
                      >
                        Backspace / Clear Value
                      </button>
                    </div>
                  )}

                  {/* 4. Matching Question */}
                  {currentItem.question.type === 'matching' && (
                    <div className="space-y-4">
                      <span className="text-xs text-slate-400 block mb-1 font-medium">
                        Pair each item from Column A with the correct match in Column B:
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
                        {/* Column A with selector */}
                        <div className="space-y-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
                            Column A &amp; Your Selection
                          </span>
                          {(currentItem.question as MatchingQuestion).columnA.map((itemA) => {
                            const selectedB = currentResponse.matchingSelections?.[itemA.id] || '';
                            return (
                              <div
                                key={itemA.id}
                                className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2"
                              >
                                <div className="text-xs font-semibold text-slate-200">
                                  <strong className="text-blue-400 font-mono mr-1.5">{itemA.id}.</strong>
                                  <LatexRenderer content={itemA.text} inline />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[11px] text-slate-400">Matches:</span>
                                  <select
                                    value={selectedB}
                                    onChange={(e) => handleMatchingChange(itemA.id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="">Select (1, 2, 3, 4)</option>
                                    {(currentItem.question as MatchingQuestion).columnB.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.id}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Column B Reference */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
                            Column B Reference
                          </span>
                          {(currentItem.question as MatchingQuestion).columnB.map((itemB) => (
                            <div
                              key={itemB.id}
                              className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300"
                            >
                              <strong className="text-indigo-400 font-mono mr-2">{itemB.id}.</strong>
                              <LatexRenderer content={itemB.text} inline />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Action / Navigation Toolbar */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
            {/* Left toolbar buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  currentResponse.status === 'marked_for_review' ||
                  currentResponse.status === 'answered_marked'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Mark for Review</span>
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Eraser className="w-4 h-4" />
                <span>Clear Response</span>
              </button>
            </div>

            {/* Right navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  currentIndex === 0
                    ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                disabled={currentIndex === flattenedQuestions.length - 1}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition ${
                  currentIndex === flattenedQuestions.length - 1
                    ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95'
                }`}
              >
                <span>Save &amp; Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: CBT Question Palette & Navigation Panel */}
        <aside className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
          <div className="p-4 overflow-y-auto">
            {/* Subject Tabs Filter */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSubjectTab('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  selectedSubjectTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({flattenedQuestions.length})
              </button>
              {subjects.map((sub) => {
                const count = flattenedQuestions.filter(
                  (q) => (q.question.subject || 'General') === sub
                ).length;
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectTab(sub)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                      selectedSubjectTab === sub
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub} ({count})
                  </button>
                );
              })}
            </div>

            {/* Live Palette Legend Counters */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {paletteStats.answered}
                </span>
                <span className="text-slate-300">Answered</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {paletteStats.visitedUnanswered}
                </span>
                <span className="text-slate-300">Unanswered</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {paletteStats.markedForReview}
                </span>
                <span className="text-slate-300">Marked Review</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center relative">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute -top-0.5 -right-0.5"></span>
                  {paletteStats.answeredMarked}
                </span>
                <span className="text-slate-300">Ans &amp; Marked</span>
              </div>

              <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-slate-800/80">
                <span className="w-3.5 h-3.5 rounded bg-slate-700 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                  {paletteStats.notVisited}
                </span>
                <span className="text-slate-400">Not Visited</span>
              </div>
            </div>

            {/* Question Palette Numbered Tiles */}
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">Question Palette:</span>
              <div className="grid grid-cols-5 gap-2">
                {flattenedQuestions.map((item, idx) => {
                  if (
                    selectedSubjectTab !== 'all' &&
                    (item.question.subject || 'General') !== selectedSubjectTab
                  ) {
                    return null;
                  }

                  const resp = attempt.responses[item.question.id];
                  const st: QuestionAttemptStatus = resp?.status || 'not_visited';
                  const isCurrent = idx === currentIndex;

                  // Tile color classes
                  let bgClass = 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700';
                  let badgeDot = null;

                  if (st === 'answered') {
                    bgClass = 'bg-emerald-600 text-white border-emerald-500 font-bold';
                  } else if (st === 'answered_marked') {
                    bgClass = 'bg-purple-600 text-white border-purple-400 font-bold';
                    badgeDot = (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-0.5 right-0.5" />
                    );
                  } else if (st === 'marked_for_review') {
                    bgClass = 'bg-purple-600 text-white border-purple-500 font-bold';
                  } else if (st === 'visited_unanswered') {
                    bgClass = 'bg-rose-600 text-white border-rose-500 font-bold';
                  }

                  return (
                    <button
                      key={item.question.id}
                      type="button"
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`relative h-10 rounded-lg flex items-center justify-center text-xs font-mono border transition ${bgClass} ${
                        isCurrent
                          ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10'
                          : ''
                      }`}
                      title={`Q.${item.displayNumber} (${item.question.subject})`}
                    >
                      <span>{item.displayNumber}</span>
                      {badgeDot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Keyboard Hint */}
          <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>Shortcuts:</span>
              <span>1-4: Select • N: Next • R: Review</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Test Submission</h3>
                <p className="text-xs text-slate-400">Review your final response summary</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Attempted</span>
                <span className="text-xl font-bold text-emerald-400">
                  {paletteStats.totalAttempted} / {flattenedQuestions.length}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Unanswered</span>
                <span className="text-xl font-bold text-rose-400">
                  {flattenedQuestions.length - paletteStats.totalAttempted}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Marked for Review</span>
                <span className="text-xl font-bold text-purple-400">
                  {paletteStats.markedForReview + paletteStats.answeredMarked}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Time Remaining</span>
                <span className="text-xl font-bold text-cyan-400">
                  {formatTimer(remainingSeconds)}
                </span>
              </div>
            </div>

            {flattenedQuestions.length - paletteStats.totalAttempted > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-lg text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  You still have <strong>{flattenedQuestions.length - paletteStats.totalAttempted}</strong> unanswered questions. Once submitted, answers cannot be edited.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Return to Test
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
              >
                <span>Yes, Submit Now</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
