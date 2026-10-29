import { describe, it, expect } from 'vitest';
import { runInterpreter } from '../interpreter/runInterpreter';

describe('Phase 4 - C++ Conformance Tests (15+ features)', () => {
  it('1. Primitives & arithmetic', () => {
    const code = `
int main() {
    int a = 10;
    int b = 25;
    int c = a + b * 2;
    return c;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(60);
  });

  it('2. If-else branching', () => {
    const code = `
int check(int x) {
    if (x > 10) {
        return 1;
    } else {
        return 0;
    }
}
int main() {
    return check(15);
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(1);
  });

  it('3. While loop', () => {
    const code = `
int main() {
    int count = 0;
    int i = 5;
    while (i > 0) {
        count += i;
        i--;
    }
    return count;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(15);
  });

  it('4. Do-while loop', () => {
    const code = `
int main() {
    int x = 0;
    do {
        x += 2;
    } while (x < 10);
    return x;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(10);
  });

  it('5. Standard for loop', () => {
    const code = `
int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
    }
    return sum;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(15);
  });

  it('6. Range-based for loop', () => {
    const code = `
#include <vector>
int main() {
    std::vector<int> nums = {2, 4, 6};
    int total = 0;
    for (int x : nums) {
        total += x;
    }
    return total;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(12);
  });

  it('7. Function calls & parameter passing', () => {
    const code = `
int multiply(int a, int b) {
    return a * b;
}
int main() {
    return multiply(6, 7);
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(42);
  });

  it('8. Recursion (factorial)', () => {
    const code = `
int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}
int main() {
    return fact(5);
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(120);
  });

  it('9. 1D Vector operations', () => {
    const code = `
#include <vector>
int main() {
    std::vector<int> v;
    v.push_back(10);
    v.push_back(20);
    v.push_back(30);
    v[1] = 99;
    return v[1] + v.size();
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(102);
  });

  it('10. 2D Vector (Matrix)', () => {
    const code = `
#include <vector>
int main() {
    std::vector<std::vector<int>> mat = {{1, 2}, {3, 4}};
    return mat[1][0] + mat[1][1];
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(7);
  });

  it('11. String operations', () => {
    const code = `
#include <string>
int main() {
    std::string s = "hello";
    return s.length();
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(5);
  });

  it('12. Unordered map (Hash map)', () => {
    const code = `
#include <unordered_map>
int main() {
    std::unordered_map<int, int> m;
    m[10] = 500;
    m[20] = 700;
    return m[10] + m.size();
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(502);
  });

  it('13. Linked list manipulation', () => {
    const code = `
struct ListNode {
    int val;
    ListNode* next;
};
int main() {
    ListNode* head = new ListNode(1, new ListNode(2, new ListNode(3)));
    int sum = 0;
    ListNode* curr = head;
    while (curr != null) {
        sum += curr->val;
        curr = curr->next;
    }
    return sum;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(6);
  });

  it('14. Ternary operator', () => {
    const code = `
int main() {
    int a = 5;
    int b = 10;
    int maxVal = a > b ? a : b;
    return maxVal;
}
`;
    const res = runInterpreter(code, 'cpp');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(10);
  });

  it('15. Bubble sort algorithm', () => {
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
    expect(res.returnValue).toBe(1);
  });
});

describe('Phase 4 - Java Conformance Tests (15+ features)', () => {
  it('1. Primitives & arithmetic', () => {
    const code = `
class Solution {
    public int solve() {
        int x = 20;
        int y = 5;
        return x / y + 3;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(7);
  });

  it('2. If-else branching', () => {
    const code = `
class Solution {
    public int check(int val) {
        if (val % 2 == 0) {
            return 2;
        } else {
            return 1;
        }
    }
}
`;
    const res = runInterpreter(code, 'java', [8]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(2);
  });

  it('3. While loop', () => {
    const code = `
class Solution {
    public int count() {
        int n = 4;
        int res = 1;
        while (n > 0) {
            res *= n;
            n--;
        }
        return res;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(24);
  });

  it('4. Do-while loop', () => {
    const code = `
class Solution {
    public int run() {
        int sum = 0;
        int i = 1;
        do {
            sum += i;
            i++;
        } while (i <= 4);
        return sum;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(10);
  });

  it('5. Standard for loop', () => {
    const code = `
class Solution {
    public int loop() {
        int s = 0;
        for (int i = 0; i < 5; i++) {
            s += i;
        }
        return s;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(10);
  });

  it('6. Enhanced for loop (for-each)', () => {
    const code = `
class Solution {
    public int sumArr() {
        int[] arr = {10, 20, 30};
        int total = 0;
        for (int v : arr) {
            total += v;
        }
        return total;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(60);
  });

  it('7. Functions & return values', () => {
    const code = `
class Solution {
    public int cube(int x) {
        return x * x * x;
    }
}
`;
    const res = runInterpreter(code, 'java', [3]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(27);
  });

  it('8. Recursion (Fibonacci)', () => {
    const code = `
class Solution {
    public int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}
`;
    const res = runInterpreter(code, 'java', [6]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(8);
  });

  it('9. 1D Array indexing and length', () => {
    const code = `
class Solution {
    public int testArray() {
        int[] nums = {5, 10, 15};
        nums[1] = 20;
        return nums[1] + nums.length;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(23);
  });

  it('10. 2D Array (Matrix)', () => {
    const code = `
class Solution {
    public int testMatrix() {
        int[][] mat = {{2, 4}, {6, 8}};
        return mat[0][1] + mat[1][0];
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(10);
  });

  it('11. String methods', () => {
    const code = `
class Solution {
    public int strLen() {
        String s = "CodeLens";
        return s.length();
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(8);
  });

  it('12. HashMap usage', () => {
    const code = `
class Solution {
    public int mapTest() {
        HashMap<String, Integer> map = new HashMap<>();
        map.put("score", 95);
        return map.get("score");
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(95);
  });

  it('13. Linked list manipulation', () => {
    const code = `
class ListNode {
    int val;
    ListNode next;
}
class Solution {
    public int sumList() {
        ListNode head = new ListNode(5, new ListNode(10, null));
        return head.val + head.next.val;
    }
}
`;
    const res = runInterpreter(code, 'java');
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(15);
  });

  it('14. Ternary operator', () => {
    const code = `
class Solution {
    public int min(int a, int b) {
        return a < b ? a : b;
    }
}
`;
    const res = runInterpreter(code, 'java', [14, 9]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(9);
  });

  it('15. Bubble sort in Java', () => {
    const code = `
class Solution {
    public int[] sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        return arr;
    }
}
`;
    const res = runInterpreter(code, 'java', [[5, 3, 1]]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toEqual([1, 3, 5]);
  });
});

describe('Phase 4 Acceptance: Binary Search Equivalence in C++, Java, and Python', () => {
  const testNums = [-1, 0, 3, 5, 9, 12];
  const target = 9;
  const expectedIndex = 4;

  it('C++ binary search produces correct index & trace', () => {
    const cppCode = `
#include <vector>
class Solution {
public:
    int search(std::vector<int>& nums, int target) {
        int left = 0;
        int right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
};
`;
    const res = runInterpreter(cppCode, 'cpp', [testNums, target]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(expectedIndex);
    expect(res.trace.length).toBeGreaterThan(5);

    // Verify pointer tracking on array
    const stepWithPointers = res.trace.find(
      (s) => s.structures.some((st) => 'left' in st.pointers && 'right' in st.pointers)
    );
    expect(stepWithPointers).toBeDefined();
  });

  it('Java binary search produces correct index & trace', () => {
    const javaCode = `
class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}
`;
    const res = runInterpreter(javaCode, 'java', [testNums, target]);
    expect(res.success).toBe(true);
    expect(res.returnValue).toBe(expectedIndex);
    expect(res.trace.length).toBeGreaterThan(5);

    // Verify pointer tracking on array
    const stepWithPointers = res.trace.find(
      (s) => s.structures.some((st) => 'left' in st.pointers && 'right' in st.pointers)
    );
    expect(stepWithPointers).toBeDefined();
  });
});

