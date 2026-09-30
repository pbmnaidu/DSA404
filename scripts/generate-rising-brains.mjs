import fs from 'fs';
import { makeProblem } from './sheet-helpers.mjs';
import { exportToExcel } from './excel-helper.mjs';

console.log("Generating RisingBrains DSA Sheet...");

const risingBrainsRaw = [
  // Pattern 1: Sliding Window & Two Pointers
  ["Two Sum", "Easy", "LeetCode", "two-sum", "Two Pointers & Arrays", "Complement Lookup", "Level 1"],
  ["Two Sum II - Input Array Is Sorted", "Medium", "LeetCode", "two-sum-ii-input-array-is-sorted", "Two Pointers & Arrays", "Opposite Pointers", "Level 2"],
  ["3Sum", "Medium", "LeetCode", "3sum", "Two Pointers & Arrays", "Sort + Two Pointers", "Level 2"],
  ["4Sum", "Medium", "LeetCode", "4sum", "Two Pointers & Arrays", "K-Sum Generalization", "Level 2"],
  ["Container With Most Water", "Medium", "LeetCode", "container-with-most-water", "Two Pointers & Arrays", "Greedy Height Shrink", "Level 2"],
  ["Trapping Rain Water", "Hard", "LeetCode", "trapping-rain-water", "Two Pointers & Arrays", "Two Pointers Water Bounds", "Level 3"],
  ["Sort Colors (Dutch National Flag)", "Medium", "LeetCode", "sort-colors", "Two Pointers & Arrays", "3-Way Partition", "Level 2"],
  ["Move Zeroes", "Easy", "LeetCode", "move-zeroes", "Two Pointers & Arrays", "In-place Pointer Shift", "Level 1"],
  ["Remove Duplicates from Sorted Array", "Easy", "LeetCode", "remove-duplicates-from-sorted-array", "Two Pointers & Arrays", "Slow & Fast Pointer", "Level 1"],
  ["Longest Substring Without Repeating Characters", "Medium", "LeetCode", "longest-substring-without-repeating-characters", "Sliding Window", "Dynamic Set Window", "Level 2"],
  ["Longest Repeating Character Replacement", "Medium", "LeetCode", "longest-repeating-character-replacement", "Sliding Window", "Max Frequency Tracker", "Level 2"],
  ["Minimum Window Substring", "Hard", "LeetCode", "minimum-window-substring", "Sliding Window", "Subsegment Frequency Shrink", "Level 3"],
  ["Permutation in String", "Medium", "LeetCode", "permutation-in-string", "Sliding Window", "Fixed Window Hash", "Level 2"],
  ["Sliding Window Maximum", "Hard", "LeetCode", "sliding-window-maximum", "Sliding Window", "Monotonic Deque", "Level 3"],
  ["Subarray Product Less Than K", "Medium", "LeetCode", "subarray-product-less-than-k", "Sliding Window", "Two Pointer Product", "Level 2"],

  // Pattern 2: Fast & Slow Pointers (LinkedList)
  ["Linked List Cycle", "Easy", "LeetCode", "linked-list-cycle", "Fast & Slow Pointers", "Floyd Loop Detection", "Level 1"],
  ["Linked List Cycle II", "Medium", "LeetCode", "linked-list-cycle-ii", "Fast & Slow Pointers", "Cycle Entrance", "Level 2"],
  ["Middle of the Linked List", "Easy", "LeetCode", "middle-of-the-linked-list", "Fast & Slow Pointers", "Hare & Tortoise", "Level 1"],
  ["Palindrome Linked List", "Easy", "LeetCode", "palindrome-linked-list", "Fast & Slow Pointers", "Mid Reversal", "Level 1"],
  ["Reorder List", "Medium", "LeetCode", "reorder-list", "Fast & Slow Pointers", "Split, Reverse & Merge", "Level 2"],
  ["Remove Nth Node From End of List", "Medium", "LeetCode", "remove-nth-node-from-end-of-list", "Fast & Slow Pointers", "Fixed Gap Pointers", "Level 2"],
  ["Reverse Linked List", "Easy", "LeetCode", "reverse-linked-list", "Fast & Slow Pointers", "Iterative Inversion", "Level 1"],
  ["Reverse Nodes in k-Group", "Hard", "LeetCode", "reverse-nodes-in-k-group", "Fast & Slow Pointers", "K-Node Subsegment Swap", "Level 3"],
  ["LRU Cache", "Medium", "LeetCode", "lru-cache", "Fast & Slow Pointers", "Hash Map + Doubly Linked List", "Level 2"],
  ["LFU Cache", "Hard", "LeetCode", "lfu-cache", "Fast & Slow Pointers", "Frequency Buckets + DLL", "Level 3"],

  // Pattern 3: Binary Search Mastery
  ["Binary Search", "Easy", "LeetCode", "binary-search", "Binary Search Mastery", "Classic Halving", "Level 1"],
  ["Search a 2D Matrix", "Medium", "LeetCode", "search-a-2d-matrix", "Binary Search Mastery", "Flattened Index BS", "Level 2"],
  ["Search in Rotated Sorted Array", "Medium", "LeetCode", "search-in-rotated-sorted-array", "Binary Search Mastery", "Sorted Half Determination", "Level 2"],
  ["Find Minimum in Rotated Sorted Array", "Medium", "LeetCode", "find-minimum-in-rotated-sorted-array", "Binary Search Mastery", "Inflection Pivot", "Level 2"],
  ["Find Peak Element", "Medium", "LeetCode", "find-peak-element", "Binary Search Mastery", "Slope Gradient BS", "Level 2"],
  ["Koko Eating Bananas", "Medium", "LeetCode", "koko-eating-bananas", "Binary Search Mastery", "BS on Monotonic Answer", "Level 2"],
  ["Capacity To Ship Packages Within D Days", "Medium", "LeetCode", "capacity-to-ship-packages-within-d-days", "Binary Search Mastery", "Greedy Verification BS", "Level 2"],
  ["Median of Two Sorted Arrays", "Hard", "LeetCode", "median-of-two-sorted-arrays", "Binary Search Mastery", "Partitioning Binary Search", "Level 3"],
  ["Split Array Largest Sum", "Hard", "LeetCode", "split-array-largest-sum", "Binary Search Mastery", "Binary Search on Answer", "Level 3"],

  // Pattern 4: Monotonic Stack & Queues
  ["Daily Temperatures", "Medium", "LeetCode", "daily-temperatures", "Monotonic Stack", "Decreasing Stack", "Level 2"],
  ["Next Greater Element I", "Easy", "LeetCode", "next-greater-element-i", "Monotonic Stack", "Hash Map + Stack", "Level 1"],
  ["Next Greater Element II", "Medium", "LeetCode", "next-greater-element-ii", "Monotonic Stack", "Circular Array Stack", "Level 2"],
  ["Largest Rectangle in Histogram", "Hard", "LeetCode", "largest-rectangle-in-histogram", "Monotonic Stack", "Width Expansion Stack", "Level 3"],
  ["Maximal Rectangle", "Hard", "LeetCode", "maximal-rectangle", "Monotonic Stack", "Row-wise Histogram DP", "Level 3"],
  ["Min Stack", "Medium", "LeetCode", "min-stack", "Monotonic Stack", "Auxiliary Min Stack", "Level 2"],
  ["Evaluate Reverse Polish Notation", "Medium", "LeetCode", "evaluate-reverse-polish-notation", "Monotonic Stack", "Postfix Stack", "Level 2"],
  ["Online Stock Span", "Medium", "LeetCode", "online-stock-span", "Monotonic Stack", "Weighted Stack Accumulation", "Level 2"],

  // Pattern 5: Tree Traversals & Recursion
  ["Maximum Depth of Binary Tree", "Easy", "LeetCode", "maximum-depth-of-binary-tree", "Tree Traversals & Recursion", "DFS Depth", "Level 1"],
  ["Diameter of Binary Tree", "Easy", "LeetCode", "diameter-of-binary-tree", "Tree Traversals & Recursion", "Postorder Branch Sum", "Level 1"],
  ["Balanced Binary Tree", "Easy", "LeetCode", "balanced-binary-tree", "Tree Traversals & Recursion", "Height Difference Check", "Level 1"],
  ["Binary Tree Level Order Traversal", "Medium", "LeetCode", "binary-tree-level-order-traversal", "Tree Traversals & Recursion", "Queue BFS", "Level 2"],
  ["Binary Tree Zigzag Level Order Traversal", "Medium", "LeetCode", "binary-tree-zigzag-level-order-traversal", "Tree Traversals & Recursion", "Alternating Deque", "Level 2"],
  ["Lowest Common Ancestor of a Binary Tree", "Medium", "LeetCode", "lowest-common-ancestor-of-a-binary-tree", "Tree Traversals & Recursion", "Branch Divergence DFS", "Level 2"],
  ["Binary Tree Maximum Path Sum", "Hard", "LeetCode", "binary-tree-maximum-path-sum", "Tree Traversals & Recursion", "Branch Gain Aggregation", "Level 3"],
  ["Serialize and Deserialize Binary Tree", "Hard", "LeetCode", "serialize-and-deserialize-binary-tree", "Tree Traversals & Recursion", "Preorder Serialization", "Level 3"],
  ["Construct Binary Tree from Preorder and Inorder Traversal", "Medium", "LeetCode", "construct-binary-tree-from-preorder-and-inorder-traversal", "Tree Traversals & Recursion", "Divide & Conquer Index Map", "Level 2"],

  // Pattern 6: Binary Search Trees
  ["Validate Binary Search Tree", "Medium", "LeetCode", "validate-binary-search-tree", "Binary Search Trees", "Min-Max Bound Checks", "Level 2"],
  ["Kth Smallest Element in a BST", "Medium", "LeetCode", "kth-smallest-element-in-a-bst", "Binary Search Trees", "Inorder Traversal Counter", "Level 2"],
  ["Lowest Common Ancestor of a BST", "Medium", "LeetCode", "lowest-common-ancestor-of-a-binary-search-tree", "Binary Search Trees", "BST Range Splitting", "Level 2"],
  ["Convert Sorted Array to Binary Search Tree", "Easy", "LeetCode", "convert-sorted-array-to-binary-search-tree", "Binary Search Trees", "Median Partition", "Level 1"],
  ["Delete Node in a BST", "Medium", "LeetCode", "delete-node-in-a-bst", "Binary Search Trees", "Successor Replacement", "Level 2"],

  // Pattern 7: Heaps & Priority Queues
  ["Kth Largest Element in an Array", "Medium", "LeetCode", "kth-largest-element-in-an-array", "Heaps & Priority Queues", "Min-Heap / Quickselect", "Level 2"],
  ["Top K Frequent Elements", "Medium", "LeetCode", "top-k-frequent-elements", "Heaps & Priority Queues", "Bucket Sort / Min-Heap", "Level 2"],
  ["Find Median from Data Stream", "Hard", "LeetCode", "find-median-from-data-stream", "Heaps & Priority Queues", "Two Heaps Balance", "Level 3"],
  ["Merge k Sorted Lists", "Hard", "LeetCode", "merge-k-sorted-lists", "Heaps & Priority Queues", "K-Way Merge Heap", "Level 3"],
  ["Task Scheduler", "Medium", "LeetCode", "task-scheduler", "Heaps & Priority Queues", "Max-Heap + Cooldown Queue", "Level 2"],

  // Pattern 8: Graphs & Disjoint Set Union
  ["Number of Islands", "Medium", "LeetCode", "number-of-islands", "Graphs & DSU", "Connected Component DFS", "Level 2"],
  ["Max Area of Island", "Medium", "LeetCode", "max-area-of-island", "Graphs & DSU", "Flood Fill Area Accumulator", "Level 2"],
  ["Clone Graph", "Medium", "LeetCode", "clone-graph", "Graphs & DSU", "HashMap Cloned Node DFS", "Level 2"],
  ["Rotting Oranges", "Medium", "LeetCode", "rotting-oranges", "Graphs & DSU", "Multi-Source BFS", "Level 2"],
  ["Course Schedule", "Medium", "LeetCode", "course-schedule", "Graphs & DSU", "Topological Sort / Cycle Detection", "Level 2"],
  ["Course Schedule II", "Medium", "LeetCode", "course-schedule-ii", "Graphs & DSU", "Kahn's Algorithm Order", "Level 2"],
  ["Pacific Atlantic Water Flow", "Medium", "LeetCode", "pacific-atlantic-water-flow", "Graphs & DSU", "Reverse Ocean BFS", "Level 2"],
  ["Word Ladder", "Hard", "LeetCode", "word-ladder", "Graphs & DSU", "Shortest Path BFS", "Level 3"],
  ["Redundant Connection", "Medium", "LeetCode", "redundant-connection", "Graphs & DSU", "Union-Find Cycle Detection", "Level 2"],
  ["Network Delay Time", "Medium", "LeetCode", "network-delay-time", "Graphs & DSU", "Dijkstra's Algorithm", "Level 2"],
  ["Cheapest Flights Within K Stops", "Medium", "LeetCode", "cheapest-flights-within-k-stops", "Graphs & DSU", "Bellman-Ford / Priority Queue", "Level 2"],

  // Pattern 9: Dynamic Programming (1D & 2D)
  ["Climbing Stairs", "Easy", "LeetCode", "climbing-stairs", "Dynamic Programming", "Fibonacci Transition", "Level 1"],
  ["House Robber", "Medium", "LeetCode", "house-robber", "Dynamic Programming", "Pick / Exclude 1D", "Level 2"],
  ["House Robber II", "Medium", "LeetCode", "house-robber-ii", "Dynamic Programming", "Circular Subproblem Split", "Level 2"],
  ["Coin Change", "Medium", "LeetCode", "coin-change", "Dynamic Programming", "Unbounded Knapsack Min", "Level 2"],
  ["Longest Increasing Subsequence", "Medium", "LeetCode", "longest-increasing-subsequence", "Dynamic Programming", "Binary Search Patience Sort", "Level 2"],
  ["Partition Equal Subset Sum", "Medium", "LeetCode", "partition-equal-subset-sum", "Dynamic Programming", "0/1 Knapsack Boolean", "Level 2"],
  ["Word Break", "Medium", "LeetCode", "word-break", "Dynamic Programming", "Prefix Subproblem Matching", "Level 2"],
  ["Unique Paths", "Medium", "LeetCode", "unique-paths", "Dynamic Programming", "Grid Dynamic Programming", "Level 2"],
  ["Longest Common Subsequence", "Medium", "LeetCode", "longest-common-subsequence", "Dynamic Programming", "2D String Grid", "Level 2"],
  ["Edit Distance", "Medium", "LeetCode", "edit-distance", "Dynamic Programming", "Transformation Cost Grid", "Level 2"],
  ["Best Time to Buy and Sell Stock with Cooldown", "Medium", "LeetCode", "best-time-to-buy-and-sell-stock-with-cooldown", "Dynamic Programming", "State Machine Transition", "Level 2"],
  ["Target Sum", "Medium", "LeetCode", "target-sum", "Dynamic Programming", "Subset Difference Reduction", "Level 2"],
  ["Burst Balloons", "Hard", "LeetCode", "burst-balloons", "Dynamic Programming", "Interval Dynamic Programming", "Level 3"],

  // Pattern 10: Backtracking
  ["Subsets", "Medium", "LeetCode", "subsets", "Backtracking", "Include / Exclude Choice", "Level 2"],
  ["Combination Sum", "Medium", "LeetCode", "combination-sum", "Backtracking", "Unbounded DFS Pick", "Level 2"],
  ["Permutations", "Medium", "LeetCode", "permutations", "Backtracking", "Visited Array Backtracking", "Level 2"],
  ["Word Search", "Medium", "LeetCode", "word-search", "Backtracking", "Grid Traversal DFS", "Level 2"],
  ["Palindrome Partitioning", "Medium", "LeetCode", "palindrome-partitioning", "Backtracking", "Prefix Palindrome Split", "Level 2"],
  ["N-Queens", "Hard", "LeetCode", "n-queens", "Backtracking", "Diagonal Constraint Pruning", "Level 3"],

  // Pattern 11: Intervals & Greedy
  ["Merge Intervals", "Medium", "LeetCode", "merge-intervals", "Intervals & Greedy", "Sorted Overlap Merge", "Level 2"],
  ["Insert Interval", "Medium", "LeetCode", "insert-interval", "Intervals & Greedy", "Left, Middle, Right Sweep", "Level 2"],
  ["Non-overlapping Intervals", "Medium", "LeetCode", "non-overlapping-intervals", "Intervals & Greedy", "Earliest End Time Greedy", "Level 2"],
  ["Meeting Rooms II", "Medium", "LeetCode", "meeting-rooms-ii", "Intervals & Greedy", "Min-Heap Chronological Allocation", "Level 2"],
  ["Jump Game", "Medium", "LeetCode", "jump-game", "Intervals & Greedy", "Farthest Reach Greedy", "Level 2"],
  ["Gas Station", "Medium", "LeetCode", "gas-station", "Intervals & Greedy", "Deficit Reset Greedy", "Level 2"]
];

const risingBrainsProblems = risingBrainsRaw.map((p, i) =>
  makeProblem(
    `RB-${String(i + 1).padStart(3, '0')}`,
    p[0],
    p[1],
    p[2],
    p[3],
    p[4],
    p[5],
    p[6] || "Level 2",
    "RisingBrains"
  )
);

console.log(`RisingBrains parsed: ${risingBrainsProblems.length} problems.`);

// Export RisingBrains Excel
exportToExcel(
  './public/sheets/RisingBrains_DSA_Sheet.xlsx',
  'RISINGBRAINS DSA SHEET — PRODUCT BASED COMPANY MASTERY',
  'Curated Problem Set for FAANG & Product Tech | Pattern-Based Curriculum',
  risingBrainsProblems
);

fs.writeFileSync('./scripts/data/rising_brains.json', JSON.stringify(risingBrainsProblems, null, 2));

console.log("RisingBrains Sheet ready.");
