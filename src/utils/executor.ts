import { ExecutionResult, SupportedLanguage } from '../types/trace';

type StatusListener = (status: { state: 'idle' | 'loading' | 'ready' | 'running' | 'error'; message?: string }) => void;

class ExecutionManager {
  private pythonWorker: Worker | null = null;
  private statusListeners: Set<StatusListener> = new Set();
  private isPyodideReady = false;
  private currentRunReject: ((reason?: any) => void) | null = null;
  private workerTimeoutId: any = null;

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
            this.notifyStatus('ready', message);
          } else if (status === 'loading') {
            this.notifyStatus('loading', message);
          } else if (status === 'error') {
            this.notifyStatus('error', message);
          }
        }
      };

      this.pythonWorker.onerror = (err) => {
        console.error('Worker error:', err);
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
    this.notifyStatus('running', 'Executing trace...');

    return new Promise((resolve) => {
      if (!this.pythonWorker) {
        this.initPythonWorker();
      }

      const runId = Math.random().toString(36).substring(2, 9);

      // Watchdog timeout to prevent frozen workers
      this.workerTimeoutId = setTimeout(() => {
        this.terminateAndRestartWorker();
        this.notifyStatus('ready', 'Worker restarted after timeout');
        resolve({
          success: false,
          trace: [],
          totalSteps: 0,
          truncated: true,
          error: {
            line: 1,
            message: 'Execution stopped: time limit reached (possible infinite loop)',
            type: 'TimeoutError'
          },
          stdout: '',
          stats: {
            durationMs: Math.round(performance.now() - startTime),
            stepsRecorded: 0
          }
        });
      }, timeoutMs);

      const handleMessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.type === 'result' && (!data.id || data.id === runId)) {
          clearTimeout(this.workerTimeoutId);
          if (this.pythonWorker) {
            this.pythonWorker.removeEventListener('message', handleMessage);
          }

          const result: ExecutionResult = data.result;
          result.stats = {
            durationMs: Math.round(performance.now() - startTime),
            stepsRecorded: result.totalSteps
          };

          this.notifyStatus('ready', result.success ? `Recorded ${result.totalSteps} steps` : 'Execution finished with error');
          resolve(result);
        }
      };

      if (this.pythonWorker) {
        this.pythonWorker.addEventListener('message', handleMessage);
        this.pythonWorker.postMessage({
          id: runId,
          type: 'run',
          code,
          harnessInput,
          maxSteps
        });
      } else {
        clearTimeout(this.workerTimeoutId);
        resolve({
          success: false,
          trace: [],
          totalSteps: 0,
          truncated: false,
          error: {
            line: 1,
            message: 'Worker could not be initialized',
            type: 'WorkerInitError'
          },
          stdout: ''
        });
      }
    });
  }

  public terminateAndRestartWorker() {
    clearTimeout(this.workerTimeoutId);
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
