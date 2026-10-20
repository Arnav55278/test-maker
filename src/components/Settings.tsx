import React, { useState, useRef } from 'react';
import { ExamSettings } from '../types/test';
import { StorageService, DEFAULT_EXAM_SETTINGS } from '../db/storage';
import { AppRoute } from '../utils/router';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Key,
  Maximize2,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Upload,
  Volume2,
  Zap,
} from 'lucide-react';

interface SettingsProps {
  onNavigate: (route: AppRoute) => void;
  onDataReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate, onDataReset }) => {
  const [settings, setSettings] = useState<ExamSettings>(() => StorageService.getSettings());
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    StorageService.saveSettings(settings);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jee_pressure_lab_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = StorageService.importAllData(content);
        setImportStatus(result.message);
        if (result.success) {
          onDataReset();
          setSettings(StorageService.getSettings());
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    StorageService.resetAllData();
    onDataReset();
    setSettings(DEFAULT_EXAM_SETTINGS);
    setShowResetConfirm(false);
    alert('All custom mock tests and attempt records reset to initial state.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>PLATFORM PREFERENCES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Examination Settings &amp; Local Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure default CBT conditions, timer alerts, and manage persistent storage.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Default Exam Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Default CBT Exam Rules</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.warnOnTabSwitch}
                onChange={(e) => setSettings({ ...settings, warnOnTabSwitch: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Track Tab Switches &amp; Browser Inactivity
                </span>
                <span className="text-[11px] text-slate-400">
                  Flags interruptions and counts tab changes in the final attempt report.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFullscreen}
                onChange={(e) => setSettings({ ...settings, enableFullscreen: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Fullscreen Mode by Default
                </span>
                <span className="text-[11px] text-slate-400">
                  Requests fullscreen on starting any mock test.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNegativeMarking}
                onChange={(e) => setSettings({ ...settings, allowNegativeMarking: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Enforce Negative Marking (-1 for Single MCQ, -2 for Multi-Correct)
                </span>
                <span className="text-[11px] text-slate-400">
                  Simulates strict negative marking pressure of JEE Advanced.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableKeyboardShortcuts}
                onChange={(e) => setSettings({ ...settings, enableKeyboardShortcuts: e.target.checked })}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Enable Keyboard Navigation Shortcuts (1–4, N, P, R, C)
                </span>
                <span className="text-[11px] text-slate-400">
                  Allows speed answering using keyboard number and letter keys.
                </span>
              </div>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            {savedFeedback ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            ) : (
              <span className="text-xs text-slate-500">Settings will apply to new test attempts.</span>
            )}

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-md transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* Data Management & Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Data Management &amp; Persistence</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            All your questions, test attempts, and evaluations are persisted in browser storage. You can export a full backup or transfer them across machines.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block">Export Complete Data</span>
              <p className="text-[11px] text-slate-400">
                Downloads a JSON backup containing all mock papers, attempt logs, and diagnostic history.
              </p>
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON Backup</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block">Import Data Backup</span>
              <p className="text-[11px] text-slate-400">
                Restore questions and attempts from an exported JSON file.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Choose Backup File</span>
              </button>
              {importStatus && (
                <div className="text-[11px] font-mono text-cyan-400 pt-1">{importStatus}</div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-400 block">Reset Everything</span>
              <span className="text-[11px] text-slate-500">
                Clears all custom tests and restores initial demo diagnostic paper.
              </span>
            </div>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetData}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  Yes, Reset All
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
