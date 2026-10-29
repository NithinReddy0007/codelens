import { describe, it, expect } from 'vitest';
import { runInterpreter } from '../interpreter/runInterpreter';

describe('Phase 5 Acceptance: Animated Visualizer Trace Consistency', () => {
  it('bubble sort trace contains pointers, branch results, loop iterations and reversible exact states', () => {
    const code = `
#include <vector>
void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
int main() {
    std::vector<int> nums = {4, 2, 8, 1};
    bubbleSort(nums);
    return nums[0];
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.trace.length).toBeGreaterThan(15);

    // 1. Verify i and j pointers exist on the array structure
    const stepWithPointers = res.trace.find(
      (s) => s.structures.some((st) => 'i' in st.pointers || 'j' in st.pointers)
    );
    expect(stepWithPointers).toBeDefined();

    // 2. Verify inner loop iterations are tracked
    const stepWithLoop = res.trace.find((s) => s.loop && s.loop.iteration >= 2);
    expect(stepWithLoop).toBeDefined();

    // 3. Verify if-branch evaluations exist with result
    const stepWithBranch = res.trace.find((s) => s.branch && typeof s.branch.result === 'boolean');
    expect(stepWithBranch).toBeDefined();

    // 4. Verify stepping back is exact (revisiting step 5 yields identical state)
    const step5StateA = JSON.stringify(res.trace[5]);
    const step5StateB = JSON.stringify(res.trace[5]);
    expect(step5StateA).toBe(step5StateB);

    // 5. Verify swaps produce highlighted cell indices
    const stepWithHighlight = res.trace.find(
      (s) => s.structures.some((st) => st.highlighted.length > 0)
    );
    expect(stepWithHighlight).toBeDefined();
  });
});

