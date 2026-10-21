import React, { useState, useRef, useMemo } from 'react';
import { AppRoute } from '../utils/router';
import { validateAndNormalizeTestJson, ValidationResult } from '../utils/validation';
import { StorageService } from '../db/storage';
import { TestMetadata } from '../types/test';
import { calculateTestDuration } from '../utils/duration';
import { LatexRenderer } from '../utils/latex';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode,
  FileUp,
  FolderOpen,
  HelpCircle,
  Layers,
  ListOrdered,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';

interface TestCreatorProps {
  onNavigate: (route: AppRoute) => void;
  onTestCreated: (test: TestMetadata) => void;
}

const STARTER_SAMPLE_JSON = `{
  "title": "JEE Advanced Mechanics & Calculus Speed Drill",
  "questions": [
    {
      "id": "drill_q1",
      "subject": "Physics",
      "subtopic": "Centre of Mass & Collision",
      "type": "mcq",
      "question": "A particle of mass $m = 2\\\\,\\\\text{kg}$ moving with speed $v = 6\\\\,\\\\text{m/s}$ collides head-on elastically with an identical stationary particle. The velocity of the first particle immediately after collision is:",
      "options": [
        { "id": "A", "text": "$0\\\\,\\\\text{m/s}$" },
        { "id": "B", "text": "$3\\\\,\\\\text{m/s}$" },
        { "id": "C", "text": "$6\\\\,\\\\text{m/s}$" },
        { "id": "D", "text": "$-3\\\\,\\\\text{m/s}$" }
      ],
      "answer": "A",
      "marks": 4,
      "negativeMarks": 1,
      "timeEstimateSeconds": 90,
      "solution": "In a 1D elastic collision between two identical masses, the particles completely exchange their velocities. Since particle 2 was at rest, particle 1 comes to rest ($0\\\\,\\\\text{m/s}$) and particle 2 moves with $6\\\\,\\\\text{m/s}$."
    },
    {
      "id": "drill_q2",
      "subject": "Chemistry",
      "subtopic": "Thermodynamics",
      "type": "multiple",
      "question": "For an ideal gas undergoing a reversible isothermal expansion, which of the following thermodynamic statements is/are CORRECT?",
      "options": [
        { "id": "A", "text": "$\\\\Delta U = 0$" },
        { "id": "B", "text": "$q = -w$" },
        { "id": "C", "text": "$\\\\Delta S_{\\\\text{system}} > 0$" },
        { "id": "D", "text": "$\\\\Delta H \\\\neq 0$" }
      ],
      "answers": ["A", "B", "C"],
      "marks": 4,
      "negativeMarks": 2,
      "timeEstimateSeconds": 130,
      "solution": "For an ideal gas at constant temperature, internal energy and enthalpy depend only on temperature, so $\\\\Delta U = 0$ and $\\\\Delta H = 0$. By the first law, $q = -w$. Since volume increases, $\\\\Delta S = n R \\\\ln(V_2/V_1) > 0$. Thus A, B, and C are correct."
    },
    {
      "id": "drill_q3",
      "subject": "Mathematics",
      "subtopic": "Definite Integrals",
      "type": "integer",
      "question": "Compute the value of the integral: \\\\[ I = \\\\int_{-1}^{1} (x^5 + x^3 \\\\cos x + 3) dx \\\\] What is the integer value of $I$?",
      "marks": 4,
      "negativeMarks": 0,
      "timeEstimateSeconds": 80,
      "answer": 6,
      "tolerance": 0,
      "solution": "$x^5$ and $x^3\\\\cos x$ are odd functions, so their integrals from $-1$ to $1$ evaluate to $0$. The remaining term is $\\\\int_{-1}^1 3 dx = 3(1 - (-1)) = 6$."
    },
    {
      "id": "drill_q4",
      "subject": "Physics",
      "subtopic": "Units and Dimensions",
      "type": "matching",
      "question": "Match the physical quantities in Column A with their dimensional formulas in Column B:",
      "columnA": [
        { "id": "A", "text": "Plank's Constant ($h$)" },
        { "id": "B", "text": "Coefficient of Viscosity ($\\\\eta$)" },
        { "id": "C", "text": "Thermal Conductivity ($K$)" }
      ],
      "columnB": [
        { "id": "1", "text": "$[ML^{-1}T^{-1}]$" },
        { "id": "2", "text": "$[ML^2T^{-1}]$" },
        { "id": "3", "text": "$[MLT^{-3}K^{-1}]$" }
      ],
      "correctMatch": {
        "A": "2",
        "B": "1",
        "C": "3"
      },
      "marks": 4,
      "negativeMarks": 1,
      "timeEstimateSeconds": 140
    },
    {
      "id": "drill_passage1",
      "subject": "Mathematics",
      "subtopic": "Coordinate Geometry",
      "type": "paragraph",
      "paragraph": "Consider the parabola $y^2 = 8x$ and a focal chord $PQ$ with one endpoint $P(2, 4)$.",
      "parts": [
        {
          "id": "drill_p1_sub1",
          "subject": "Mathematics",
          "subtopic": "Parabola",
          "type": "mcq",
          "question": "The coordinates of the other endpoint $Q$ of the focal chord are:",
          "options": [
            { "id": "A", "text": "$(2, -4)$" },
            { "id": "B", "text": "$(8, -8)$" },
            { "id": "C", "text": "$(18, -12)$" },
            { "id": "D", "text": "$(1/2, -2)$" }
          ],
          "answer": "A",
          "marks": 4,
          "negativeMarks": 1,
          "timeEstimateSeconds": 100
        },
        {
          "id": "drill_p1_sub2",
          "subject": "Mathematics",
          "subtopic": "Parabola",
          "type": "integer",
          "question": "Calculate the length of this focal chord $PQ$.",
          "marks": 4,
          "negativeMarks": 0,
          "timeEstimateSeconds": 110,
          "answer": 8,
          "tolerance": 0
        }
      ]
    }
  ]
}`;

