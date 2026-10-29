export interface CatalogProblem {
  id: string;
  name: string;
  description: string;
  technique: string;
  timeComplexity: string;
  spaceComplexity: string;
  keywords: string[];
  signals?: string[];
  referenceSolution?: (...args: any[]) => any;
  defaultCases?: Array<{ label: string; args: any[] }>;
}

export const PROBLEM_CATALOG: CatalogProblem[] = [
  {
    id: 'two_sum',
    name: 'Two Sum',
    description: 'Find two indices in an array whose elements sum up to a specific target value.',
    technique: 'Hash Map Lookup / Two Pointers',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    keywords: ['twosum', 'two_sum', 'target', 'complement', 'pairsum'],
    signals: ['hashLookup', 'array1D'],
    referenceSolution: (nums: number[], target: number) => {
      const map = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp)!, i];
        map.set(nums[i], i);
      }
      return [];
    },
    defaultCases: [
      { label: 'Typical case', args: [[2, 7, 11, 15], 9] },
      { label: 'Pair at ends', args: [[3, 2, 4], 6] },
      { label: 'Duplicate elements', args: [[3, 3], 6] },
      { label: 'Negative numbers', args: [[-1, -2, -3, -4, -5], -8] },
      { label: 'No valid pair', args: [[1, 2, 3], 7] },
      { label: 'Larger array', args: [[10, 20, 30, 40, 50, 60, 70], 110] }
    ]
  },
  {
    id: 'valid_parentheses',
    name: 'Valid Parentheses',
    description: 'Determine if an input string with brackets ({[]}) is syntactically valid and closed in correct order.',
    technique: 'Stack',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    keywords: ['isvalid', 'is_valid', 'parentheses', 'brackets', 'stack', 'isbalanced'],
    signals: ['stack', 'stringParam'],
    referenceSolution: (s: string) => {
      const stack: string[] = [];
      const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
      for (const ch of s) {
        if (ch in map) {
          if (stack.pop() !== map[ch]) return false;
        } else {
          stack.push(ch);
        }
      }
      return stack.length === 0;
    },
    defaultCases: [
      { label: 'Simple pair', args: ['()'] },
      { label: 'Multiple nested', args: ['()[]{}'] },
      { label: 'Mismatched types', args: ['(]'] },
      { label: 'Interleaved invalid', args: ['([)]'] },
      { label: 'Deep valid nesting', args: ['{[]({[]})}'] },
      { label: 'Single bracket', args: ['['] },
      { label: 'Empty string', args: [''] }
    ]
  },
  {
    id: 'binary_search',
    name: 'Binary Search',
    description: 'Find the target value within a sorted array in logarithmic time by repeatedly dividing search space in half.',
    technique: 'Divide & Conquer / Binary Search',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    keywords: ['binarysearch', 'binary_search', 'search', 'bisect'],
    signals: ['binarySearchPattern', 'sortedArray'],
    referenceSolution: (nums: number[], target: number) => {
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
      }
      return -1;
    },
    defaultCases: [
      { label: 'Target in middle', args: [[-1, 0, 3, 5, 9, 12], 9] },
      { label: 'Target not found', args: [[-1, 0, 3, 5, 9, 12], 2] },
      { label: 'Single element found', args: [[5], 5] },
      { label: 'Single element missing', args: [[5], 1] },
      { label: 'Target at first index', args: [[1, 3, 5, 7, 9], 1] },
      { label: 'Target at last index', args: [[1, 3, 5, 7, 9], 9] },
      { label: 'Empty array', args: [[], 3] }
    ]
  },
  {
    id: 'reverse_linked_list',
    name: 'Reverse Linked List',
    description: 'Reverse a singly linked list in-place by reversing the direction of next pointers.',
    technique: 'Two Pointers / In-place Pointer Manipulation',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['reverselist', 'reverse_list', 'reverselinkedlist', 'reverse'],
    signals: ['linkedList'],
    defaultCases: [
      { label: 'Standard 5 nodes', args: [[1, 2, 3, 4, 5]] },
      { label: 'Two nodes', args: [[1, 2]] },
      { label: 'Single node', args: [[1]] },
      { label: 'Empty list', args: [[]] }
    ]
  },
  {
    id: 'merge_two_sorted_lists',
    name: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists into one sorted list by splicing existing nodes together.',
    technique: 'Two Pointers / Linked List',
    timeComplexity: 'O(N + M)',
    spaceComplexity: 'O(1)',
    keywords: ['mergetwolists', 'merge_two_lists', 'mergelists'],
    signals: ['linkedList']
  },
  {
    id: 'maximum_subarray',
    name: 'Maximum Subarray',
    description: "Find the contiguous subarray with the largest sum using Kadane's algorithm.",
    technique: "Dynamic Programming / Kadane's Algorithm",
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['maxsubarray', 'max_sub_array', 'kadane', 'maximumsubarray'],
    signals: ['array1D', 'singleLoop'],
    referenceSolution: (nums: number[]) => {
      let maxSoFar = nums[0];
      let curr = nums[0];
      for (let i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        maxSoFar = Math.max(maxSoFar, curr);
      }
      return maxSoFar;
    },
    defaultCases: [
      { label: 'Mixed signs', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]] },
      { label: 'Single element', args: [[1]] },
      { label: 'All positive', args: [[5, 4, 1, 7, 8]] },
      { label: 'All negative', args: [[-5, -3, -1, -4]] }
    ]
  },
  {
    id: 'best_time_stock',
    name: 'Best Time to Buy and Sell Stock',
    description: 'Maximize profit by choosing a single day to buy and a later day to sell a stock.',
    technique: 'Sliding Window / Greedy',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['maxprofit', 'max_profit', 'buystock', 'stock'],
    signals: ['array1D'],
    referenceSolution: (prices: number[]) => {
      let minP = Infinity, maxP = 0;
      for (const p of prices) {
        if (p < minP) minP = p;
        else if (p - minP > maxP) maxP = p - minP;
      }
      return maxP;
    },
    defaultCases: [
      { label: 'Standard profitable', args: [[7, 1, 5, 3, 6, 4]] },
      { label: 'Strictly decreasing', args: [[7, 6, 4, 3, 1]] },
      { label: 'Flat prices', args: [[3, 3, 3, 3]] },
      { label: 'Peak at end', args: [[1, 2, 4, 8, 16]] }
    ]
  },
  {
    id: 'valid_anagram',
    name: 'Valid Anagram',
    description: 'Check if two strings are anagrams by comparing character frequencies.',
    technique: 'Hash Map / Frequency Counting',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['isanagram', 'is_anagram', 'anagram'],
    signals: ['stringParam'],
    referenceSolution: (s: string, t: string) => {
      if (s.length !== t.length) return false;
      const counts: Record<string, number> = {};
      for (const c of s) counts[c] = (counts[c] || 0) + 1;
      for (const c of t) {
        if (!counts[c]) return false;
        counts[c]--;
      }
      return true;
    },
    defaultCases: [
      { label: 'Valid anagram', args: ['anagram', 'nagaram'] },
      { label: 'Different characters', args: ['rat', 'car'] },
      { label: 'Different lengths', args: ['a', 'ab'] },
      { label: 'Empty strings', args: ['', ''] }
    ]
  },
  {
    id: 'valid_palindrome',
    name: 'Valid Palindrome',
    description: 'Check if a string reads the same forwards and backwards ignoring non-alphanumeric chars.',
    technique: 'Two Pointers',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['ispalindrome', 'is_palindrome', 'palindrome'],
    signals: ['twoPointers', 'stringParam'],
    referenceSolution: (s: string) => {
      const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      let l = 0, r = clean.length - 1;
      while (l < r) {
        if (clean[l] !== clean[r]) return false;
        l++;
        r--;
      }
      return true;
    },
    defaultCases: [
      { label: 'Sentence palindrome', args: ['A man, a plan, a canal: Panama'] },
      { label: 'Non-palindrome', args: ['race a car'] },
      { label: 'Single space', args: [' '] },
      { label: 'Exact palindrome', args: ['racecar'] }
    ]
  },
  {
    id: 'climbing_stairs',
    name: 'Climbing Stairs',
    description: 'Calculate distinct ways to climb n stairs taking 1 or 2 steps at each stride.',
    technique: 'Dynamic Programming (Fibonacci)',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['climbstairs', 'climb_stairs', 'climbingstairs', 'stairs'],
    signals: ['fibonacciDP'],
    referenceSolution: (n: number) => {
      if (n <= 2) return n;
      let a = 1, b = 2;
      for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
      }
      return b;
    },
    defaultCases: [
      { label: '2 steps', args: [2] },
      { label: '3 steps', args: [3] },
      { label: '5 steps', args: [5] },
      { label: '10 steps', args: [10] }
    ]
  },
  {
    id: 'fibonacci_number',
    name: 'Fibonacci Number',
    description: 'Compute the N-th Fibonacci number where F(n) = F(n-1) + F(n-2).',
    technique: 'Dynamic Programming / Recursion',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['fib', 'fibonacci'],
    signals: ['recursionOrLoop'],
    referenceSolution: (n: number) => {
      if (n <= 1) return n;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
      }
      return b;
    },
    defaultCases: [
      { label: 'n = 0', args: [0] },
      { label: 'n = 1', args: [1] },
      { label: 'n = 4', args: [4] },
      { label: 'n = 8', args: [8] }
    ]
  },
  {
    id: 'bubble_sort',
    name: 'Bubble Sort',
    description: 'Repeatedly swap adjacent out-of-order elements until the collection is completely sorted.',
    technique: 'Sorting / Nested Loops',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(1)',
    keywords: ['bubblesort', 'bubble_sort', 'bubblesort'],
    signals: ['nestedLoops', 'swapping'],
    referenceSolution: (arr: number[]) => {
      const a = [...arr];
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length - i - 1; j++) {
          if (a[j] > a[j + 1]) {
            const t = a[j];
            a[j] = a[j + 1];
            a[j + 1] = t;
          }
        }
      }
      return a;
    },
    defaultCases: [
      { label: 'Unsorted array', args: [[5, 2, 8, 1, 9]] },
      { label: 'Already sorted', args: [[1, 2, 3, 4, 5]] },
      { label: 'Reverse sorted', args: [[5, 4, 3, 2, 1]] },
      { label: 'All elements equal', args: [[7, 7, 7, 7]] },
      { label: 'Single element', args: [[42]] },
      { label: 'Empty array', args: [[]] }
    ]
  },
  {
    id: 'merge_intervals',
    name: 'Merge Intervals',
    description: 'Merge all overlapping intervals and return an array of non-overlapping intervals.',
    technique: 'Sorting / Greedy',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    keywords: ['mergeintervals', 'merge_intervals', 'intervals'],
    signals: ['matrix2D', 'sorting']
  },
  {
    id: '3sum',
    name: '3Sum',
    description: 'Find all unique triplets in the array [nums[i], nums[j], nums[k]] which sum to zero.',
    technique: 'Sorting + Two Pointers',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(N)',
    keywords: ['threesum', 'three_sum', '3sum'],
    signals: ['nestedLoops', 'twoPointers']
  },
  {
    id: 'container_with_most_water',
    name: 'Container With Most Water',
    description: 'Find two vertical lines that together with the x-axis form a container holding the maximum water.',
    technique: 'Two Pointers (Greedy)',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['maxarea', 'max_area', 'container', 'water'],
    signals: ['twoPointers']
  },
  {
    id: 'longest_substring_without_repeating',
    name: 'Longest Substring Without Repeating Characters',
    description: 'Find the length of the longest substring containing unique characters.',
    technique: 'Sliding Window + Hash Set/Map',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(min(N, M))',
    keywords: ['lengthoflongestsubstring', 'longest_substring', 'substring'],
    signals: ['slidingWindow', 'hashLookup']
  },
  {
    id: 'trapping_rain_water',
    name: 'Trapping Rain Water',
    description: 'Compute how much water can be trapped after raining given an elevation map.',
    technique: 'Two Pointers / Monotonic Stack',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['trap', 'trapping_rain_water', 'rainwater'],
    signals: ['twoPointers']
  },
  {
    id: 'invert_binary_tree',
    name: 'Invert Binary Tree',
    description: 'Invert a binary tree by recursively swapping left and right child nodes.',
    technique: 'Tree / DFS Recursion',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    keywords: ['inverttree', 'invert_tree', 'invertbinarytree'],
    signals: ['tree']
  },
  {
    id: 'maximum_depth_of_binary_tree',
    name: 'Maximum Depth of Binary Tree',
    description: 'Find the number of nodes along the longest path from root to leaf node.',
    technique: 'Tree / DFS / BFS',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    keywords: ['maxdepth', 'max_depth', 'depth'],
    signals: ['tree']
  },
  {
    id: 'same_tree',
    name: 'Same Tree',
    description: 'Check if two binary trees are structurally identical and nodes have the same value.',
    technique: 'Tree / DFS Recursion',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    keywords: ['issametree', 'is_same_tree', 'sametree'],
    signals: ['tree']
  },
  {
    id: 'symmetric_tree',
    name: 'Symmetric Tree',
    description: 'Check whether a binary tree is a mirror image of itself around its center.',
    technique: 'Tree / Recursion',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    keywords: ['issymmetric', 'is_symmetric', 'symmetric'],
    signals: ['tree']
  },
  {
    id: 'level_order_traversal',
    name: 'Binary Tree Level Order Traversal',
    description: 'Return level-by-level node values from left to right using a queue.',
    technique: 'Breadth-First Search (Queue)',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    keywords: ['levelorder', 'level_order', 'bfs_tree'],
    signals: ['tree', 'queue']
  },
  {
    id: 'linked_list_cycle',
    name: 'Linked List Cycle',
    description: "Determine if a linked list has a cycle using Floyd's Tortoise and Hare pointers.",
    technique: "Fast & Slow Pointers (Floyd's Algorithm)",
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['hascycle', 'has_cycle', 'detectcycle', 'linkedlistcycle'],
    signals: ['linkedList', 'twoPointers']
  },
  {
    id: 'middle_of_linked_list',
    name: 'Middle of the Linked List',
    description: 'Return the middle node of a singly linked list using fast and slow pointers.',
    technique: 'Fast & Slow Pointers',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['middlenode', 'middle_node', 'findmiddle'],
    signals: ['linkedList', 'twoPointers']
  },
  {
    id: 'coin_change',
    name: 'Coin Change',
    description: 'Find the fewest number of coins needed to make up a given amount.',
    technique: 'Dynamic Programming (Bottom-Up)',
    timeComplexity: 'O(Amount * Coins)',
    spaceComplexity: 'O(Amount)',
    keywords: ['coinchange', 'coin_change', 'fewestcoins'],
    signals: ['nestedLoops']
  },
  {
    id: 'house_robber',
    name: 'House Robber',
    description: 'Determine the maximum money you can rob tonight without alerting police at adjacent houses.',
    technique: 'Dynamic Programming',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    keywords: ['rob', 'houserobber', 'house_robber'],
    signals: ['array1D', 'fibonacciDP']
  },
  {
    id: 'group_anagrams',
    name: 'Group Anagrams',
    description: 'Group an array of strings into sub-lists of anagrams.',
    technique: 'Hash Map (Sorted String / Char Count Key)',
    timeComplexity: 'O(N * K log K)',
    spaceComplexity: 'O(N * K)',
    keywords: ['groupanagrams', 'group_anagrams'],
    signals: ['hashLookup']
  },
  {
    id: 'top_k_frequent',
    name: 'Top K Frequent Elements',
    description: 'Return the k most frequent elements in an array using a frequency map or bucket sort.',
    technique: 'Hash Map + Bucket Sort / Min Heap',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    keywords: ['topkfrequent', 'top_k_frequent'],
    signals: ['hashLookup']
  },
  {
    id: 'daily_temperatures',
    name: 'Daily Temperatures',
    description: 'Find how many days you would have to wait until a warmer temperature occurs.',
    technique: 'Monotonic Decreasing Stack',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    keywords: ['dailytemperatures', 'daily_temperatures'],
    signals: ['stack', 'array1D']
  },
  {
    id: 'number_of_islands',
    name: 'Number of Islands',
    description: 'Count the number of connected components of land ("1") surrounded by water ("0") in a 2D grid.',
    technique: 'Breadth-First Search / Depth-First Search on 2D Grid',
    timeComplexity: 'O(M * N)',
    spaceComplexity: 'O(M * N)',
    keywords: ['numislands', 'num_islands', 'islands'],
    signals: ['matrix2D', 'recursion']
  },
  {
    id: 'insertion_sort',
    name: 'Insertion Sort',
    description: 'Build the sorted array one element at a time by shifting larger elements to the right.',
    technique: 'Sorting / In-place Shifting',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(1)',
    keywords: ['insertionsort', 'insertion_sort'],
    signals: ['nestedLoops']
  },
  {
    id: 'selection_sort',
    name: 'Selection Sort',
    description: 'Repeatedly find the minimum element from the unsorted part and put it at the beginning.',
    technique: 'Sorting / Minimum Selection',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(1)',
    keywords: ['selectionsort', 'selection_sort'],
    signals: ['nestedLoops']
  },
  {
    id: 'quick_sort',
    name: 'Quick Sort',
    description: 'Sort an array using divide-and-conquer partitioning around a selected pivot element.',
    technique: 'Divide & Conquer (Partitioning)',
    timeComplexity: 'O(N log N) avg',
    spaceComplexity: 'O(log N)',
    keywords: ['quicksort', 'quick_sort', 'partition'],
    signals: ['recursion', 'array1D']
  },
  {
    id: 'merge_sort',
    name: 'Merge Sort',
    description: 'Recursively divide array into halves, sort each half, and merge the sorted halves.',
    technique: 'Divide & Conquer / Merge',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    keywords: ['mergesort', 'merge_sort'],
    signals: ['recursion', 'array1D']
  },
  {
    id: 'search_rotated_sorted_array',
    name: 'Search in Rotated Sorted Array',
    description: 'Find target in a sorted array that was rotated at an unknown pivot index in O(log N).',
    technique: 'Modified Binary Search',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    keywords: ['searchrotated', 'search_rotated'],
    signals: ['binarySearchPattern']
  },
  {
    id: 'find_min_rotated_sorted_array',
    name: 'Find Minimum in Rotated Sorted Array',
    description: 'Find the minimum element in an array sorted in ascending order and rotated.',
    technique: 'Modified Binary Search',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    keywords: ['findmin', 'find_min'],
    signals: ['binarySearchPattern']
  },
  {
    id: 'subsets',
    name: 'Subsets (Power Set)',
    description: 'Return all possible subsets (the power set) of a collection of unique integers.',
    technique: 'Backtracking / Bit Manipulation',
    timeComplexity: 'O(2^N)',
    spaceComplexity: 'O(N)',
    keywords: ['subsets', 'powerset'],
    signals: ['recursion']
  },
  {
    id: 'permutations',
    name: 'Permutations',
    description: 'Return all possible permutations of an array of distinct integers.',
    technique: 'Backtracking',
    timeComplexity: 'O(N!)',
    spaceComplexity: 'O(N)',
    keywords: ['permute', 'permutations'],
    signals: ['recursion']
  },
  {
    id: 'combination_sum',
    name: 'Combination Sum',
    description: 'Find all unique combinations of candidates where candidate numbers sum to target.',
    technique: 'Backtracking',
    timeComplexity: 'O(2^Target)',
    spaceComplexity: 'O(Target)',
    keywords: ['combinationsum', 'combination_sum'],
    signals: ['recursion']
  },
  {
    id: 'word_search',
    name: 'Word Search',
    description: 'Check if a word exists in a 2D grid of characters constructed from sequentially adjacent cells.',
    technique: 'DFS / Backtracking on 2D Grid',
    timeComplexity: 'O(M * N * 3^L)',
    spaceComplexity: 'O(L)',
    keywords: ['exist', 'wordsearch', 'word_search'],
    signals: ['matrix2D', 'recursion']
  },
  {
    id: 'kth_largest_element',
    name: 'Kth Largest Element in an Array',
    description: 'Find the k-th largest element in an unsorted array without sorting the entire array.',
    technique: 'Quickselect / Min-Heap',
    timeComplexity: 'O(N) avg',
    spaceComplexity: 'O(1) or O(K)',
    keywords: ['findkthlargest', 'find_kth_largest', 'kthlargest'],
    signals: ['array1D']
  },
  {
    id: 'lru_cache',
    name: 'LRU Cache',
    description: 'Design a data structure that implements the Least Recently Used (LRU) cache eviction policy in O(1).',
    technique: 'Doubly Linked List + Hash Map',
    timeComplexity: 'O(1) get & put',
    spaceComplexity: 'O(Capacity)',
    keywords: ['lrucache', 'lru_cache', 'get', 'put'],
    signals: ['hashLookup', 'linkedList']
  },
  {
    id: 'implement_trie',
    name: 'Implement Trie (Prefix Tree)',
    description: 'Implement a prefix tree with insert, search, and startsWith operations.',
    technique: 'Tree / Prefix Trie',
    timeComplexity: 'O(L) per word',
    spaceComplexity: 'O(Total Characters)',
    keywords: ['trie', 'insert', 'startswith'],
    signals: ['tree']
  },
  {
    id: 'rotate_image',
    name: 'Rotate Image (Matrix 90°)',
    description: 'Rotate an N x N 2D matrix by 90 degrees clockwise in-place.',
    technique: 'Matrix Transpose & Reverse Rows',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(1)',
    keywords: ['rotate', 'rotateimage', 'rotate_image'],
    signals: ['matrix2D', 'nestedLoops']
  },
  {
    id: 'spiral_matrix',
    name: 'Spiral Matrix',
    description: 'Return all elements of an M x N matrix in clockwise spiral order.',
    technique: 'Matrix Traversal / Boundary Simulation',
    timeComplexity: 'O(M * N)',
    spaceComplexity: 'O(1)',
    keywords: ['spiralorder', 'spiral_order', 'spiralmatrix'],
    signals: ['matrix2D']
  }
];

