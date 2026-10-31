import { tokenize } from './tokenizer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';
import { ExecutionResult, SupportedLanguage } from '../types/trace';

export function runInterpreter(
  code: string,
  language: SupportedLanguage,
  args: any[] = [],
  maxSteps = 20000
): ExecutionResult {
  const startTime = performance.now();

  let phase: 'CompilationError' | 'RuntimeError' = 'CompilationError';
  try {
    const tokens = tokenize(code);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    phase = 'RuntimeError';
    const interpreter = new Interpreter(maxSteps);
    const result = interpreter.execute(ast, undefined, args);

    result.stats = {
      durationMs: Math.round(performance.now() - startTime),
      stepsRecorded: result.totalSteps
    };

    return result;
  } catch (err: any) {
    return {
      success: false,
      trace: [],
      totalSteps: 0,
      truncated: false,
      error: {
        line: err.line || 1,
        message: err.message || String(err),
        type: phase
      },
      stdout: '',
      stats: {
        durationMs: Math.round(performance.now() - startTime),
        stepsRecorded: 0
      }
    };
  }
}

