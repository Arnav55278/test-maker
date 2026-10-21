import React, { useState, useMemo } from 'react';
import { PeerStudent, PeerTestResult } from '../types/cohort';
import { PEER_COHORT, simulatePeerAttempt } from '../utils/cohortSimulation';
import { TestMetadata, TestAttempt } from '../types/test';
import { flattenQuestions } from '../utils/evaluation';
import {
  Award,
  BarChart2,
  Check,
  CheckCircle,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface PersonaSimulatorProps {
  test: TestMetadata;
  attempt?: TestAttempt;
}

export const PersonaSimulator: React.FC<PersonaSimulatorProps> = ({ test, attempt }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(PEER_COHORT[0].id);

  const selectedStudent = useMemo(() => {
    return PEER_COHORT.find((p) => p.id === selectedStudentId) || PEER_COHORT[0];
  }, [selectedStudentId]);

  const simulatedResult: PeerTestResult = useMemo(() => {
    const settings = attempt?.settingsSnapshot || {
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
    };
    return simulatePeerAttempt(selectedStudent, test.questions, test.id, settings);
  }, [selectedStudent, test, attempt]);

  const flattenedQuestions = useMemo(() => {
    return flattenQuestions(test.questions);
  }, [test.questions]);

  const userEval = attempt?.evaluation;

  // Comparison metrics between user and peer
  const comparison = useMemo(() => {
    if (!userEval) return null;
    const markDelta = userEval.marksObtained - simulatedResult.marksObtained;
    const accDelta = Math.round((userEval.accuracy - simulatedResult.accuracy) * 10) / 10;
    const timeDelta = userEval.totalTimeSpentSeconds - simulatedResult.totalTimeSpentSeconds;

    return {
      markDelta,
      accDelta,
      timeDelta,
      userAhead: markDelta >= 0,
    };
  }, [userEval, simulatedResult]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Users className="w-4 h-4" />
            <span>COHORT PERSONA BENCHMARK SIMULATOR</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            &ldquo;If This Person Gave The Marks, How Much Would They Score?&rdquo;
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate how any of your 15 peer JEE aspirants would perform on this exact question set.
          </p>
        </div>

        {/* Peer Student Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Select Aspirant:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 max-w-xs truncate"
          >
            {PEER_COHORT.map((peer) => (
              <option key={peer.id} value={peer.id}>
                {peer.name} ({peer.targetAir} • IQ {peer.estimatedIq})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Peer Profile Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-lg ${selectedStudent.avatarBg} text-white font-bold text-sm flex items-center justify-center font-mono shadow-md`}
          >
            {selectedStudent.avatarText}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedStudent.name}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {selectedStudent.tier}
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                IQ ~{selectedStudent.estimatedIq}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {selectedStudent.tagline} • <strong className="text-slate-300">{selectedStudent.targetAir}</strong>
            </p>
          </div>
        </div>

        {/* Peer Profile Proficiency Pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Phys</span>
            <span className="text-blue-400 font-bold">{Math.round(selectedStudent.subjectProficiency.Physics * 100)}%</span>
          </div>
          <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Chem</span>
            <span className="text-emerald-400 font-bold">{Math.round(selectedStudent.subjectProficiency.Chemistry * 100)}%</span>
          </div>
          <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Math</span>
            <span className="text-purple-400 font-bold">{Math.round(selectedStudent.subjectProficiency.Mathematics * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Simulated Performance Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Projected Score</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {simulatedResult.marksObtained} <span className="text-xs text-slate-500 font-normal">/ {simulatedResult.maxMarks}</span>
          </div>
          <span className="text-[10px] text-slate-500">{simulatedResult.percentageScore}% paper yield</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Projected Accuracy</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {simulatedResult.accuracy}%
          </div>
          <span className="text-[10px] text-slate-500">
            {simulatedResult.correctQuestions} / {simulatedResult.attemptedQuestions} correct
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Solving Pace</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {Math.round(simulatedResult.totalTimeSpentSeconds / 60)} mins
          </div>
          <span className="text-[10px] text-slate-500">{simulatedResult.totalTimeSpentSeconds}s total duration</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Attempt Coverage</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {simulatedResult.attemptedQuestions} <span className="text-xs text-slate-500 font-normal">/ {flattenedQuestions.length}</span>
          </div>
          <span className="text-[10px] text-slate-500">Problems attempted</span>
        </div>
      </div>

      {/* Head-to-Head Comparison: User vs. Peer */}
      {userEval && comparison && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Head-to-Head Differential: You vs. {selectedStudent.name}</span>
            </span>

            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                comparison.userAhead
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {comparison.userAhead ? `+${comparison.markDelta} Ahead` : `${comparison.markDelta} Behind`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Net Marks:</span>
              <span>
                <strong className="text-cyan-400">{userEval.marksObtained}</strong> (You) vs{' '}
                <strong className="text-white">{simulatedResult.marksObtained}</strong>
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Accuracy:</span>
              <span>
                <strong className="text-cyan-400">{userEval.accuracy}%</strong> vs{' '}
                <strong className="text-white">{simulatedResult.accuracy}%</strong>
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Duration:</span>
              <span>
                <strong className="text-cyan-400">{Math.round(userEval.totalTimeSpentSeconds / 60)}m</strong> vs{' '}
                <strong className="text-white">{Math.round(simulatedResult.totalTimeSpentSeconds / 60)}m</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subject-Wise Comparison Table */}
      <div>
        <span className="text-xs font-bold text-slate-400 block mb-2">Subject Breakdown Simulation:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(simulatedResult.subjectBreakdown).map(([subject, data]) => {
            const userSub = userEval?.subjectBreakdown[subject];
            return (
              <div key={subject} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-white mb-1">
                  <span>{subject}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {data.marks} / {data.maxMarks}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Peer Accuracy: {data.accuracy}%</span>
                  {userSub && (
                    <span className="text-cyan-400">Your Acc: {Math.round(userSub.accuracy)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
