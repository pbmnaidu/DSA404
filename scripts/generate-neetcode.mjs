import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { makeProblem } from './sheet-helpers.mjs';
import { exportToExcel } from './excel-helper.mjs';

console.log("Compiling curated DSA sheets...");

// -------------------------------------------------------------------------------------------------
// 1. NEETCODE 150
// -------------------------------------------------------------------------------------------------
const neetcodeRaw = [
  // Arrays & Hashing
  ["Contains Duplicate", "Easy", "LeetCode", "contains-duplicate", "Arrays & Hashing", "Hashing / Lookup"],
  ["Valid Anagram", "Easy", "LeetCode", "valid-anagram", "Arrays & Hashing", "Frequency Counting"],
  ["Two Sum", "Easy", "LeetCode", "two-sum", "Arrays & Hashing", "Hash Map Complement"],
  ["Group Anagrams", "Medium", "LeetCode", "group-anagrams", "Arrays & Hashing", "Categorized Hashing"],
  ["Top K Frequent Elements", "Medium", "LeetCode", "top-k-frequent-elements", "Arrays & Hashing", "Bucket Sort / Heap"],
  ["Product of Array Except Self", "Medium", "LeetCode", "product-of-array-except-self", "Arrays & Hashing", "Prefix & Suffix Products"],
  ["Valid Sudoku", "Medium", "LeetCode", "valid-sudoku", "Arrays & Hashing", "Matrix Hashing"],
  ["Encode and Decode Strings", "Medium", "LeetCode", "encode-and-decode-strings", "Arrays & Hashing", "Delimiter Encoding"],
  ["Longest Consecutive Sequence", "Medium", "LeetCode", "longest-consecutive-sequence", "Arrays & Hashing", "HashSet Sequence"],

  // Two Pointers
  ["Valid Palindrome", "Easy", "LeetCode", "valid-palindrome", "Two Pointers", "Inward Pointers"],
  ["Two Sum II - Input Array Is Sorted", "Medium", "LeetCode", "two-sum-ii-input-array-is-sorted", "Two Pointers", "Opposite Ends Search"],
  ["3Sum", "Medium", "LeetCode", "3sum", "Two Pointers", "Sorted Triplet Enumeration"],
  ["Container With Most Water", "Medium", "LeetCode", "container-with-most-water", "Two Pointers", "Greedy Two Pointers"],
  ["Trapping Rain Water", "Hard", "LeetCode", "trapping-rain-water", "Two Pointers", "Max Boundary Pointers"],

  // Sliding Window
  ["Best Time to Buy and Sell Stock", "Easy", "LeetCode", "best-time-to-buy-and-sell-stock", "Sliding Window", "Minimum Tracker"],
  ["Longest Substring Without Repeating Characters", "Medium", "LeetCode", "longest-substring-without-repeating-characters", "Sliding Window", "Dynamic Window Set"],
  ["Longest Repeating Character Replacement", "Medium", "LeetCode", "longest-repeating-character-replacement", "Sliding Window", "Frequency Window"],
  ["Permutation in String", "Medium", "LeetCode", "permutation-in-string", "Sliding Window", "Fixed Window Match"],
  ["Minimum Window Substring", "Hard", "LeetCode", "minimum-window-substring", "Sliding Window", "Shrinkable Substring Match"],
  ["Sliding Window Maximum", "Hard", "LeetCode", "sliding-window-maximum", "Sliding Window", "Monotonic Deque"],

  // Stack
  ["Valid Parentheses", "Easy", "LeetCode", "valid-parentheses", "Stack", "Matching Brackets"],
  ["Min Stack", "Medium", "LeetCode", "min-stack", "Stack", "Auxiliary Min Track"],
  ["Evaluate Reverse Polish Notation", "Medium", "LeetCode", "evaluate-reverse-polish-notation", "Stack", "Postfix Evaluation"],
  ["Generate Parentheses", "Medium", "LeetCode", "generate-parentheses", "Stack", "Backtracking Stack"],
  ["Daily Temperatures", "Medium", "LeetCode", "daily-temperatures", "Stack", "Monotonic Decreasing Stack"],
  ["Car Fleet", "Medium", "LeetCode", "car-fleet", "Stack", "Speed and Arrival Stack"],
  ["Largest Rectangle in Histogram", "Hard", "LeetCode", "largest-rectangle-in-histogram", "Stack", "Monotonic Width Expansion"],

  // Binary Search
  ["Binary Search", "Easy", "LeetCode", "binary-search", "Binary Search", "Classic Sorted Halving"],
  ["Search a 2D Matrix", "Medium", "LeetCode", "search-a-2d-matrix", "Binary Search", "Flattened Coordinate BS"],
  ["Koko Eating Bananas", "Medium", "LeetCode", "koko-eating-bananas", "Binary Search", "Binary Search on Answer"],
  ["Find Minimum in Rotated Sorted Array", "Medium", "LeetCode", "find-minimum-in-rotated-sorted-array", "Binary Search", "Inflection Point BS"],
  ["Search in Rotated Sorted Array", "Medium", "LeetCode", "search-in-rotated-sorted-array", "Binary Search", "Pivoted Binary Search"],
  ["Time Based Key-Value Store", "Medium", "LeetCode", "time-based-key-value-store", "Binary Search", "Timestamp Binary Search"],
  ["Median of Two Sorted Arrays", "Hard", "LeetCode", "median-of-two-sorted-arrays", "Binary Search", "Partitioning Binary Search"],

  // Linked List
  ["Reverse Linked List", "Easy", "LeetCode", "reverse-linked-list", "Linked List", "Pointer Inversion"],
  ["Merge Two Sorted Lists", "Easy", "LeetCode", "merge-two-sorted-lists", "Linked List", "Splice Two Lists"],
  ["Reorder List", "Medium", "LeetCode", "reorder-list", "Linked List", "Middle & Reverse Intersperse"],
  ["Remove Nth Node From End of List", "Medium", "LeetCode", "remove-nth-node-from-end-of-list", "Linked List", "Fast & Slow Gap"],
  ["Copy List with Random Pointer", "Medium", "LeetCode", "copy-list-with-random-pointer", "Linked List", "Interleaved Clone"],
  ["Add Two Numbers", "Medium", "LeetCode", "add-two-numbers", "Linked List", "Carry Addition"],
  ["Linked List Cycle", "Easy", "LeetCode", "linked-list-cycle", "Linked List", "Floyd Tortoise & Hare"],
  ["Find the Duplicate Number", "Medium", "LeetCode", "find-the-duplicate-number", "Linked List", "Cycle Detection in Array"],
  ["LRU Cache", "Medium", "LeetCode", "lru-cache", "Linked List", "Hash Map + Doubly Linked List"],
  ["Merge k Sorted Lists", "Hard", "LeetCode", "merge-k-sorted-lists", "Linked List", "Min-Heap / Divide & Conquer"],
  ["Reverse Nodes in k-Group", "Hard", "LeetCode", "reverse-nodes-in-k-group", "Linked List", "Subsegment Reversal"],

  // Trees
  ["Invert Binary Tree", "Easy", "LeetCode", "invert-binary-tree", "Trees", "Recursive Swap"],
  ["Maximum Depth of Binary Tree", "Easy", "LeetCode", "maximum-depth-of-binary-tree", "Trees", "DFS Depth"],
  ["Diameter of Binary Tree", "Easy", "LeetCode", "diameter-of-binary-tree", "Trees", "Branch Height Sum"],
  ["Balanced Binary Tree", "Easy", "LeetCode", "balanced-binary-tree", "Trees", "Height Balance Check"],
  ["Same Tree", "Easy", "LeetCode", "same-tree", "Trees", "Structural Identity"],
  ["Subtree of Another Tree", "Easy", "LeetCode", "subtree-of-another-tree", "Trees", "Subtree Matching"],
  ["Lowest Common Ancestor of a BST", "Medium", "LeetCode", "lowest-common-ancestor-of-a-binary-search-tree", "Trees", "BST Value Splitting"],
  ["Binary Tree Level Order Traversal", "Medium", "LeetCode", "binary-tree-level-order-traversal", "Trees", "BFS Queue Traversal"],
  ["Binary Tree Right Side View", "Medium", "LeetCode", "binary-tree-right-side-view", "Trees", "BFS / Rightmost DFS"],
  ["Count Good Nodes in Binary Tree", "Medium", "LeetCode", "count-good-nodes-in-binary-tree", "Trees", "Path Max Propagation"],
  ["Validate Binary Search Tree", "Medium", "LeetCode", "validate-binary-search-tree", "Trees", "Range Validation"],
  ["Kth Smallest Element in a BST", "Medium", "LeetCode", "kth-smallest-element-in-a-bst", "Trees", "Inorder Traversal"],
  ["Construct Binary Tree from Preorder and Inorder Traversal", "Medium", "LeetCode", "construct-binary-tree-from-preorder-and-inorder-traversal", "Trees", "Divide & Conquer Index Map"],
  ["Binary Tree Maximum Path Sum", "Hard", "LeetCode", "binary-tree-maximum-path-sum", "Trees", "Postorder Gain Aggregation"],
  ["Serialize and Deserialize Binary Tree", "Hard", "LeetCode", "serialize-and-deserialize-binary-tree", "Trees", "Preorder String Encoding"],

  // Tries
  ["Implement Trie (Prefix Tree)", "Medium", "LeetCode", "implement-trie-prefix-tree", "Tries", "Prefix Tree Operations"],
  ["Design Add and Search Words Data Structure", "Medium", "LeetCode", "design-add-and-search-words-data-structure", "Tries", "Wildcard Trie Search"],
  ["Word Search II", "Hard", "LeetCode", "word-search-ii", "Tries", "Backtracking Trie Pruning"],

  // Heap / Priority Queue
  ["Kth Largest Element in a Stream", "Easy", "LeetCode", "kth-largest-element-in-a-stream", "Heap / Priority Queue", "Fixed-size Min-Heap"],
  ["Last Stone Weight", "Easy", "LeetCode", "last-stone-weight", "Heap / Priority Queue", "Max-Heap Smash"],
  ["K Closest Points to Origin", "Medium", "LeetCode", "k-closest-points-to-origin", "Heap / Priority Queue", "Euclidean Max-Heap"],
  ["Kth Largest Element in an Array", "Medium", "LeetCode", "kth-largest-element-in-an-array", "Heap / Priority Queue", "Quickselect / Min-Heap"],
  ["Task Scheduler", "Medium", "LeetCode", "task-scheduler", "Heap / Priority Queue", "Cooling Queue + Max-Heap"],
  ["Design Twitter", "Medium", "LeetCode", "design-twitter", "Heap / Priority Queue", "K-way Merge Heap"],
  ["Find Median from Data Stream", "Hard", "LeetCode", "find-median-from-data-stream", "Heap / Priority Queue", "Dual Min-Max Heap Balance"],

  // Backtracking
  ["Subsets", "Medium", "LeetCode", "subsets", "Backtracking", "Include / Exclude Choice"],
  ["Combination Sum", "Medium", "LeetCode", "combination-sum", "Backtracking", "Unbounded Target Pick"],
  ["Permutations", "Medium", "LeetCode", "permutations", "Backtracking", "Element Swapping / Visited"],
  ["Subsets II", "Medium", "LeetCode", "subsets-ii", "Backtracking", "Duplicate Skipping"],
  ["Combination Sum II", "Medium", "LeetCode", "combination-sum-ii", "Backtracking", "Single-use Sorted Dedup"],
  ["Word Search", "Medium", "LeetCode", "word-search", "Backtracking", "Grid Path DFS"],
  ["Palindrome Partitioning", "Medium", "LeetCode", "palindrome-partitioning", "Backtracking", "Prefix Palindrome Split"],
  ["Letter Combinations of a Phone Number", "Medium", "LeetCode", "letter-combinations-of-a-phone-number", "Backtracking", "Digit Map Permutations"],
  ["N-Queens", "Hard", "LeetCode", "n-queens", "Backtracking", "Diagonal Attack Set Pruning"],

  // Graphs
  ["Number of Islands", "Medium", "LeetCode", "number-of-islands", "Graphs", "Connected Component Grid DFS"],
  ["Max Area of Island", "Medium", "LeetCode", "max-area-of-island", "Graphs", "Flood Fill Area Count"],
  ["Clone Graph", "Medium", "LeetCode", "clone-graph", "Graphs", "Node HashMap DFS/BFS"],
  ["Walls and Gates", "Medium", "LeetCode", "walls-and-gates", "Graphs", "Multi-Source BFS"],
  ["Rotting Oranges", "Medium", "LeetCode", "rotting-oranges", "Graphs", "Stepwise Multi-Source BFS"],
  ["Pacific Atlantic Water Flow", "Medium", "LeetCode", "pacific-atlantic-water-flow", "Graphs", "Dual Ocean Reverse BFS"],
  ["Surrounded Regions", "Medium", "LeetCode", "surrounded-regions", "Graphs", "Boundary Connected Component"],
  ["Course Schedule", "Medium", "LeetCode", "course-schedule", "Graphs", "Cycle Detection / Kahn's Algo"],
  ["Course Schedule II", "Medium", "LeetCode", "course-schedule-ii", "Graphs", "Topological Sort Ordering"],
  ["Graph Valid Tree", "Medium", "LeetCode", "graph-valid-tree", "Graphs", "Union Find / Cycle Check"],
  ["Number of Connected Components in an Undirected Graph", "Medium", "LeetCode", "number-of-connected-components-in-an-undirected-graph", "Graphs", "Disjoint Set Union"],
  ["Redundant Connection", "Medium", "LeetCode", "redundant-connection", "Graphs", "Cycle Edge Finder"],
  ["Word Ladder", "Hard", "LeetCode", "word-ladder", "Graphs", "Shortest Path BFS on Word Graph"],

  // Advanced Graphs
  ["Reconstruct Itinerary", "Hard", "LeetCode", "reconstruct-itinerary", "Advanced Graphs", "Eulerian Path / Hierholzer's"],
  ["Min Cost to Connect All Points", "Medium", "LeetCode", "min-cost-to-connect-all-points", "Advanced Graphs", "Prim's / Kruskal's MST"],
  ["Network Delay Time", "Medium", "LeetCode", "network-delay-time", "Advanced Graphs", "Dijkstra's Shortest Path"],
  ["Swim in Rising Water", "Hard", "LeetCode", "swim-in-rising-water", "Advanced Graphs", "Dijkstra on Elevation Grid"],
  ["Alien Dictionary", "Hard", "LeetCode", "alien-dictionary", "Advanced Graphs", "Lexicographical Topo Sort"],
  ["Cheapest Flights Within K Stops", "Medium", "LeetCode", "cheapest-flights-within-k-stops", "Advanced Graphs", "Bellman-Ford / Modified Dijkstra"],

  // 1-D Dynamic Programming
  ["Climbing Stairs", "Easy", "LeetCode", "climbing-stairs", "1-D Dynamic Programming", "Fibonacci Transition"],
  ["Min Cost Climbing Stairs", "Easy", "LeetCode", "min-cost-climbing-stairs", "1-D Dynamic Programming", "1D Cost Optimization"],
  ["House Robber", "Medium", "LeetCode", "house-robber", "1-D Dynamic Programming", "Adjacent Exclusion DP"],
  ["House Robber II", "Medium", "LeetCode", "house-robber-ii", "1-D Dynamic Programming", "Circular Subproblem Split"],
  ["Longest Palindromic Substring", "Medium", "LeetCode", "longest-palindromic-substring", "1-D Dynamic Programming", "Expand Around Center / DP"],
  ["Palindromic Substrings", "Medium", "LeetCode", "palindromic-substrings", "1-D Dynamic Programming", "Center Count Traversal"],
  ["Decode Ways", "Medium", "LeetCode", "decode-ways", "1-D Dynamic Programming", "Digit Pair Transition"],
  ["Coin Change", "Medium", "LeetCode", "coin-change", "1-D Dynamic Programming", "Unbounded Knapsack Min"],
  ["Maximum Product Subarray", "Medium", "LeetCode", "maximum-product-subarray", "1-D Dynamic Programming", "Min-Max Sign Swap Tracker"],
  ["Word Break", "Medium", "LeetCode", "word-break", "1-D Dynamic Programming", "Prefix Partition Match"],
  ["Longest Increasing Subsequence", "Medium", "LeetCode", "longest-increasing-subsequence", "1-D Dynamic Programming", "Patience Sort / DP"],
  ["Partition Equal Subset Sum", "Medium", "LeetCode", "partition-equal-subset-sum", "1-D Dynamic Programming", "0/1 Knapsack Target Boolean"],

  // 2-D Dynamic Programming
  ["Unique Paths", "Medium", "LeetCode", "unique-paths", "2-D Dynamic Programming", "Grid Coordinate DP"],
  ["Longest Common Subsequence", "Medium", "LeetCode", "longest-common-subsequence", "2-D Dynamic Programming", "String Grid Match"],
  ["Best Time to Buy and Sell Stock with Cooldown", "Medium", "LeetCode", "best-time-to-buy-and-sell-stock-with-cooldown", "2-D Dynamic Programming", "State Machine Transition"],
  ["Coin Change II", "Medium", "LeetCode", "coin-change-ii", "2-D Dynamic Programming", "Unbounded Combination Count"],
  ["Target Sum", "Medium", "LeetCode", "target-sum", "2-D Dynamic Programming", "Subset Difference DP"],
  ["Interleaving String", "Medium", "LeetCode", "interleaving-string", "2-D Dynamic Programming", "Two-String Prefix Merge"],
  ["Longest Increasing Path in a Matrix", "Hard", "LeetCode", "longest-increasing-path-in-a-matrix", "2-D Dynamic Programming", "Memoized Grid DFS"],
  ["Distinct Subsequences", "Hard", "LeetCode", "distinct-subsequences", "2-D Dynamic Programming", "Target Subsequence Count"],
  ["Edit Distance", "Medium", "LeetCode", "edit-distance", "2-D Dynamic Programming", "String Transformation Grid"],
  ["Burst Balloons", "Hard", "LeetCode", "burst-balloons", "2-D Dynamic Programming", "Interval Matrix DP"],
  ["Regular Expression Matching", "Hard", "LeetCode", "regular-expression-matching", "2-D Dynamic Programming", "Regex Wildcard DP"],

  // Greedy
  ["Maximum Subarray", "Medium", "LeetCode", "maximum-subarray", "Greedy", "Kadane's Algorithm"],
  ["Jump Game", "Medium", "LeetCode", "jump-game", "Greedy", "Furthest Reach Tracker"],
  ["Jump Game II", "Medium", "LeetCode", "jump-game-ii", "Greedy", "Windowed BFS Reach"],
  ["Gas Station", "Medium", "LeetCode", "gas-station", "Greedy", "Surplus Reset"],
  ["Hand of Straights", "Medium", "LeetCode", "hand-of-straights", "Greedy", "Consecutive Group Drain"],
  ["Merge Triplets to Form Target Triplet", "Medium", "LeetCode", "merge-triplets-to-form-target-triplet", "Greedy", "Component-wise Filter"],
  ["Partition Labels", "Medium", "LeetCode", "partition-labels", "Greedy", "Last Occurrence Window"],
  ["Valid Parenthesis String", "Medium", "LeetCode", "valid-parenthesis-string", "Greedy", "Range Balance Tracking"],

  // Intervals
  ["Insert Interval", "Medium", "LeetCode", "insert-interval", "Intervals", "Sweep & Merge"],
  ["Merge Intervals", "Medium", "LeetCode", "merge-intervals", "Intervals", "Sorted Overlap Union"],
  ["Non-overlapping Intervals", "Medium", "LeetCode", "non-overlapping-intervals", "Intervals", "Earliest End Pick"],
  ["Meeting Rooms", "Easy", "LeetCode", "meeting-rooms", "Intervals", "Adjacent Overlap Check"],
  ["Meeting Rooms II", "Medium", "LeetCode", "meeting-rooms-ii", "Intervals", "Min-Heap / Event Sweep"],
  ["Minimum Interval to Include Each Query", "Hard", "LeetCode", "minimum-interval-to-include-each-query", "Intervals", "Sorted Queries + Min-Heap"],

  // Math & Geometry
  ["Rotate Image", "Medium", "LeetCode", "rotate-image", "Math & Geometry", "Transpose & Reverse"],
  ["Spiral Matrix", "Medium", "LeetCode", "spiral-matrix", "Math & Geometry", "Bound-Shrinking Loop"],
  ["Set Matrix Zeroes", "Medium", "LeetCode", "set-matrix-zeroes", "Math & Geometry", "In-Place Marker Arrays"],
  ["Happy Number", "Easy", "LeetCode", "happy-number", "Math & Geometry", "Cycle Detection on Squares"],
  ["Plus One", "Easy", "LeetCode", "plus-one", "Math & Geometry", "Array Carry Propagation"],
  ["Pow(x, n)", "Medium", "LeetCode", "powx-n", "Math & Geometry", "Binary Exponentiation"],
  ["Multiply Strings", "Medium", "LeetCode", "multiply-strings", "Math & Geometry", "Columnar Digit Multiplication"],
  ["Detect Squares", "Medium", "LeetCode", "detect-squares", "Math & Geometry", "Diagonal Point Pair Lookup"],

  // Bit Manipulation
  ["Single Number", "Easy", "LeetCode", "single-number", "Bit Manipulation", "XOR Self-Cancellation"],
  ["Number of 1 Bits", "Easy", "LeetCode", "number-of-1-bits", "Bit Manipulation", "Brian Kernighan's Bit Clear"],
  ["Counting Bits", "Easy", "LeetCode", "counting-bits", "Bit Manipulation", "DP on Set Bits"],
  ["Reverse Bits", "Easy", "LeetCode", "reverse-bits", "Bit Manipulation", "32-bit Shift Assembly"],
  ["Missing Number", "Easy", "LeetCode", "missing-number", "Bit Manipulation", "XOR Index Match"],
  ["Sum of Two Integers", "Medium", "LeetCode", "sum-of-two-integers", "Bit Manipulation", "Half-Adder Logic"],
  ["Reverse Integer", "Medium", "LeetCode", "reverse-integer", "Bit Manipulation", "32-bit Overflow Detection"]
];

const neetcodeProblems = neetcodeRaw.map((p, i) =>
  makeProblem(
    `NC-${String(i + 1).padStart(3, '0')}`,
    p[0],
    p[1],
    p[2],
    p[3],
    p[4],
    p[5],
    p[1] === "Easy" ? "Level 1" : p[1] === "Medium" ? "Level 2" : "Level 3",
    "NeetCode"
  )
);

console.log(`NeetCode 150 parsed: ${neetcodeProblems.length} problems.`);

// Export NeetCode Excel
exportToExcel(
  './public/sheets/NeetCode_150_Sheet.xlsx',
  'NEETCODE 150 — CURATED CODING INTERVIEW ROADMAP',
  '150 Essential LeetCode Problems | 18 Pattern Categories | NeetCode Channel Solutions',
  neetcodeProblems
);

// We will write the full generator to scripts/data
fs.writeFileSync('./scripts/data/neetcode150.json', JSON.stringify(neetcodeProblems, null, 2));

console.log("NeetCode 150 ready.");
