import React from 'react';
import { AppRoute } from '../utils/router';
import {
  Activity,
  BarChart3,
  Flame,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  activeAttemptTestTitle?: string;
  onReturnToActiveAttempt?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  activeAttemptTestTitle,
  onReturnToActiveAttempt,
}) => {
  // If attempting a test, we don't display the standard dashboard header to keep CBT focus
  if (currentRoute.path === 'tests/attempt') {
    return null;
  }

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const isCurrent = (path: string) => {
    return currentRoute.path === path || currentRoute.path.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate({ path: 'dashboard' })}
              className="flex items-center gap-3 text-left group transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-lg">JEE Pressure Lab</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    CBT 2026
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono hidden sm:block">Exam Temperament &amp; Speed Engine</p>
              </div>
            </button>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <button
                onClick={() => onNavigate({ path: 'dashboard' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isCurrent('dashboard')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate({ path: 'analytics' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isCurrent('analytics')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>

              <button
                onClick={() => onNavigate({ path: 'settings' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isCurrent('settings')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Active Attempt Warning / Resume Pill */}
            {activeAttemptTestTitle && onReturnToActiveAttempt && (
              <button
                onClick={onReturnToActiveAttempt}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition animate-pulse"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Test in Progress: <strong className="font-semibold">{activeAttemptTestTitle}</strong></span>
              </button>
            )}

            {/* Date pill */}
            <div className="hidden sm:flex items-center text-xs text-slate-400 font-mono bg-slate-800/60 px-3 py-1.5 rounded-md border border-slate-700/60">
              {todayStr}
            </div>

            {/* Create New Test Button */}
            <button
              onClick={() => onNavigate({ path: 'tests/new' })}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Test</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
