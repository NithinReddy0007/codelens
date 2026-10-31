import { ExecutionResult, SupportedLanguage } from '../types/trace';

type StatusListener = (status: { state: 'idle' | 'loading' | 'ready' | 'running' | 'error'; message?: string }) => void;

class ExecutionManager {
  private pythonWorker: Worker | null = null;
  private statusListeners: Set<StatusListener> = new Set();
  private isPyodideReady = false;
  private currentRunReject: ((reason?: any) => void) | null = null;
  private readyPromise: Promise<boolean> = Promise.resolve(false);
  private resolveReady: (ok: boolean) => void = () => {};
  private runCounter = 0;

  constructor() {
    this.initPythonWorker();
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    if (this.isPyodideReady) {
      listener({ state: 'ready', message: 'Pyodide ready' });
    }
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(state: 'idle' | 'loading' | 'ready' | 'running' | 'error', message?: string) {
    for (const listener of this.statusListeners) {
      listener({ state, message });
    }
  }

  private initPythonWorker() {
    this.readyPromise = new Promise<boolean>((res) => { this.resolveReady = res; });
    if (this.pythonWorker) {
      try {
        this.pythonWorker.terminate();
      } catch (e) {}
    }

    try {
      this.pythonWorker = new Worker(
        new URL('../workers/pythonWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.pythonWorker.onmessage = (e: MessageEvent) => {
        const { type, status, message } = e.data;
        if (type === 'status') {
          if (status === 'ready') {
            this.isPyodideReady = true;
            this.resolveReady(true);
            this.notifyStatus('ready', message);
          } else if (status === 'loading') {
            this.notifyStatus('loading', message);
          } else if (status === 'error') {
            this.resolveReady(false);
            this.notifyStatus('error', message);
          }
        }
      };

      this.pythonWorker.onerror = (err) => {
        console.error('Worker error:', err);
        this.resolveReady(false);
        this.notifyStatus('error', err.message || 'Worker error');
      };

      // Trigger lazy init in worker
      this.pythonWorker.postMessage({ type: 'init' });
    } catch (err: any) {
      console.error('Failed to spawn Python worker:', err);
      this.notifyStatus('error', err.message);
    }
  }

  public async runLanguage(
    language: SupportedLanguage,
    code: string,
    harnessInput?: Record<string, any>,
    maxSteps: number = 20000
  ): Promise<ExecutionResult> {
    if (language === 'python') {
      return this.runPython(code, harnessInput, maxSteps);
    } else {
      // Run Java or C++ in-browser tree-walking interpreter
      const { runInterpreter } = await import('../interpreter/runInterpreter');
      const args = harnessInput?.args || [];
      return runInterpreter(code, language, args, maxSteps);
    }
  }

  public async runPython(
    code: string,
    harnessInput?: Record<string, any>,
    maxSteps: number = 20000,
    timeoutMs: number = 10000
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const fail = (message: string, type: string, truncated = false): ExecutionResult => ({
      success: false,
      trace: [],
      totalSteps: 0,
      truncated,
      error: { line: 1, message, type },
      stdout: '',
      stats: { durationMs: Math.round(performance.now() - startTime), stepsRecorded: 0 }
    });

    if (!this.pythonWorker) this.initPythonWorker();
    // Wait for Pyodide to finish loading BEFORE the watchdog starts
    this.notifyStatus('loading', 'Waiting for Python runtime...');
    const ready = await this.readyPromise;
    if (!ready || !this.pythonWorker) {
      return fail('Python runtime failed to load', 'WorkerInitError');
    }

    this.notifyStatus('running', 'Executing trace...');
    const worker = this.pythonWorker;
    const runId = `run-${++this.runCounter}`;
    const execStart = performance.now();

    return new Promise<ExecutionResult>((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener('message', handleMessage);
      };

      const handleMessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.type !== 'result' || data.id !== runId) return;
        cleanup();
        const result: ExecutionResult = data.result;
        result.stats = {
          durationMs: Math.round(performance.now() - execStart),
          stepsRecorded: result.totalSteps
        };
        this.notifyStatus('ready', result.success ? `Recorded ${result.totalSteps} steps` : 'Execution finished with error');
        resolve(result);
      };

      timer = setTimeout(() => {
        cleanup();
        if (this.pythonWorker === worker) this.terminateAndRestartWorker();
        this.notifyStatus('loading', 'Restarting Python runtime after timeout...');
        resolve(fail('Execution stopped: time limit reached (possible infinite loop)', 'TimeoutError', true));
      }, timeoutMs);

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ id: runId, type: 'run', code, harnessInput, maxSteps });
    });
  }

  public terminateAndRestartWorker() {
    if (this.pythonWorker) {
      try {
        this.pythonWorker.terminate();
      } catch (e) {}
      this.pythonWorker = null;
    }
    this.isPyodideReady = false;
    this.initPythonWorker();
  }
}

export const executor = new ExecutionManager();
