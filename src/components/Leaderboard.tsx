import React, { useState, useMemo } from 'react';
import { TestMetadata, TestAttempt } from '../types/test';
import { LeaderboardEntry } from '../types/cohort';
import { AppRoute } from '../utils/router';
import {
  generateTestLeaderboard,
  generateCumulativeLeaderboard,
  PEER_COHORT,
} from '../utils/cohortSimulation';
import {
  Award,
  BarChart2,
  CheckCircle,
  Clock,
  Compass,
  Crown,
  Filter,
  Flame,
  HelpCircle,
  Medal,
  Search,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  Zap,
} from 'lucide-react';

interface LeaderboardProps {
  tests: TestMetadata[];
  attempts: TestAttempt[];
  onNavigate: (route: AppRoute) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ tests, attempts, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'cumulative' | 'test'>('cumulative');
  const [selectedTestId, setSelectedTestId] = useState<string>(() => {
    return tests[0]?.id || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const completedAttempts = useMemo(() => {
    return attempts.filter((a) => a.status === 'completed' && a.evaluation);
  }, [attempts]);

  // Generate cumulative leaderboard
  const cumulativeEntries: LeaderboardEntry[] = useMemo(() => {
    return generateCumulativeLeaderboard(tests, attempts);
  }, [tests, attempts]);

  // Generate test-specific leaderboard
  const testSpecificEntries: LeaderboardEntry[] = useMemo(() => {
    const test = tests.find((t) => t.id === selectedTestId) || tests[0];
    if (!test) return cumulativeEntries;

    const testAttempt = completedAttempts.find((a) => a.testId === test.id);
    if (!testAttempt) {
      // If user hasn't attempted this test, mock a baseline attempt with 0 marks
      const dummyAttempt: TestAttempt = {
        id: 'dummy',
        testId: test.id,
        testTitle: test.title,
        startTime: new Date().toISOString(),
        deadlineTime: new Date().toISOString(),
        status: 'completed',
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        settingsSnapshot: {
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
        },
        questionsSnapshot: test.questions,
        responses: {},
        evaluation: {
          totalQuestions: test.questions.length,
          attemptedQuestions: 0,
          correctQuestions: 0,
          incorrectQuestions: 0,
          unansweredQuestions: test.questions.length,
          partialQuestions: 0,
          maxMarks: test.totalMarks || 36,
          marksObtained: 0,
          percentageScore: 0,
          accuracy: 0,
          attemptRate: 0,
          totalTimeSpentSeconds: 0,
          averageTimePerQuestion: 0,
          averageTimePerAttempted: 0,
          averageTimePerCorrect: 0,
          subjectBreakdown: {},
          topicBreakdown: {},
          questionEvaluations: [],
        },
      };
      return generateTestLeaderboard(test, dummyAttempt);
    }

    return generateTestLeaderboard(test, testAttempt);
  }, [selectedTestId, tests, completedAttempts, cumulativeEntries]);

  const activeEntries = activeTab === 'cumulative' ? cumulativeEntries : testSpecificEntries;

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return activeEntries.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.targetAir.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || entry.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [activeEntries, searchQuery, tierFilter]);

  // User's standing
  const userEntry = useMemo(() => {
    return activeEntries.find((e) => e.isUser);
  }, [activeEntries]);

  // Podium top 3
  const rank1 = activeEntries[0];
  const rank2 = activeEntries[1];
  const rank3 = activeEntries[2];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span>16-ASPIRANT COMPETITIVE COHORT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                JEE Aspirant Leaderboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ranked competition among you and 15 calibrated peer aspirants ranging from Kota Super-Toppers (AIR &lt; 50) to Disciplined Averages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate({ path: 'dashboard' })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate({ path: 'analytics' })}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 transition active:scale-95"
              >
                View Analytics
              </button>
            </div>
          </div>

