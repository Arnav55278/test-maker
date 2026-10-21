import React, { useState, useEffect, useCallback } from 'react';
import { useAppRoute, AppRoute } from './utils/router';
import { TestMetadata, TestAttempt } from './types/test';
import { StorageService } from './db/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TestCreator } from './components/TestCreator';
import { TestConfigure } from './components/TestConfigure';
import { TestAttemptComponent } from './components/TestAttempt';
import { TestResult } from './components/TestResult';
import { TestReview } from './components/TestReview';
import { Leaderboard } from './components/Leaderboard';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [currentRoute, navigateTo] = useAppRoute();
  const [tests, setTests] = useState<TestMetadata[]>(() => StorageService.getTests());
  const [attempts, setAttempts] = useState<TestAttempt[]>(() => StorageService.getAttempts());
  const [activeAttempt, setActiveAttempt] = useState<TestAttempt | null>(() =>
    StorageService.getActiveAttempt()
  );

  // Sync state whenever storage updates
  const refreshStorageData = useCallback(() => {
    setTests(StorageService.getTests());
    setAttempts(StorageService.getAttempts());
    setActiveAttempt(StorageService.getActiveAttempt());
  }, []);

  const handleTestCreated = (newTest: TestMetadata) => {
    refreshStorageData();
  };

  const handleStartAttempt = (newAttempt: TestAttempt) => {
    setActiveAttempt(newAttempt);
    refreshStorageData();
  };

  const handleAttemptSubmitted = (completedAttempt: TestAttempt) => {
    setActiveAttempt(null);
    refreshStorageData();
  };

  const handleDeleteTest = (testId: string) => {
    StorageService.deleteTest(testId);
    refreshStorageData();
  };

  // Render view corresponding to currentRoute
  const renderCurrentView = () => {
    switch (currentRoute.path) {
      case 'dashboard':
        return (
          <Dashboard
            tests={tests}
            attempts={attempts}
            activeAttempt={activeAttempt}
            onNavigate={navigateTo}
            onDeleteTest={handleDeleteTest}
          />
        );

      case 'tests/new':
        return (
          <TestCreator
            onNavigate={navigateTo}
            onTestCreated={handleTestCreated}
          />
        );

      case 'tests/configure': {
        const test = tests.find((t) => t.id === currentRoute.testId);
        if (!test) {
          return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white">Test Not Found</h2>
                <p className="text-xs text-slate-400 mt-2">
                  The requested test could not be located in your test library.
                </p>
                <button
                  onClick={() => navigateTo({ path: 'dashboard' })}
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          );
        }
        return (
          <TestConfigure
            test={test}
            onNavigate={navigateTo}
            onStartAttempt={handleStartAttempt}
          />
        );
      }

      case 'tests/attempt': {
        let attemptToUse: TestAttempt | null = null;
        if (currentRoute.attemptId) {
          attemptToUse = attempts.find((a) => a.id === currentRoute.attemptId) || null;
        }
        if (!attemptToUse && activeAttempt && activeAttempt.testId === currentRoute.testId) {
          attemptToUse = activeAttempt;
        }
        if (!attemptToUse) {
          // Check storage directly
          attemptToUse = StorageService.getActiveAttempt();
        }

        if (!attemptToUse) {
          // If no active attempt found, redirect to configure
          return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white">No Active Attempt</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Please configure your exam settings to launch a fresh mock session.
                </p>
                <button
                  onClick={() =>
                    navigateTo({ path: 'tests/configure', testId: currentRoute.testId })
                  }
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Configure &amp; Start Test
                </button>
              </div>
            </div>
          );
        }

        return (
          <TestAttemptComponent
            attempt={attemptToUse}
            onNavigate={navigateTo}
            onAttemptSubmitted={handleAttemptSubmitted}
          />
        );
      }

      case 'tests/result': {
        const test = tests.find((t) => t.id === currentRoute.testId);
        let attempt = attempts.find((a) => a.id === currentRoute.attemptId);
        if (!attempt && currentRoute.attemptId === 'latest') {
          const testAttempts = attempts.filter((a) => a.testId === currentRoute.testId);
          attempt = testAttempts[testAttempts.length - 1];
        }

        if (!test || !attempt) {
          return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white">Result Report Not Found</h2>
                <p className="text-xs text-slate-400 mt-2">
                  The test or attempt record could not be found.
                </p>
                <button
                  onClick={() => navigateTo({ path: 'dashboard' })}
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          );
        }

        return <TestResult test={test} attempt={attempt} onNavigate={navigateTo} />;
      }

      case 'tests/review': {
        const test = tests.find((t) => t.id === currentRoute.testId);
        let attempt = attempts.find((a) => a.id === currentRoute.attemptId);
        if (!attempt && currentRoute.attemptId === 'latest') {
          const testAttempts = attempts.filter((a) => a.testId === currentRoute.testId);
          attempt = testAttempts[testAttempts.length - 1];
        }

        if (!test || !attempt) {
          return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white">Review Record Not Found</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Could not find test or attempt for review.
                </p>
                <button
                  onClick={() => navigateTo({ path: 'dashboard' })}
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          );
        }

        return <TestReview test={test} attempt={attempt} onNavigate={navigateTo} />;
      }

      case 'leaderboard':
        return <Leaderboard tests={tests} attempts={attempts} onNavigate={navigateTo} />;

      case 'analytics':
        return <Analytics tests={tests} attempts={attempts} onNavigate={navigateTo} />;

      case 'settings':
        return <Settings onNavigate={navigateTo} onDataReset={refreshStorageData} />;

      default:
        return (
          <Dashboard
            tests={tests}
            attempts={attempts}
            activeAttempt={activeAttempt}
            onNavigate={navigateTo}
            onDeleteTest={handleDeleteTest}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        activeAttemptTestTitle={activeAttempt?.testTitle}
        onReturnToActiveAttempt={() => {
          if (activeAttempt) {
            navigateTo({
              path: 'tests/attempt',
              testId: activeAttempt.testId,
              attemptId: activeAttempt.id,
            });
          }
        }}
      />
      <main className="flex-1 flex flex-col">{renderCurrentView()}</main>
    </div>
  );
}

export default App;
