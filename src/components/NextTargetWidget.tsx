import React, { useState, useMemo } from 'react';
import { TargetScale, NextTargetPlan, LeaderboardEntry } from '../types/cohort';
import {
  STANDARD_SCALES,
  SCALE_DESCRIPTIONS,
  computeNextTargetPlan,
  detectClosestScale,
} from '../utils/targetEngine';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  HelpCircle,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface NextTargetWidgetProps {
  currentMarks: number;
  currentMaxMarks: number;
  leaderboard: LeaderboardEntry[];
  initialScale?: TargetScale;
}

export const NextTargetWidget: React.FC<NextTargetWidgetProps> = ({
  currentMarks,
  currentMaxMarks,
  leaderboard,
  initialScale,
}) => {
  const detectedDefault = useMemo(() => {
    return initialScale || detectClosestScale(currentMaxMarks);
  }, [initialScale, currentMaxMarks]);

  const [activeScale, setActiveScale] = useState<TargetScale>(detectedDefault);

  const plan: NextTargetPlan = useMemo(() => {
    return computeNextTargetPlan(currentMarks, currentMaxMarks, leaderboard, activeScale);
  }, [currentMarks, currentMaxMarks, leaderboard, activeScale]);

  const progressPercentage = Math.min(
    100,
    Math.round((plan.scaledCurrentScore / (plan.targetScore || 1)) * 100)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header & Scale Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Crosshair className="w-4 h-4" />
            <span>ADAPTIVE JEE SCORE TARGET ENGINE</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Next Target Score Milestone</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated score goal and peer-overtake strategy across standard competitive scales.
          </p>
        </div>

        {/* 5 Standard Scales Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          {STANDARD_SCALES.map((scale) => (
            <button
              key={scale}
              onClick={() => setActiveScale(scale)}
              className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition ${
                activeScale === scale
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              /{scale}
            </button>
          ))}
        </div>
      </div>

      {/* Scale Description pill */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <span className="font-semibold text-slate-300">
          Format: {SCALE_DESCRIPTIONS[activeScale].title}
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {SCALE_DESCRIPTIONS[activeScale].subtitle}
        </span>
      </div>

      {/* Score Goal Hero Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-blue-400 block mb-1">
            Recommended Immediate Target:
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {plan.targetScore}
            </span>
            <span className="text-lg font-mono text-slate-400">/ {plan.standardScale} Marks</span>
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              +{plan.pointsToGain} pts needed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Current scaled standing: <strong className="text-slate-200">{plan.scaledCurrentScore}</strong> / {plan.standardScale}
          </p>
        </div>

        {/* Target Rank & Next Peer to Overtake */}
        {plan.nextPeerToOvertake && (
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 max-w-sm">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
              <Flame className="w-4 h-4" />
              <span>Next Competitive Milestone</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Score <strong className="text-emerald-400">+{plan.nextPeerToOvertake.marksNeeded} marks</strong> to surpass{' '}
              <strong className="text-white">{plan.nextPeerToOvertake.name}</strong> and advance to{' '}
              <strong className="text-cyan-400">Rank {plan.nextPeerToOvertake.rank}</strong> in your 16-student cohort.
            </p>
          </div>
        )}
      </div>

      {/* Target Progress Bar */}
      <div>
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
          <span>Current Pace Toward Target:</span>
          <span className="font-bold text-white">{progressPercentage}% Achieved</span>
        </div>
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Actionable Tactical Blueprint to Reach Target */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <span className="text-xs font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Tactical Plan to Gain +{plan.pointsToGain} Marks:</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">1. Stop Negative Leakage</span>
            <span className="text-sm font-bold text-rose-400">
              Eliminate {plan.actionableTactics.reduceNegativesCount} Traps
            </span>
            <p className="text-[10px] text-slate-500">
              Avoid blind guesswork on multi-correct options to save penalty marks.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">2. Convert Safe Questions</span>
            <span className="text-sm font-bold text-emerald-400">
              Solve +{plan.actionableTactics.convertUnansweredCount} Questions
            </span>
            <p className="text-[10px] text-slate-500">
              Focus on numerical &amp; formula questions where accuracy is easiest to secure.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">3. Tactical Subject Target</span>
            <span className="text-sm font-bold text-cyan-400 truncate block">
              {plan.actionableTactics.focusSubject}
            </span>
            <p className="text-[10px] text-slate-500">
              Prioritize this subject in your next practice session.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic pt-1">
          {plan.actionableTactics.strategyDescription}
        </p>
      </div>
    </div>
  );
};
