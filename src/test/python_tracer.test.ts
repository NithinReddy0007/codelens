import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

describe('Python Tracing Engine (Phase 1 Acceptance)', () => {
  const pythonScript = path.resolve(__dirname, '../workers/python_tracer.py');

  it('runs bubble sort and produces a correct unified trace', () => {
    const code = `
from python_tracer import run_python_tracer
import json
src = '''
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

res = bubble_sort([4, 2, 1])
'''
res = run_python_tracer(src)
print(json.dumps(res))
`;
    const output = execFileSync('python', ['-c', code], {
      cwd: path.resolve(__dirname, '../workers'),
      encoding: 'utf-8'
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.totalSteps).toBeGreaterThan(10);
    expect(result.trace[0]).toHaveProperty('line');
    expect(result.trace[0]).toHaveProperty('event');
    expect(result.trace[0]).toHaveProperty('vars');
    expect(result.trace[0]).toHaveProperty('structures');
    expect(result.returnValue).toEqual([1, 2, 4]);
  });

  it('stops infinite loops cleanly at the cap', () => {
    const code = `
from python_tracer import run_python_tracer
import json
src = '''
x = 0
while True:
    x += 1
'''
res = run_python_tracer(src, max_steps=50)
print(json.dumps(res))
`;
    const output = execFileSync('python', ['-c', code], {
      cwd: path.resolve(__dirname, '../workers'),
      encoding: 'utf-8'
    });
    const result = JSON.parse(output);

    expect(result.truncated).toBe(true);
    expect(result.totalSteps).toBe(50);
  });

  it('returns line and message for syntax errors', () => {
    const code = `
from python_tracer import run_python_tracer
import json
src = '''def broken(x:
    return x
'''
res = run_python_tracer(src)
print(json.dumps(res))
`;
    const output = execFileSync('python', ['-c', code], {
      cwd: path.resolve(__dirname, '../workers'),
      encoding: 'utf-8'
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.line).toBe(1);
    expect(result.error.message).toContain('SyntaxError');
  });
});

