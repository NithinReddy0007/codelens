import { SupportedLanguage } from '../types/trace';

export interface CodeExample {
  id: string;
  title: string;
  language: SupportedLanguage;
  code: string;
}

export const EXAMPLES: CodeExample[] = [
  // 1. Bubble Sort
  {
    id: 'bubble_sort_py',
    title: 'Bubble Sort',
    language: 'python',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

nums = [5, 2, 8, 1, 9]
print("Starting:", nums)
sorted_nums = bubble_sort(nums)
print("Sorted:", sorted_nums)
`
  },
  {
    id: 'bubble_sort_cpp',
    title: 'Bubble Sort',
    language: 'cpp',
    code: `#include <iostream>
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
    std::vector<int> nums = {5, 2, 8, 1, 9};
    bubbleSort(nums);
    return nums[0];
}
`
  },
  {
    id: 'bubble_sort_java',
    title: 'Bubble Sort',
    language: 'java',
    code: `class Solution {
    public int[] bubbleSort(int[] arr) {
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
`
  },

  // 2. Binary Search
  {
    id: 'binary_search_py',
    title: 'Binary Search',
    language: 'python',
    code: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

arr = [1, 3, 5, 7, 9, 11, 15]
target = 7
res = binary_search(arr, target)
print("Found target at:", res)
`
  },
  {
    id: 'binary_search_cpp',
    title: 'Binary Search',
    language: 'cpp',
    code: `#include <vector>

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
`
  },
  {
    id: 'binary_search_java',
    title: 'Binary Search',
    language: 'java',
    code: `class Solution {
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
`
  },

  // 3. Two Sum
  {
    id: 'two_sum_py',
    title: 'Two Sum',
    language: 'python',
    code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
`
  },
  {
    id: 'two_sum_cpp',
    title: 'Two Sum',
    language: 'cpp',
    code: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (seen.count(diff)) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`
  },
  {
    id: 'two_sum_java',
    title: 'Two Sum',
    language: 'java',
    code: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) {
                return new int[] { seen.get(diff), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
`
  },

  // 4. Reverse Linked List
  {
    id: 'reverse_list_py',
    title: 'Reverse Linked List',
    language: 'python',
    code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

head = ListNode(1, ListNode(2, ListNode(3, ListNode(4))))
reversed_head = reverse_list(head)
`
  },
  {
    id: 'reverse_list_cpp',
    title: 'Reverse Linked List',
    language: 'cpp',
    code: `struct ListNode {
    int val;
    ListNode* next;
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = null;
        ListNode* curr = head;
        while (curr != null) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};
`
  },

  // 5. Valid Parentheses
  {
    id: 'valid_parentheses_py',
    title: 'Valid Parentheses',
    language: 'python',
    code: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return len(stack) == 0
`
  },

  // 6. Maximum Subarray (Kadane's)
  {
    id: 'max_subarray_py',
    title: 'Maximum Subarray',
    language: 'python',
    code: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        max_so_far = nums[0]
        curr_sum = nums[0]
        for i in range(1, len(nums)):
            curr_sum = max(nums[i], curr_sum + nums[i])
            max_so_far = max(max_so_far, curr_sum)
        return max_so_far
`
  },
  {
    id: 'max_subarray_java',
    title: 'Maximum Subarray',
    language: 'java',
    code: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int curr = nums[0];
        for (int i = 1; i < nums.length; i++) {
            curr = Math.max(nums[i], curr + nums[i]);
            maxSoFar = Math.max(maxSoFar, curr);
        }
        return maxSoFar;
    }
}
`
  },

  // 7. Climbing Stairs
  {
    id: 'climb_stairs_py',
    title: 'Climbing Stairs',
    language: 'python',
    code: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for i in range(3, n + 1):
            a, b = b, a + b
        return b
`
  }
];