export const TestCreator: React.FC<TestCreatorProps> = ({ onNavigate, onTestCreated }) => {
  const [jsonText, setJsonText] = useState(STARTER_SAMPLE_JSON);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(() =>
    validateAndNormalizeTestJson(STARTER_SAMPLE_JSON)
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-run validation on demand or whenever user clicks Validate
  const handleValidate = () => {
    setActionError(null);
    const res = validateAndNormalizeTestJson(jsonText);
    setValidationResult(res);
  };

  const handleFormatJson = () => {
    try {
      setActionError(null);
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      const res = validateAndNormalizeTestJson(formatted);
      setValidationResult(res);
    } catch (err: any) {
      setActionError(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  const handleClear = () => {
    setActionError(null);
    setJsonText('{\n  "title": "Custom JEE Practice Test",\n  "questions": []\n}');
    setShowClearConfirm(false);
    setValidationResult(null);
  };

  const handleLoadSample = () => {
    setActionError(null);
    setJsonText(STARTER_SAMPLE_JSON);
    const res = validateAndNormalizeTestJson(STARTER_SAMPLE_JSON);
    setValidationResult(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonText(content);
        const res = validateAndNormalizeTestJson(content);
        setValidationResult(res);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProceedToConfigure = () => {
    setActionError(null);
    const currentValidation = validateAndNormalizeTestJson(jsonText);
    setValidationResult(currentValidation);

    if (!currentValidation.isValid || currentValidation.normalizedQuestions.length === 0) {
      setActionError('Please resolve all validation errors before proceeding.');
      return;
    }

    const durationInfo = calculateTestDuration(currentValidation.normalizedQuestions);

    const newTest: TestMetadata = {
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: currentValidation.normalizedTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalQuestions: currentValidation.normalizedQuestions.length,
      totalSubQuestions: currentValidation.stats.subQuestionsCount,
      totalMarks: currentValidation.stats.totalMarks,
      estimatedSolvingMinutes: durationInfo.recommendedDurationMinutes,
      questions: currentValidation.normalizedQuestions,
      rawJson: jsonText,
    };

    StorageService.saveTest(newTest);
    onTestCreated(newTest);
    onNavigate({ path: 'tests/configure', testId: newTest.id });
  };

  // Calculate line numbers for editor
  const lineNumbers = useMemo(() => {
    return jsonText.split('\n').map((_, i) => i + 1);
  }, [jsonText]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                <Code2 className="w-4 h-4" />
                <span>JSON IMPORT STUDIO</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                Create &amp; Import JEE Question Set
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Paste structured question JSON or load a file. Our validator verifies schema, option links, LaTeX, and marks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <FileUp className="w-4 h-4 text-cyan-400" />
                <span>Upload .JSON</span>
              </button>

              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Load Sample Template</span>
              </button>

              <button
                onClick={handleProceedToConfigure}
                disabled={!validationResult?.isValid}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-lg transition ${
                  validationResult?.isValid
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>Continue to Test Configuration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {actionError && (
          <div className="mb-4 bg-rose-950/80 border border-rose-500/60 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation and Summary Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Schema Status</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold">
                {validationResult?.isValid ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-sm font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Validated
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 text-sm font-mono">
                    <XCircle className="w-4 h-4" /> {validationResult?.errors.length || 0} Error(s)
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <FileCode className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Subquestions Total</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {validationResult?.stats.subQuestionsCount || 0}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <ListOrdered className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Subjects Detected</span>
              <div className="text-xs font-semibold text-slate-300 mt-1 flex flex-wrap gap-1">
                {validationResult && Object.keys(validationResult.stats.subjectDistribution).length > 0
                  ? Object.entries(validationResult.stats.subjectDistribution).map(([sub, count]) => (
                      <span key={sub} className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        {sub}: {count}
                      </span>
                    ))
                  : '—'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Max Marks</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {validationResult?.stats.totalMarks || 0}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <CheckCircle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Validation Errors Box (if any) */}
        {validationResult && !validationResult.isValid && validationResult.errors.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-5 mb-6 text-rose-200">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-300 mb-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Validation Errors in JSON Schema ({validationResult.errors.length})</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono pr-2">
              {validationResult.errors.map((err, i) => (
                <div key={i} className="bg-rose-900/40 p-2 rounded border border-rose-800/60 flex items-start gap-2">
                  <span className="font-bold text-rose-400 whitespace-nowrap">
                    [{err.path}]
                  </span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Studio Tabs: Editor vs Parsed Preview */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>JSON Editor</span>
            </button>

            <button
              onClick={() => {
                handleValidate();
                setActiveTab('preview');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Question Preview ({validationResult?.normalizedQuestions.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFormatJson}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              title="Format JSON code"
            >
              Format JSON
            </button>

            <button
              onClick={handleValidate}
              className="text-xs text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 transition font-semibold"
            >
              Validate Now
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950 border border-rose-600 px-2 py-0.5 rounded text-xs">
                <span className="text-rose-200 text-[10px]">Clear all?</span>
                <button
                  onClick={handleClear}
                  className="text-rose-400 hover:text-rose-300 font-bold px-1"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-slate-400 hover:text-slate-300 px-1"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded hover:bg-slate-800 transition"
                title="Clear editor"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Large Monospace JSON Editor */}
        {activeTab === 'editor' && (
          <div className="relative rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="flex bg-slate-950 border-b border-slate-800 px-4 py-2 text-[11px] text-slate-400 font-mono justify-between items-center">
              <span>test_definition.json</span>
              <span>{jsonText.split('\n').length} lines</span>
            </div>

            <div className="flex min-h-[520px] max-h-[680px] overflow-auto bg-slate-950 font-mono text-xs">
              {/* Line numbers column */}
              <div className="select-none py-4 px-3 text-right bg-slate-900/60 text-slate-600 border-r border-slate-800 text-[11px] leading-relaxed">
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>

              {/* Textarea editor */}
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  // validate on change
                  const res = validateAndNormalizeTestJson(e.target.value);
                  setValidationResult(res);
                }}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent text-slate-200 focus:outline-none resize-none leading-relaxed font-mono selection:bg-blue-600 selection:text-white"
                placeholder="Paste question JSON here..."
              />
            </div>
          </div>
        )}

        {/* Tab 2: Parsed Questions Live Preview */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            {(!validationResult || validationResult.normalizedQuestions.length === 0) ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="font-medium text-white">No valid questions to preview</p>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure the JSON syntax is correct and the &quot;questions&quot; array is populated.
                </p>
              </div>
            ) : (
              validationResult.normalizedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">{q.subject}</span>
                      {q.subtopic && (
                        <span className="text-xs text-slate-400">• {q.subtopic}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {q.type}
                      </span>
                      <span className="font-mono text-emerald-400 text-xs">
                        +{q.marks || 4} / -{q.negativeMarks || 1}
                      </span>
                    </div>
                  </div>

                  {q.type === 'paragraph' ? (
                    <div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Passage
                        </span>
                        <LatexRenderer content={q.paragraph} className="text-xs text-slate-300 leading-relaxed" />
                      </div>

                      <div className="space-y-3 pl-4 border-l-2 border-blue-600/60">
                        {q.parts.map((sub, sIdx) => (
                          <div key={sub.id || sIdx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="font-bold text-blue-300">Subquestion {sIdx + 1} ({sub.type})</span>
                              <span className="text-emerald-400 font-mono text-[11px]">+{sub.marks} / -{sub.negativeMarks}</span>
                            </div>
                            <LatexRenderer content={sub.question} className="text-xs text-slate-200 mb-2" />
                            {sub.type === 'mcq' && sub.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {sub.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={`p-2 rounded border text-xs flex items-center gap-2 ${
                                      opt.id === sub.answer
                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <span className="font-bold">{opt.id}.</span>
                                    <LatexRenderer content={opt.text} inline />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <LatexRenderer content={q.question} className="text-sm text-slate-200 mb-3" />

                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                opt.id === q.answer
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                                {opt.id}
                              </span>
                              <LatexRenderer content={opt.text} inline />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiple' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                q.answers?.includes(opt.id)
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                                {opt.id}
                              </span>
                              <LatexRenderer content={opt.text} inline />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'integer' && (
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
                          <span className="text-slate-400">Correct Numerical Answer:</span>
                          <span className="font-mono font-bold text-emerald-400">{q.answer}</span>
                          {q.tolerance !== undefined && (
                            <span className="text-slate-500 text-[11px]">(±{q.tolerance})</span>
                          )}
                        </div>
                      )}

                      {q.type === 'matching' && (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-400 block mb-2 font-medium">Matching Columns:</span>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-bold text-slate-400 block mb-1">Column A</span>
                              {q.columnA?.map((a) => (
                                <div key={a.id} className="py-1 text-slate-300">
                                  <strong>{a.id}.</strong> <LatexRenderer content={a.text} inline />
                                </div>
                              ))}
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block mb-1">Column B</span>
                              {q.columnB?.map((b) => (
                                <div key={b.id} className="py-1 text-slate-300">
                                  <strong>{b.id}.</strong> <LatexRenderer content={b.text} inline />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {q.solution && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                          <strong className="text-slate-300">Solution: </strong>
                          <LatexRenderer content={q.solution} inline />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
