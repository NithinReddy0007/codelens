import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/Navigation/TopBar';
import { CodeEditor } from './components/Editor/CodeEditor';
import { VisualizerStage } from './components/Visualizer/VisualizerStage';
import { PlaybackControls } from './components/Controls/PlaybackControls';
import { TestCaseSelector } from './components/TestCases/TestCaseSelector';
import { SettingsModal } from './components/Modals/SettingsModal';
import { EXAMPLES } from './data/examples';
import { SupportedLanguage, ExecutionResult } from './types/trace';
import { TestCase } from './types/testCase';
import { ProblemAnalysis } from './types/problem';
import { executor } from './utils/executor';
import { identifyProblemWithAI } from './utils/aiIdentifier';
import { generateTestCases, compareOutputs } from './utils/testCaseGenerator';
import { ProblemInfoPanel } from './components/Analysis/ProblemInfoPanel';
import LZString from 'lz-string';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('codelens_theme') as 'dark' | 'light') || 'dark';
  });

  // Code & Language state
  const [code, setCode] = useState<string>(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(hash);
        if (decompressed) return decompressed;
      } catch (e) {}
    }
    return localStorage.getItem('codelens_code') || EXAMPLES[0].code;
  });

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [selectedExample, setSelectedExample] = useState('bubble_sort_py');

  // Execution & Trace state
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedVarJump, setSelectedVarJump] = useState('');

  // Pyodide status
  const [pyodideStatus, setPyodideStatus] = useState<{ state: string; message?: string }>({
    state: 'idle'
  });

  // Problem Analysis & Test cases
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  // Pane layout
  const [editorWidthPercent, setEditorWidthPercent] = useState(45);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  // Settings & API Key
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('codelens_api_key') || '');

  // Problem identification & test-cases generation on code/language change
  useEffect(() => {
    let isCancelled = false;
    const runAnalysis = async () => {
      const res = await identifyProblemWithAI(code, language, apiKey);
      if (!isCancelled) {
        setAnalysis(res);
        const cases = generateTestCases(res);
        setTestCases(cases);
        if (cases.length > 0) {
          setSelectedCaseId(cases[0].id);
        }
      }
    };
    const timer = setTimeout(runAnalysis, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [code, language, apiKey]);

  // Subscribe to Pyodide status
  useEffect(() => {
    return executor.subscribeStatus((status) => {
      setPyodideStatus(status);
    });
  }, []);

  // Update theme class on body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    localStorage.setItem('codelens_theme', theme);
  }, [theme]);

  // Persist code
  useEffect(() => {
    localStorage.setItem('codelens_code', code);
  }, [code]);

  // Resizable pane splitter
  const handleMouseDownSplitter = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter) return;
      const totalWidth = window.innerWidth;
      const newPercent = Math.max(25, Math.min(75, (e.clientX / totalWidth) * 100));
      setEditorWidthPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  // Run execution
  const handleRun = useCallback(async () => {
    setIsPlaying(false);
    setIsRunning(true);
    setCurrentStep(0);

    const activeCase = testCases.find((tc) => tc.id === selectedCaseId);
    const harnessInput = activeCase ? { args: activeCase.args } : undefined;

    try {
      const result = await executor.runLanguage(language, code, harnessInput, 20000);
      setExecutionResult(result);
      setCurrentStep(0);

      // Update active test case status & comparison
      if (activeCase) {
        if (!result.success) {
          activeCase.status = 'error';
          activeCase.error = result.error?.message;
        } else if (activeCase.hasExpected) {
          const isPassed = compareOutputs(result.returnValue, activeCase.expectedOutput);
          activeCase.status = isPassed ? 'passed' : 'failed';
          activeCase.actualOutput = result.returnValue;
        } else {
          activeCase.status = 'passed';
          activeCase.actualOutput = result.returnValue;
        }
        setTestCases([...testCases]);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        trace: [],
        totalSteps: 0,
        truncated: false,
        error: {
          line: 1,
          message: err.message || String(err),
          type: 'RuntimeError'
        },
        stdout: ''
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, selectedCaseId, testCases]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || !executionResult || executionResult.totalSteps === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intervalMs = prefersReducedMotion ? 600 : Math.max(30, Math.round(500 / speed));

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= executionResult.totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, executionResult, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (executionResult && executionResult.totalSteps > 0) {
          setIsPlaying((prev) => !prev);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStep((prev) =>
          executionResult ? Math.min(executionResult.totalSteps - 1, prev + 1) : 0
        );
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.code === 'Home') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStep(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executionResult]);

  // Variable Jump helper
  const handleJumpNextChange = () => {
    if (!executionResult || !selectedVarJump) return;
    setIsPlaying(false);
    const trace = executionResult.trace;
    for (let i = currentStep + 1; i < trace.length; i++) {
      if (trace[i].changed.includes(selectedVarJump)) {
        setCurrentStep(i);
        return;
      }
    }
  };

  const handleJumpPrevChange = () => {
    if (!executionResult || !selectedVarJump) return;
    setIsPlaying(false);
    const trace = executionResult.trace;
    for (let i = currentStep - 1; i >= 0; i--) {
      if (trace[i].changed.includes(selectedVarJump)) {
        setCurrentStep(i);
        return;
      }
    }
  };

  // Permalink share
  const handleShare = () => {
    const compressed = LZString.compressToEncodedURIComponent(code);
    window.location.hash = compressed;
    navigator.clipboard.writeText(window.location.href);
    alert('Permalink copied to clipboard!');
  };

  // Example selection — sets language explicitly
  const handleSelectExample = (id: string) => {
    const found = EXAMPLES.find((ex) => ex.id === id);
    if (found) {
      setSelectedExample(id);
      setCode(found.code);
      setLanguage(found.language);
      setExecutionResult(null);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const currentStepData = executionResult?.trace[currentStep] || null;
  const previousStepData = currentStep > 0 && executionResult ? executionResult.trace[currentStep - 1] : null;
  const activeCase = testCases.find((tc) => tc.id === selectedCaseId);
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const allVarNames = Array.from(
    new Set(
      executionResult?.trace.flatMap((step) => Object.keys(step.vars)) || []
    )
  );

  const executedLines = executionResult
    ? Array.from(
        new Set(executionResult.trace.slice(0, currentStep + 1).map((s) => s.line))
      )
    : [];

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <TopBar
        language={language}
        onLanguageChange={(lang) => setLanguage(lang)}
        onRun={handleRun}
        isRunning={isRunning}
        pyodideStatus={pyodideStatus}
        onShare={handleShare}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        selectedExample={selectedExample}
        onSelectExample={handleSelectExample}
        examples={EXAMPLES}
      />

      {/* Main Workspace (Editor + Visualizer) */}
      <div className="main-content">
        <div className="editor-pane" style={{ width: `${editorWidthPercent}%` }}>
          <ProblemInfoPanel analysis={analysis} />
          <div className="section-header">
            <span>Source Code ({language.toUpperCase()})</span>
            {currentStepData && (
              <span className="font-mono tabular-nums" style={{ color: 'var(--accent)' }}>
                Line {currentStepData.line}
              </span>
            )}
          </div>
          <div className="editor-wrapper">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              activeLine={currentStepData?.line}
              errorLine={executionResult?.error?.line}
              executedLines={executedLines}
              readOnly={isPlaying}
            />
          </div>
        </div>

        <div
          className={`pane-splitter ${isDraggingSplitter ? 'dragging' : ''}`}
          onMouseDown={handleMouseDownSplitter}
        />

        <div className="visualizer-pane" style={{ width: `${100 - editorWidthPercent}%` }}>
          <VisualizerStage
            currentStepData={currentStepData}
            previousStepData={previousStepData}
            executionResult={executionResult}
            expectedOutput={activeCase?.expectedOutput}
            hasExpected={activeCase?.hasExpected}
            isRunning={isRunning}
            isReducedMotion={isReducedMotion}
          />
        </div>
      </div>

      {/* Bottom Controls & Test Cases */}
      <div className="bottom-bar">
        <TestCaseSelector
          testCases={testCases}
          selectedCaseId={selectedCaseId}
          onSelectCase={(id) => {
            setSelectedCaseId(id);
            setExecutionResult(null);
            setCurrentStep(0);
            setIsPlaying(false);
          }}
          onAddCase={(tc) => setTestCases((prev) => [...prev, tc])}
          onUpdateCase={(tc) =>
            setTestCases((prev) => prev.map((c) => (c.id === tc.id ? tc : c)))
          }
        />

        <PlaybackControls
          currentStep={currentStep}
          totalSteps={executionResult?.totalSteps || 0}
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={() => setIsPlaying((p) => !p)}
          onStepForward={() => {
            setIsPlaying(false);
            setCurrentStep((prev) =>
              executionResult ? Math.min(executionResult.totalSteps - 1, prev + 1) : 0
            );
          }}
          onStepBack={() => {
            setIsPlaying(false);
            setCurrentStep((prev) => Math.max(0, prev - 1));
          }}
          onRestart={() => {
            setIsPlaying(false);
            setCurrentStep(0);
          }}
          onSeek={(step) => {
            setIsPlaying(false);
            setCurrentStep(step);
          }}
          onSpeedChange={setSpeed}
          variables={allVarNames}
          selectedVarJump={selectedVarJump}
          onVarJumpSelect={setSelectedVarJump}
          onJumpNextChange={handleJumpNextChange}
          onJumpPrevChange={handleJumpPrevChange}
          disabled={isRunning || !executionResult}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          localStorage.setItem('codelens_api_key', key);
        }}
      />
    </div>
  );
};
