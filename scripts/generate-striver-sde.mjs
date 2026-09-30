import fs from 'fs';
import { makeProblem } from './sheet-helpers.mjs';
import { exportToExcel } from './excel-helper.mjs';

console.log("Generating Striver's SDE Sheet...");

const striverSdeRaw = [
  // Day 1: Arrays
  ["Set Matrix Zeroes", "Medium", "LeetCode", "set-matrix-zeroes", "Arrays", "Matrix Traversal", "Level 2"],
  ["Pascal's Triangle", "Easy", "LeetCode", "pascals-triangle", "Arrays", "Dynamic Programming / Math", "Level 1"],
  ["Next Permutation", "Medium", "LeetCode", "next-permutation", "Arrays", "Lexicographical Search", "Level 2"],
  ["Kadane's Algorithm - Maximum Subarray", "Medium", "LeetCode", "maximum-subarray", "Arrays", "Kadane's Algorithm", "Level 2"],
  ["Sort an Array of 0s, 1s and 2s", "Medium", "LeetCode", "sort-colors", "Arrays", "Dutch National Flag", "Level 2"],
  ["Stock Buy and Sell", "Easy", "LeetCode", "best-time-to-buy-and-sell-stock", "Arrays", "Prefix Min", "Level 1"],

  // Day 2: Arrays Part-II
  ["Rotate Matrix", "Medium", "LeetCode", "rotate-image", "Arrays Part-II", "Transpose & Reverse", "Level 2"],
  ["Merge Overlapping Subintervals", "Medium", "LeetCode", "merge-intervals", "Arrays Part-II", "Interval Sorting", "Level 2"],
  ["Merge Two Sorted Arrays Without Extra Space", "Medium", "LeetCode", "merge-sorted-array", "Arrays Part-II", "Gap Method / Reverse Pointers", "Level 2"],
  ["Find the Duplicate in an Array of N+1 Integers", "Medium", "LeetCode", "find-the-duplicate-number", "Arrays Part-II", "Floyd's Cycle Detection", "Level 2"],
  ["Repeat and Missing Number", "Medium", "GeeksforGeeks", "find-missing-and-repeated", "Arrays Part-II", "Math Sum & Square Sum", "Level 2"],
  ["Inversion of Array (Pre-req: Merge Sort)", "Medium", "GeeksforGeeks", "inversion-of-array-1587115620", "Arrays Part-II", "Divide and Conquer", "Level 2"],

  // Day 3: Arrays/Maths
  ["Search in a 2D Matrix", "Medium", "LeetCode", "search-a-2d-matrix", "Arrays/Maths", "Binary Search on Grid", "Level 2"],
  ["Pow(x, n)", "Medium", "LeetCode", "powx-n", "Arrays/Maths", "Binary Exponentiation", "Level 2"],
  ["Majority Element (> N/2 times)", "Easy", "LeetCode", "majority-element", "Arrays/Maths", "Moore's Voting Algorithm", "Level 1"],
  ["Majority Element (> N/3 times)", "Medium", "LeetCode", "majority-element-ii", "Arrays/Maths", "Extended Moore's Voting", "Level 2"],
  ["Grid Unique Paths", "Medium", "LeetCode", "unique-paths", "Arrays/Maths", "Combinatorics / DP", "Level 2"],
  ["Reverse Pairs (LeetCode)", "Hard", "LeetCode", "reverse-pairs", "Arrays/Maths", "Modified Merge Sort", "Level 3"],

  // Day 4: Arrays Part-IV
  ["2 Sum Problem", "Easy", "LeetCode", "two-sum", "Arrays Part-IV", "Hash Table Complement", "Level 1"],
  ["4 Sum Problem", "Medium", "LeetCode", "4sum", "Arrays Part-IV", "Two Pointers with Sorting", "Level 2"],
  ["Longest Consecutive Sequence", "Medium", "LeetCode", "longest-consecutive-sequence", "Arrays Part-IV", "Hash Set Range Search", "Level 2"],
  ["Largest Subarray with 0 Sum", "Medium", "GeeksforGeeks", "largest-subarray-with-0-sum", "Arrays Part-IV", "Prefix Sum Hashing", "Level 2"],
  ["Count number of subarrays with given XOR K", "Medium", "GeeksforGeeks", "count-subarrays-with-given-xor", "Arrays Part-IV", "Prefix XOR Hash Map", "Level 2"],
  ["Longest Substring Without Repeat", "Medium", "LeetCode", "longest-substring-without-repeating-characters", "Arrays Part-IV", "Sliding Window", "Level 2"],

  // Day 5: LinkedList
  ["Reverse a LinkedList", "Easy", "LeetCode", "reverse-linked-list", "LinkedList", "3 Pointers Inversion", "Level 1"],
  ["Find the Middle of LinkedList", "Easy", "LeetCode", "middle-of-the-linked-list", "LinkedList", "Tortoise & Hare", "Level 1"],
  ["Merge Two Sorted LinkedList", "Easy", "LeetCode", "merge-two-sorted-lists", "LinkedList", "Linear Splice", "Level 1"],
  ["Remove Nth Node from End of List", "Medium", "LeetCode", "remove-nth-node-from-end-of-list", "LinkedList", "Two Pointer Lead", "Level 2"],
  ["Add Two Numbers as LinkedList", "Medium", "LeetCode", "add-two-numbers", "LinkedList", "Digit Carry Addition", "Level 2"],
  ["Delete a given Node when a node is given (0(1) solution)", "Medium", "LeetCode", "delete-node-in-a-linked-list", "LinkedList", "Copy Next Value", "Level 2"],

  // Day 6: LinkedList Part-II
  ["Find Intersection Point of Y LinkedList", "Medium", "LeetCode", "intersection-of-two-linked-lists", "LinkedList Part-II", "Cycle Dual Pointer", "Level 2"],
  ["Detect a Cycle in LinkedList", "Easy", "LeetCode", "linked-list-cycle", "LinkedList Part-II", "Floyd Loop Detection", "Level 1"],
  ["Reverse a LinkedList in groups of size k", "Hard", "LeetCode", "reverse-nodes-in-k-group", "LinkedList Part-II", "K-Group Iterative Swap", "Level 3"],
  ["Check if a LinkedList is Palindrome or not", "Easy", "LeetCode", "palindrome-linked-list", "LinkedList Part-II", "Half Reversal", "Level 1"],
  ["Find the starting point of the Loop of LinkedList", "Medium", "LeetCode", "linked-list-cycle-ii", "LinkedList Part-II", "Head-Meeting Step", "Level 2"],
  ["Flattening of a LinkedList", "Medium", "GeeksforGeeks", "flattening-a-linked-list", "LinkedList Part-II", "Priority Queue / Merge", "Level 2"],

  // Day 7: Two Pointers
  ["Rotate a LinkedList", "Medium", "LeetCode", "rotate-list", "Two Pointers", "Circular Length Modulo", "Level 2"],
  ["Clone a Linked List with random and next pointer", "Medium", "LeetCode", "copy-list-with-random-pointer", "Two Pointers", "Node Weaving", "Level 2"],
  ["3 Sum", "Medium", "LeetCode", "3sum", "Two Pointers", "Sort & Two Pointers", "Level 2"],
  ["Trapping Rainwater", "Hard", "LeetCode", "trapping-rain-water", "Two Pointers", "Left & Right Maximums", "Level 3"],
  ["Remove Duplicate from Sorted array", "Easy", "LeetCode", "remove-duplicates-from-sorted-array", "Two Pointers", "Write Index Pointer", "Level 1"],
  ["Max Consecutive Ones", "Easy", "LeetCode", "max-consecutive-ones", "Two Pointers", "Streak Counter", "Level 1"],

  // Day 8: Greedy
  ["N meetings in one room", "Easy", "GeeksforGeeks", "n-meetings-in-one-room-1587115620", "Greedy", "Sort by End Time", "Level 1"],
  ["Minimum platforms required for railway", "Medium", "GeeksforGeeks", "minimum-platforms-1587115620", "Greedy", "Two Pointer Chronological Event", "Level 2"],
  ["Job Sequencing Problem", "Medium", "GeeksforGeeks", "job-sequencing-problem-1587115620", "Greedy", "Deadline Slot Allocation", "Level 2"],
  ["Fractional Knapsack Problem", "Medium", "GeeksforGeeks", "fractional-knapsack-1587115620", "Greedy", "Value/Weight Ratio", "Level 2"],
  ["Greedy algorithm to find minimum number of Coins", "Easy", "GeeksforGeeks", "coin-change", "Greedy", "Denomination Matching", "Level 1"],
  ["Assign Cookies", "Easy", "LeetCode", "assign-cookies", "Greedy", "Greedy Satisfaction", "Level 1"],

  // Day 9: Recursion
  ["Subset Sums", "Medium", "GeeksforGeeks", "subset-sums2234", "Recursion", "Pick / Non-pick DFS", "Level 2"],
  ["Subset-II", "Medium", "LeetCode", "subsets-ii", "Recursion", "Sorted Level DFS", "Level 2"],
  ["Combination Sum-1", "Medium", "LeetCode", "combination-sum", "Recursion", "Repeated Choice DFS", "Level 2"],
  ["Combination Sum-2", "Medium", "LeetCode", "combination-sum-ii", "Recursion", "Single Choice Dedup", "Level 2"],
  ["Palindrome Partitioning", "Medium", "LeetCode", "palindrome-partitioning", "Recursion", "Prefix Palindrome DFS", "Level 2"],
  ["K-th Permutation Sequence", "Hard", "LeetCode", "permutation-sequence", "Recursion", "Factorial Number System", "Level 3"],

  // Day 10: Recursion and Backtracking
  ["Print all Permutations of a string/array", "Medium", "LeetCode", "permutations", "Recursion and Backtracking", "Swap Recursion", "Level 2"],
  ["N Queens Problem", "Hard", "LeetCode", "n-queens", "Recursion and Backtracking", "Diagonal Bitmask / Sets", "Level 3"],
  ["Sudoku Solver", "Hard", "LeetCode", "sudoku-solver", "Recursion and Backtracking", "9x9 Constraint Backtrack", "Level 3"],
  ["M Coloring Problem", "Medium", "GeeksforGeeks", "m-coloring-problem-1587115620", "Recursion and Backtracking", "Adjacent Conflict Check", "Level 2"],
  ["Rat in a Maze", "Medium", "GeeksforGeeks", "rat-in-a-maze-problem", "Recursion and Backtracking", "4-Directional DFS", "Level 2"],
  ["Word Break (print all ways)", "Hard", "LeetCode", "word-break-ii", "Recursion and Backtracking", "Trie / DFS Memo", "Level 3"],

  // Day 11: Binary Search
  ["The N-th root of an integer", "Easy", "GeeksforGeeks", "find-nth-root-of-m5843", "Binary Search", "Monotonic Search Space", "Level 1"],
  ["Matrix Median", "Medium", "GeeksforGeeks", "median-in-a-row-wise-sorted-matrix1527", "Binary Search", "Upper Bound Counts", "Level 2"],
  ["Find the element that appears once in sorted array", "Medium", "LeetCode", "single-element-in-a-sorted-array", "Binary Search", "Even/Odd Index Parity", "Level 2"],
  ["Search element in a sorted and rotated array", "Medium", "LeetCode", "search-in-rotated-sorted-array", "Binary Search", "Sorted Half Elimination", "Level 2"],
  ["Median of 2 sorted arrays", "Hard", "LeetCode", "median-of-two-sorted-arrays", "Binary Search", "Partition Cut Line", "Level 3"],
  ["K-th element of two sorted arrays", "Medium", "GeeksforGeeks", "k-th-element-of-two-sorted-array1317", "Binary Search", "Cut Binary Search", "Level 2"],
  ["Allocate Minimum Number of Pages", "Hard", "GeeksforGeeks", "allocate-minimum-number-of-pages0937", "Binary Search", "Binary Search on Answer", "Level 3"],
  ["Aggressive Cows", "Hard", "GeeksforGeeks", "aggressive-cows", "Binary Search", "Distance Verification", "Level 3"],

  // Day 12: Heaps
  ["Max Heap, Min Heap Implementation", "Medium", "GeeksforGeeks", "binary-heap-operations", "Heaps", "Heapify & Sift Down", "Level 2"],
  ["Kth Largest Element", "Medium", "LeetCode", "kth-largest-element-in-an-array", "Heaps", "Min-Heap", "Level 2"],
  ["Maximum Sum Combination", "Medium", "GeeksforGeeks", "maximum-sum-combination", "Heaps", "Max-Heap with Visited Set", "Level 2"],
  ["Find Median from Data Stream", "Hard", "LeetCode", "find-median-from-data-stream", "Heaps", "Two Heaps Balance", "Level 3"],
  ["Merge K Sorted Arrays", "Medium", "GeeksforGeeks", "merge-k-sorted-arrays", "Heaps", "K-Element Min Heap", "Level 2"],
  ["K most frequent elements", "Medium", "LeetCode", "top-k-frequent-elements", "Heaps", "Bucket Sort / Min Heap", "Level 2"],

  // Day 13: Stack and Queue
  ["Implement Stack using Arrays", "Easy", "GeeksforGeeks", "implement-stack-using-array", "Stack and Queue", "Top Pointer Increment", "Level 1"],
  ["Implement Queue using Arrays", "Easy", "GeeksforGeeks", "implement-queue-using-array", "Stack and Queue", "Front & Rear Circular", "Level 1"],
  ["Implement Stack using Queue (using single queue)", "Easy", "LeetCode", "implement-stack-using-queues", "Stack and Queue", "Queue Rotation", "Level 1"],
  ["Implement Queue using Stack (0(1) amortized)", "Easy", "LeetCode", "implement-queue-using-stacks", "Stack and Queue", "In-Out Stack Shuffle", "Level 1"],
  ["Check for balanced parentheses", "Easy", "LeetCode", "valid-parentheses", "Stack and Queue", "Matching Bracket Stack", "Level 1"],
  ["Next Greater Element", "Medium", "LeetCode", "next-greater-element-i", "Stack and Queue", "Monotonic Stack", "Level 2"],
  ["Sort a Stack", "Medium", "GeeksforGeeks", "sort-a-stack", "Stack and Queue", "Recursive Insert In Sorted Order", "Level 2"],

  // Day 14: Stack and Queue Part-II
  ["Next Smaller Element", "Medium", "GeeksforGeeks", "help-classmates4653", "Stack and Queue Part-II", "Monotonic Increasing Stack", "Level 2"],
  ["LRU Cache", "Medium", "LeetCode", "lru-cache", "Stack and Queue Part-II", "Hash Map + Doubly Linked List", "Level 2"],
  ["LFU Cache", "Hard", "LeetCode", "lfu-cache", "Stack and Queue Part-II", "Doubly Linked List per Frequency", "Level 3"],
  ["Largest rectangle in a histogram", "Hard", "LeetCode", "largest-rectangle-in-histogram", "Stack and Queue Part-II", "Monotonic Left & Right Bounds", "Level 3"],
  ["Sliding Window Maximum", "Hard", "LeetCode", "sliding-window-maximum", "Stack and Queue Part-II", "Monotonic Deque", "Level 3"],
  ["Implement Min Stack", "Medium", "LeetCode", "min-stack", "Stack and Queue Part-II", "2*val - min Formula", "Level 2"],
  ["Rotten Orange (Using BFS)", "Medium", "LeetCode", "rotting-oranges", "Stack and Queue Part-II", "Multi-source Queue BFS", "Level 2"],
  ["Stock Span Problem", "Medium", "LeetCode", "online-stock-span", "Stack and Queue Part-II", "Monotonic Stack Span", "Level 2"],
  ["Find the Maximum of minimums of every window size", "Hard", "GeeksforGeeks", "maximum-of-minimum-for-every-window-size3453", "Stack and Queue Part-II", "Previous & Next Smaller", "Level 3"],
  ["The Celebrity Problem", "Medium", "GeeksforGeeks", "the-celebrity-problem", "Stack and Queue Part-II", "Two Pointer Elimination", "Level 2"],

  // Day 15: String
  ["Reverse Words in a String", "Medium", "LeetCode", "reverse-words-in-a-string", "String", "Word Extraction Stack", "Level 2"],
  ["Longest Palindrome in a string", "Medium", "LeetCode", "longest-palindromic-substring", "String", "Expand Around Center", "Level 2"],
  ["Roman Number to Integer and vice versa", "Easy", "LeetCode", "roman-to-integer", "String", "Subtractive Lookahead", "Level 1"],
  ["Implement ATOI/STRSTR", "Medium", "LeetCode", "string-to-integer-atoi", "String", "Clamp Overflow Logic", "Level 2"],
  ["Longest Common Prefix", "Easy", "LeetCode", "longest-common-prefix", "String", "Vertical Character Match", "Level 1"],
  ["Rabin Karp Algorithm", "Medium", "LeetCode", "repeated-string-match", "String", "Rolling Hash", "Level 2"],

  // Day 16: String Part-II
  ["Z-Function Algorithm", "Hard", "LeetCode", "find-the-index-of-the-first-occurrence-in-a-string", "String Part-II", "Z-Box Range Extension", "Level 3"],
  ["KMP Algorithm / LPS Array", "Hard", "LeetCode", "shortest-palindrome", "String Part-II", "Prefix Function Matching", "Level 3"],
  ["Minimum characters to make string Palindrome", "Hard", "GeeksforGeeks", "minimum-characters-to-be-added-at-front-to-make-string-palindrome", "String Part-II", "LPS of S + # + rev(S)", "Level 3"],
  ["Check for Anagrams", "Easy", "LeetCode", "valid-anagram", "String Part-II", "Frequency Count", "Level 1"],
  ["Count and Say", "Medium", "LeetCode", "count-and-say", "String Part-II", "RLE Iteration", "Level 2"],
  ["Compare Version Numbers", "Medium", "LeetCode", "compare-version-numbers", "String Part-II", "Chunk Parse Compare", "Level 2"],

  // Day 17: Binary Tree
  ["Inorder Traversal", "Easy", "LeetCode", "binary-tree-inorder-traversal", "Binary Tree", "Left-Root-Right Recursion/Stack", "Level 1"],
  ["Preorder Traversal", "Easy", "LeetCode", "binary-tree-preorder-traversal", "Binary Tree", "Root-Left-Right Recursion/Stack", "Level 1"],
  ["Postorder Traversal", "Easy", "LeetCode", "binary-tree-postorder-traversal", "Binary Tree", "Left-Right-Root Recursion/Stack", "Level 1"],
  ["Morris Inorder Traversal", "Medium", "LeetCode", "recover-binary-search-tree", "Binary Tree", "Threaded Tree (O(1) Space)", "Level 2"],
  ["Morris Preorder Traversal", "Medium", "LeetCode", "binary-tree-preorder-traversal", "Binary Tree", "Threaded Tree Preorder", "Level 2"],
  ["LeftView Of Binary Tree", "Easy", "GeeksforGeeks", "left-view-of-binary-tree", "Binary Tree", "Level Tracking DFS", "Level 1"],
  ["Bottom View of Binary Tree", "Medium", "GeeksforGeeks", "bottom-view-of-binary-tree", "Binary Tree", "Vertical Line Coordinate Map", "Level 2"],
  ["Top View of Binary Tree", "Medium", "GeeksforGeeks", "top-view-of-binary-tree", "Binary Tree", "Horizontal Distance BFS", "Level 2"],
  ["Preorder, Inorder, Postorder in a single traversal", "Medium", "GeeksforGeeks", "tree-traversals", "Binary Tree", "State Tuple Stack", "Level 2"],
  ["Vertical order traversal", "Hard", "LeetCode", "vertical-order-traversal-of-a-binary-tree", "Binary Tree", "Multiset Coordinate BFS", "Level 3"],
  ["Root to node path in a Binary Tree", "Medium", "GeeksforGeeks", "root-to-leaf-paths", "Binary Tree", "Backtracking Path DFS", "Level 2"],
  ["Max width of a Binary Tree", "Medium", "LeetCode", "maximum-width-of-binary-tree", "Binary Tree", "Index Normalized BFS", "Level 2"],

  // Day 18: Binary Tree Part-II
  ["Level order Traversal / Spiral Level Order", "Medium", "LeetCode", "binary-tree-level-order-traversal", "Binary Tree Part-II", "Queue BFS", "Level 2"],
  ["Height of a Binary Tree", "Easy", "LeetCode", "maximum-depth-of-binary-tree", "Binary Tree Part-II", "DFS Depth", "Level 1"],
  ["Diameter of Binary Tree", "Easy", "LeetCode", "diameter-of-binary-tree", "Binary Tree Part-II", "Longest Branch Sum", "Level 1"],
  ["Check if Binary tree is height balanced or not", "Easy", "LeetCode", "balanced-binary-tree", "Binary Tree Part-II", "Height Difference <= 1", "Level 1"],
  ["LCA in Binary Tree", "Medium", "LeetCode", "lowest-common-ancestor-of-a-binary-tree", "Binary Tree Part-II", "Subtree Finding DFS", "Level 2"],
  ["Check if two trees are identical or not", "Easy", "LeetCode", "same-tree", "Binary Tree Part-II", "Simultaneous DFS", "Level 1"],
  ["Zig Zag Traversal of Binary Tree", "Medium", "LeetCode", "binary-tree-zigzag-level-order-traversal", "Binary Tree Part-II", "Alternating Deque / Vector Reverse", "Level 2"],
  ["Boundary Traversal of Binary Tree", "Medium", "GeeksforGeeks", "boundary-traversal-of-binary-tree", "Binary Tree Part-II", "Left + Leaves + Right Reverse", "Level 2"],

  // Day 19: Binary Tree Part-III
  ["Maximum path sum", "Hard", "LeetCode", "binary-tree-maximum-path-sum", "Binary Tree Part-III", "Postorder Gain Max", "Level 3"],
  ["Construct Binary Tree from Inorder and Preorder", "Medium", "LeetCode", "construct-binary-tree-from-preorder-and-inorder-traversal", "Binary Tree Part-III", "Preorder Root + Inorder Partition", "Level 2"],
  ["Construct Binary Tree from Inorder and Postorder", "Medium", "LeetCode", "construct-binary-tree-from-inorder-and-postorder-traversal", "Binary Tree Part-III", "Postorder Root + Inorder Partition", "Level 2"],
  ["Symmetric Binary Tree", "Easy", "LeetCode", "symmetric-tree", "Binary Tree Part-III", "Mirror Reflection DFS", "Level 1"],
  ["Flatten Binary Tree to LinkedList", "Medium", "LeetCode", "flatten-binary-tree-to-linked-list", "Binary Tree Part-III", "Reverse Postorder / Morris", "Level 2"],
  ["Check if Binary Tree is mirror of itself or not", "Easy", "GeeksforGeeks", "check-mirror-in-n-ary-tree", "Binary Tree Part-III", "Stack Reverse Check", "Level 1"],
  ["Check for Children Sum Property", "Medium", "GeeksforGeeks", "children-sum-parent", "Binary Tree Part-III", "Bottom-up Reassignment", "Level 2"],

  // Day 20: BST
  ["Populate Next Right pointers of Tree", "Medium", "LeetCode", "populating-next-right-pointers-in-each-node", "BST", "Level Order Pointer Weaving", "Level 2"],
  ["Search given Key in BST", "Easy", "LeetCode", "search-in-a-binary-search-tree", "BST", "Sorted Directed Traversal", "Level 1"],
  ["Construct BST from given keys", "Easy", "LeetCode", "convert-sorted-array-to-binary-search-tree", "BST", "Middle Element Partition", "Level 1"],
  ["Construct BST from preorder traversal", "Medium", "LeetCode", "construct-binary-search-tree-from-preorder-traversal", "BST", "Upper Bound DFS", "Level 2"],
  ["Check is a BT is BST or not", "Medium", "LeetCode", "validate-binary-search-tree", "BST", "Min-Max Bound Checks", "Level 2"],
  ["Find LCA of two nodes in BST", "Medium", "LeetCode", "lowest-common-ancestor-of-a-binary-search-tree", "BST", "Root Value Divergence", "Level 2"],
  ["Find the inorder predecessor/successor of a given Key in BST", "Medium", "GeeksforGeeks", "predecessor-and-successor", "BST", "BST Comparison Update", "Level 2"],

  // Day 21: BST Part-II
  ["Floor in a BST", "Medium", "GeeksforGeeks", "floor-in-bst", "BST Part-II", "Greatest Key <= X", "Level 2"],
  ["Ceil in a BST", "Medium", "GeeksforGeeks", "implementing-ceil-in-bst", "BST Part-II", "Smallest Key >= X", "Level 2"],
  ["Find K-th smallest element in BST", "Medium", "LeetCode", "kth-smallest-element-in-a-bst", "BST Part-II", "Inorder Counter", "Level 2"],
  ["Find K-th largest element in BST", "Medium", "GeeksforGeeks", "kth-largest-element-in-bst", "BST Part-II", "Reverse Inorder Counter", "Level 2"],
  ["Find a pair with a given sum in BST", "Medium", "LeetCode", "two-sum-iv-input-is-a-bst", "BST Part-II", "BST Two-Pointer Iterator", "Level 2"],
  ["BST iterator", "Medium", "LeetCode", "binary-search-tree-iterator", "BST Part-II", "Controlled Stack Inorder", "Level 2"],
  ["Size of the largest BST in a Binary Tree", "Hard", "LeetCode", "maximum-sum-bst-in-binary-tree", "BST Part-II", "Postorder Subtree Valid Tuple", "Level 3"],
  ["Serialize and deserialize Binary Tree", "Hard", "LeetCode", "serialize-and-deserialize-binary-tree", "BST Part-II", "String Tokenizer BFS", "Level 3"],

  // Day 22: Binary Trees [Misc]
  ["Binary Tree to Double Linked List", "Hard", "GeeksforGeeks", "binary-tree-to-dll", "Binary Trees [Misc]", "Inorder Linkage", "Level 3"],
  ["Find median in a stream of running integers", "Hard", "LeetCode", "find-median-from-data-stream", "Binary Trees [Misc]", "Two Heaps", "Level 3"],
  ["K-th largest element in a stream", "Easy", "LeetCode", "kth-largest-element-in-a-stream", "Binary Trees [Misc]", "Min Heap", "Level 1"],
  ["Distinct numbers in Window", "Medium", "GeeksforGeeks", "count-distinct-elements-in-every-window", "Binary Trees [Misc]", "Sliding Window Map", "Level 2"],
  ["K-th largest element in an unsorted array", "Medium", "LeetCode", "kth-largest-element-in-an-array", "Binary Trees [Misc]", "Quickselect", "Level 2"],
  ["Flood-fill Algorithm", "Easy", "LeetCode", "flood-fill", "Binary Trees [Misc]", "BFS/DFS Grid", "Level 1"],

  // Day 23: Graph
  ["Clone a graph (Clone an undirected graph)", "Medium", "LeetCode", "clone-graph", "Graph", "Node Map DFS", "Level 2"],
  ["DFS of Graph", "Easy", "GeeksforGeeks", "depth-first-traversal-for-a-graph", "Graph", "Visited Array DFS", "Level 1"],
  ["BFS of Graph", "Easy", "GeeksforGeeks", "bfs-traversal-of-graph", "Graph", "Queue Traversal", "Level 1"],
  ["Detect A cycle in Undirected Graph using BFS", "Medium", "GeeksforGeeks", "detect-cycle-in-an-undirected-graph", "Graph", "Parent Tracking BFS", "Level 2"],
  ["Detect A cycle in Undirected Graph using DFS", "Medium", "GeeksforGeeks", "detect-cycle-in-an-undirected-graph", "Graph", "Parent Tracking DFS", "Level 2"],
  ["Detect A cycle in a Directed Graph using DFS", "Medium", "GeeksforGeeks", "detect-cycle-in-a-directed-graph", "Graph", "Path Visited Array", "Level 2"],
  ["Detect A cycle in a Directed Graph using BFS", "Medium", "GeeksforGeeks", "topological-sort", "Graph", "Kahn's In-Degree Count", "Level 2"],
  ["Topological Sort using BFS", "Medium", "GeeksforGeeks", "topological-sort", "Graph", "Kahn's Algorithm", "Level 2"],
  ["Topological Sort using DFS", "Medium", "GeeksforGeeks", "topological-sort", "Graph", "Postorder Stack Push", "Level 2"],
  ["Number of islands (Do in grid and graph both)", "Medium", "LeetCode", "number-of-islands", "Graph", "Grid Flood Fill", "Level 2"],
  ["Bipartite Check using BFS", "Medium", "LeetCode", "is-graph-bipartite", "Graph", "2-Coloring BFS", "Level 2"],
  ["Bipartite Check using DFS", "Medium", "LeetCode", "is-graph-bipartite", "Graph", "2-Coloring DFS", "Level 2"],

  // Day 24: Graph Part-II
  ["Strongly Connected Component (Kosaraju Algo)", "Hard", "GeeksforGeeks", "strongly-connected-components-kosarajus-algo", "Graph Part-II", "Transpose Graph DFS", "Level 3"],
  ["Dijkstra's Algorithm", "Medium", "GeeksforGeeks", "implementing-dijkstra-set-1-adjacency-matrix", "Graph Part-II", "Min-Heap Shortest Path", "Level 2"],
  ["Bellman Ford Algorithm", "Medium", "GeeksforGeeks", "distance-from-the-source-bellman-ford-algorithm", "Graph Part-II", "V-1 Edge Relaxations", "Level 2"],
  ["Floyd Warshall Algorithm", "Medium", "GeeksforGeeks", "floyd-warshall4853", "Graph Part-II", "All-Pairs DP Matrix", "Level 2"],
  ["MST using Prim's Algo", "Medium", "GeeksforGeeks", "minimum-spanning-tree", "Graph Part-II", "Greedy Visited Min-Heap", "Level 2"],
  ["MST using Kruskal's Algo", "Medium", "GeeksforGeeks", "minimum-spanning-tree", "Graph Part-II", "Disjoint Set Union by Rank", "Level 2"],

  // Day 25: DP
  ["Max Product Subarray", "Medium", "LeetCode", "maximum-product-subarray", "Dynamic Programming", "Min/Max Swap Tracking", "Level 2"],
  ["Longest Increasing Subsequence", "Medium", "LeetCode", "longest-increasing-subsequence", "Dynamic Programming", "Binary Search (Patience Sort)", "Level 2"],
  ["Longest Common Subsequence", "Medium", "LeetCode", "longest-common-subsequence", "Dynamic Programming", "2D Match Grid", "Level 2"],
  ["0-1 Knapsack", "Medium", "GeeksforGeeks", "0-1-knapsack-problem0945", "Dynamic Programming", "Capacity Weight Branching", "Level 2"],
  ["Edit Distance", "Medium", "LeetCode", "edit-distance", "Dynamic Programming", "Insert/Delete/Replace Min", "Level 2"],
  ["Maximum sum increasing subsequence", "Medium", "GeeksforGeeks", "maximum-sum-increasing-subsequence4749", "Dynamic Programming", "LIS Sum Aggregation", "Level 2"],
  ["Matrix Chain Multiplication", "Hard", "GeeksforGeeks", "matrix-chain-multiplication0303", "Dynamic Programming", "Partition MCM Interval", "Level 3"],

  // Day 26: DP Part-II
  ["Maximum profit in Job scheduling", "Hard", "LeetCode", "maximum-profit-in-job-scheduling", "Dynamic Programming Part-II", "BS + DP on Non-overlapping Jobs", "Level 3"],
  ["Coin Change", "Medium", "LeetCode", "coin-change", "Dynamic Programming Part-II", "Unbounded Knapsack", "Level 2"],
  ["Subset Sum Equal To K", "Medium", "GeeksforGeeks", "subset-sum-problem-1611555638", "Dynamic Programming Part-II", "Boolean Subset DP", "Level 2"],
  ["Rod Cutting", "Medium", "GeeksforGeeks", "rod-cutting0840", "Dynamic Programming Part-II", "Unbounded Price Optimization", "Level 2"],
  ["Egg Dropping", "Hard", "LeetCode", "super-egg-drop", "Dynamic Programming Part-II", "Binary Search + DP", "Level 3"],
  ["Word Break", "Medium", "LeetCode", "word-break", "Dynamic Programming Part-II", "Subproblem Prefix Check", "Level 2"],
  ["Palindromic Partitioning (MCM Variation)", "Hard", "LeetCode", "palindrome-partitioning-ii", "Dynamic Programming Part-II", "Minimum Cut DP", "Level 3"]
];

const striverSdeProblems = striverSdeRaw.map((p, i) =>
  makeProblem(
    `SDE-${String(i + 1).padStart(3, '0')}`,
    p[0],
    p[1],
    p[2],
    p[3],
    p[4],
    p[5],
    p[6] || "Level 2",
    "takeUforward"
  )
);

console.log(`Striver SDE Sheet parsed: ${striverSdeProblems.length} problems.`);

// Export Striver SDE Excel
exportToExcel(
  './public/sheets/Striver_SDE_Sheet.xlsx',
  'STRIVER SDE SHEET — TOP CODING INTERVIEW QUESTIONS',
  '190 Core SDE Problems | 26 Day-Wise Topics | takeUforward Video Solutions',
  striverSdeProblems
);

fs.writeFileSync('./scripts/data/striver_sde.json', JSON.stringify(striverSdeProblems, null, 2));

console.log("Striver SDE Sheet ready.");
