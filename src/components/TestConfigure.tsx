import React, { useState, useMemo } from 'react';
import { TestMetadata, ExamSettings, TestAttempt } from '../types/test';
import { AppRoute } from '../utils/router';
import { calculateTestDuration } from '../utils/duration';
import { StorageService, DEFAULT_EXAM_SETTINGS } from '../db/storage';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  HelpCircle,
  Info,
  Maximize2,
  Monitor,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TestConfigureProps {
  test: TestMetadata;
  onNavigate: (route: AppRoute) => void;
  onStartAttempt: (attempt: TestAttempt) => void;
}

export const TestConfigure: React.FC<TestConfigureProps> = ({
  test,
  onNavigate,
  onStartAttempt,
}) => {
  const durationInfo = useMemo(() => {
    return calculateTestDuration(test.questions);
  }, [test]);

  const [settings, setSettings] = useState<ExamSettings>(() => {
    const saved = StorageService.getSettings();
    return {
      ...saved,
      durationMinutes: durationInfo.recommendedDurationMinutes,
    };
  });

  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Subject distribution summary
  const subjectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of test.questions) {
      if (q.type === 'paragraph') {
        q.parts.forEach((sub) => {
          const s = sub.subject || q.subject || 'General';
          counts[s] = (counts[s] || 0) + 1;
        });
      } else {
        const s = q.subject || 'General';
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [test]);

  const handleLaunchTest = () => {
    const now = new Date();
    const durationMs = settings.durationMinutes * 60 * 1000;
    const deadline = new Date(now.getTime() + durationMs);

    const newAttempt: TestAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      testId: test.id,
      testTitle: test.title,
      startTime: now.toISOString(),
      deadlineTime: deadline.toISOString(),
      status: 'in_progress',
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      settingsSnapshot: settings,
      questionsSnapshot: test.questions,
      responses: {},
    };

    StorageService.setActiveAttempt(newAttempt);
    StorageService.saveAttempt(newAttempt);
    onStartAttempt(newAttempt);
    onNavigate({
      path: 'tests/attempt',
      testId: test.id,
      attemptId: newAttempt.id,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <Monitor className="w-4 h-4" />
            <span>EXAMINATION SETUP &amp; PACING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Configure Mock Test Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {test.title} • {test.totalSubQuestions || test.questions.length} problems • Max {test.totalMarks} marks
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Test Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Paper Structure Overview</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Subquestions</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {test.totalSubQuestions || test.questions.length}
              </span>
              <span className="text-[10px] text-slate-500">Across {test.questions.length} question blocks</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Estimated Solving Time</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                {durationInfo.totalEstimatedMinutes} mins
              </span>
              <span className="text-[10px] text-slate-500">Sum of question estimates</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Recommended Duration</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {durationInfo.recommendedDurationMinutes} mins
              </span>
              <span className="text-[10px] text-slate-500">Includes 15m pressure pacing</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Maximum Marks</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {test.totalMarks}
              </span>
              <span className="text-[10px] text-slate-500">Based on question weights</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Subjects in this paper:</span>
            {Object.entries(subjectDistribution).map(([sub, count]) => (
              <span
                key={sub}
                className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium"
              >
                {sub}: <strong className="text-blue-400">{count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Duration Recommendation Algorithm Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Duration Pacing Calculation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {durationInfo.explanation}
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Transparent Algorithm
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Custom Exam Duration (Minutes):
                </label>
                <p className="text-slate-500 text-[11px]">
                  Override algorithm recommendation if you desire a different time target.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="3"
                  max="360"
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      durationMinutes: Math.max(1, parseInt(e.target.value) || 15),
                    })
                  }
                  className="bg-slate-900 border border-slate-700 text-base font-mono font-bold text-white px-3 py-1.5 rounded-lg w-24 text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      durationMinutes: durationInfo.recommendedDurationMinutes,
                    })
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  Reset to recommended
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Conditions & Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Marking Scheme &amp; CBT Rules</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fullscreen Mode */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.enableFullscreen}
                onChange={(e) => setSettings({ ...settings, enableFullscreen: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Request Fullscreen Mode</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Prompts browser fullscreen when test starts for distraction-free focus.
                </div>
              </div>
            </label>

            {/* Tab switch warning */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.warnOnTabSwitch}
                onChange={(e) => setSettings({ ...settings, warnOnTabSwitch: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Track Tab Switch / Focus Loss</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Records tab switching events and shows an alert banner to train exam discipline.
                </div>
              </div>
            </label>

            {/* Negative Marking */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.allowNegativeMarking}
                onChange={(e) => setSettings({ ...settings, allowNegativeMarking: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Enforce Negative Marking (-1, -2)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Deducts marks for incorrect responses as specified in the question definitions.
                </div>
              </div>
            </label>

            {/* Partial Marking for Multi-Correct */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.allowPartialMarking}
                onChange={(e) => setSettings({ ...settings, allowPartialMarking: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JEE Advanced Partial Marking</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Awards partial credit if only correct options are chosen without any wrong ones.
                </div>
              </div>
            </label>

            {/* Keyboard Shortcuts */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.enableKeyboardShortcuts}
                onChange={(e) => setSettings({ ...settings, enableKeyboardShortcuts: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>CBT Keyboard Shortcuts</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Options 1–4, N (Next), P (Prev), R (Mark for Review), C (Clear response).
                </div>
              </div>
            </label>

            {/* Auto-submission */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.autoSubmitOnZeroTime}
                onChange={(e) => setSettings({ ...settings, autoSubmitOnZeroTime: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Auto-Submit at 00:00:00</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Automatically seals answers when the countdown timer expires.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Start Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl shadow-lg">
          <div>
            <h3 className="font-bold text-white text-base">Ready to Enter Exam Environment?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Timer begins immediately upon entry. All answers autosave locally.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ path: 'dashboard' })}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setShowInstructionsModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Begin Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Test Confirmation & Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pre-Examination Instructions</h3>
                <p className="text-xs text-slate-400 font-mono">JEE Computer Based Test Pacing</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto pr-1">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">1. Total Duration: {settings.durationMinutes} Minutes</strong>
                The server timer uses absolute deadline timestamps; refreshing the browser or switching tabs will not give extra time.
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">2. Question Palette States:</strong>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span> Not Visited
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span> Visited / Unanswered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Answered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span> Marked for Review
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">3. Autosave &amp; Persistence:</strong>
                Every option selection, numerical input, and matching pair is committed immediately. In case of browser crash, you can resume seamlessly from the dashboard.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInstructionsModal(false);
                  handleLaunchTest();
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-lg shadow-blue-600/30 transition transform active:scale-95"
              >
                <span>I am Ready to Begin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
