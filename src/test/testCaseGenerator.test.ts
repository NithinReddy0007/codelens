import { describe, it, expect } from 'vitest';
import { identifyProblem } from '../utils/problemIdentifier';
import { generateTestCases, compareOutputs } from '../utils/testCaseGenerator';

describe('Phase 3 - Test Case Generation & Acceptance', () => {
  it('generates 3-4 curated test cases for LeetCode Two Sum with reliable expected outputs', () => {
    const twoSumPy = `
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
`;
    const analysis = identifyProblem(twoSumPy, 'python');
    expect(analysis.problemId).toBe('two_sum');

    const cases = generateTestCases(analysis);
    expect(cases.length).toBeGreaterThanOrEqual(3);
    expect(cases.length).toBeLessThanOrEqual(4);

    // Verify first case has expected output
    const case1 = cases[0];
    expect(case1.label).toBe('Typical case');
    expect(case1.args).toEqual([[2, 7, 11, 15], 9]);
    expect(case1.hasExpected).toBe(true);
    expect(case1.expectedOutput).toEqual([0, 1]);

    // Verify boundary case has expected output
    const case3 = cases[2];
    expect(case3.label).toBe('Duplicate elements');
    expect(case3.args).toEqual([[3, 3], 6]);
    expect(case3.expectedOutput).toEqual([0, 1]);
  });

  it('generates 3 curated structural cases for generic function signature', () => {
    const customSig = {
      problemName: 'Custom Algorithm',
      description: 'Custom function',
      technique: 'Custom',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      confidence: 'low' as const,
      source: 'local' as const,
      structuralSignals: [],
      signature: {
        functionName: 'compute',
        parameters: [
          { name: 'arr', type: 'list[int]', kind: 'array' as const },
          { name: 'k', type: 'int', kind: 'int' as const }
        ],
        returnType: 'int',
        returnKind: 'int' as const
      }
    };

    const cases = generateTestCases(customSig);
    expect(cases.length).toBe(3);
    expect(cases[0].label).toBe('Typical case');
    expect(cases[1].label).toBe('Minimal / Empty');
    expect(cases[1].args[0]).toEqual([]);
    expect(cases[1].hasExpected).toBe(false);
  });

  it('accurately compares scalar and structured outputs', () => {
    expect(compareOutputs([0, 1], [0, 1])).toBe(true);
    expect(compareOutputs([0, 1], [1, 0])).toBe(false);
    expect(compareOutputs(42, 42)).toBe(true);
    expect(compareOutputs(42, 43)).toBe(false);
    expect(compareOutputs({ a: 1 }, { a: 1 })).toBe(true);
  });
});

