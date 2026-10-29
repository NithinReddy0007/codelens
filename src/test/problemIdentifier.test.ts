import { describe, it, expect } from 'vitest';
import { identifyProblem } from '../utils/problemIdentifier';
import { parseSignature } from '../utils/signatureParser';

describe('Phase 2 - Problem Identification & Signature Parsing', () => {
  it('correctly identifies Two Sum with high confidence', () => {
    const pyTwoSum = `
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
    const analysis = identifyProblem(pyTwoSum, 'python');
    expect(analysis.problemName).toBe('Two Sum');
    expect(analysis.confidence).toBe('high');
    expect(analysis.technique).toContain('Hash Map');
    expect(analysis.timeComplexity).toBe('O(N)');
  });

  it('correctly identifies Binary Search across languages', () => {
    const cppCode = `
#include <vector>
class Solution {
public:
    int search(std::vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};
`;
    const analysis = identifyProblem(cppCode, 'cpp');
    expect(analysis.problemName).toBe('Binary Search');
    expect(analysis.confidence).toBe('high');
    expect(analysis.timeComplexity).toBe('O(log N)');
  });

  it('correctly identifies Valid Parentheses', () => {
    const pyCode = `
class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        for c in s:
            if c == '(':
                stack.append(')')
            elif not stack or stack.pop() != c:
                return False
        return not stack
`;
    const analysis = identifyProblem(pyCode, 'python');
    expect(analysis.problemName).toBe('Valid Parentheses');
    expect(analysis.technique).toBe('Stack');
  });

  it('handles custom unrecognized code without guessing blindly', () => {
    const customCode = `
def custom_matrix_shuffle(matrix):
    rows = len(matrix)
    cols = len(matrix[0])
    for r in range(rows):
        for c in range(cols):
            matrix[r][c] = matrix[r][c] * 2 + 1
    return matrix
`;
    const analysis = identifyProblem(customCode, 'python');
    expect(analysis.confidence).toBe('low');
    expect(analysis.description).toContain('Unrecognized algorithm');
    expect(analysis.description).toContain('nested loops');
  });

  it('parses LeetCode C++ signature correctly', () => {
    const code = `
class Solution {
public:
    int search(vector<int>& nums, int target) {
        return 0;
    }
};
`;
    const sig = parseSignature(code, 'cpp');
    expect(sig).not.toBeNull();
    expect(sig?.functionName).toBe('search');
    expect(sig?.parameters.length).toBe(2);
    expect(sig?.parameters[0].name).toBe('nums');
    expect(sig?.parameters[0].kind).toBe('array');
    expect(sig?.parameters[1].name).toBe('target');
    expect(sig?.parameters[1].kind).toBe('int');
  });
});