          {/* User's Prominent Standing Summary Banner */}
          {userEntry && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-mono font-bold text-base shadow-md">
                  #{userEntry.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">Your Standing: Rank {userEntry.rank} of 16</span>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      Top {Math.round((userEntry.rank / 16) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Score: <strong className="text-white">{userEntry.marksObtained}</strong> / {userEntry.maxMarks} marks ({userEntry.percentageScore}%) • Accuracy: {userEntry.accuracy}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {userEntry.rank === 1 ? (
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    <span>Cohort Leader!</span>
                  </div>
                ) : (
                  <div className="text-slate-300">
                    Gap to Rank 1: <strong className="text-rose-400">{userEntry.marksObtained - rank1.marksObtained} marks</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Podium Highlight (Rank 1, 2, 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 (Silver) */}
          {rank2 && (
            <div className="order-2 md:order-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${rank2.avatarBg} text-white font-bold text-xs flex items-center justify-center font-mono`}>
                    {rank2.avatarText}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">#2 Silver</span>
                    <h3 className="text-sm font-bold text-white">{rank2.name}</h3>
                    <span className="text-[10px] text-slate-500">{rank2.targetAir}</span>
                  </div>
                </div>
                <Medal className="w-6 h-6 text-slate-400" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Score:</span>
                <span className="text-base font-bold text-white">{rank2.marksObtained} / {rank2.maxMarks}</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Center & Elevated) */}
          {rank1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-xl p-6 flex flex-col justify-between shadow-lg relative -mt-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl ${rank1.avatarBg} text-white font-bold text-sm flex items-center justify-center font-mono shadow-md`}>
                    {rank1.avatarText}
                  </div>
                  <div>
                    <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> Rank 1 Topper
                    </span>
                    <h3 className="text-base font-extrabold text-white">{rank1.name}</h3>
                    <span className="text-[11px] text-amber-300 font-mono">{rank1.targetAir}</span>
                  </div>
                </div>
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Top Score:</span>
                <span className="text-xl font-bold text-amber-400">{rank1.marksObtained} / {rank1.maxMarks}</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {rank3 && (
            <div className="order-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${rank3.avatarBg} text-white font-bold text-xs flex items-center justify-center font-mono`}>
                    {rank3.avatarText}
                  </div>
                  <div>
                    <span className="text-xs text-amber-600 block font-mono">#3 Bronze</span>
                    <h3 className="text-sm font-bold text-white">{rank3.name}</h3>
                    <span className="text-[10px] text-slate-500">{rank3.targetAir}</span>
                  </div>
                </div>
                <Medal className="w-6 h-6 text-amber-600" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Score:</span>
                <span className="text-base font-bold text-white">{rank3.marksObtained} / {rank3.maxMarks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Controls & Filters Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cumulative')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'cumulative'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Overall Cumulative Standings
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'test'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Specific Mock Test Standings
            </button>
          </div>

          {/* Test Selector if in test tab */}
          {activeTab === 'test' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 whitespace-nowrap">Paper:</label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 max-w-xs truncate"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search & Tier Filter */}
          <div className="flex items-center gap-2">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="Super Topper">Super Topper</option>
              <option value="Topper">Topper</option>
              <option value="High Achiever">High Achiever</option>
              <option value="Above Average">Above Average</option>
              <option value="Disciplined Average">Disciplined Average</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search aspirant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* 16-Student Ranked Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Aspirant</th>
                  <th className="py-3.5 px-4">Cohort Tier</th>
                  <th className="py-3.5 px-4 text-right">Marks</th>
                  <th className="py-3.5 px-4 text-right">Score %</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                  <th className="py-3.5 px-4 text-right">User Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredEntries.map((entry) => {
                  const isYou = entry.isUser;
                  return (
                    <tr
                      key={entry.studentId}
                      className={`transition ${
                        isYou
                          ? 'bg-blue-600/10 font-bold border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-black font-extrabold'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-black font-bold'
                              : entry.rank === 3
                              ? 'bg-amber-700 text-white font-bold'
                              : isYou
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg ${entry.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                          >
                            {entry.avatarText}
                          </div>
                          <div>
                            <span className={`text-sm ${isYou ? 'text-cyan-400 font-bold' : 'text-white'}`}>
                              {entry.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {entry.targetAir}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {entry.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                        {entry.marksObtained} <span className="text-slate-500 text-xs font-normal">/ {entry.maxMarks}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-cyan-400 font-bold">
                        {entry.percentageScore}%
                      </td>

                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                        {entry.accuracy}%
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isYou ? (
                          <span className="text-cyan-400 font-bold">YOU</span>
                        ) : entry.scoreDeltaToUser > 0 ? (
                          <span className="text-rose-400 font-bold">+{entry.scoreDeltaToUser} pts ahead</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">{entry.scoreDeltaToUser} pts behind</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
