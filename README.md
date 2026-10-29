# CodeLens 🔍

> **Real execution and step-by-step algorithm visualizer for Python, C++, and Java.**  
> CodeLens inspects source code (with or without `main()`, including LeetCode-style `class Solution`), identifies what problem it solves, automatically generates boundary test cases, and plays back an animated, step-by-step execution trace recorded from real execution.

Zero backend required. Fully client-side and deployable as static files (e.g. GitHub Pages).

---

## 🚀 Quick Start

### 1. Run Locally
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Tests
```bash
npm test
```
Runs unit tests for the Python tracer, AST parser, C++ & Java conformance suite (15+ features per language), problem identification, and test case generator.

### 3. Build for Production / Static Deployment
```bash
npm run build
```
The output in `dist/` is 100% static HTML, CSS, and JS. You can deploy it to:
- **GitHub Pages**: Push `dist/` to your `gh-pages` branch or configure GitHub Actions.
- **Vercel / Netlify**: Connect repository and set build command `npm run build` with output directory `dist`.

---

## 🏗️ Architecture & How It Works

### 1. Python Execution (Pyodide Worker)
- Runs Python 3.12+ in a background Web Worker using **Pyodide** (WebAssembly).
- Records real line events, locals, calls, and returns with `sys.settrace`.
- Automatically extracts data structures, arrays, matrices, linked lists, trees, and maps.
- Detects pointers: any variable used to index into an array or in range `0 <= val < len` becomes a visual pointer marker with easing.

### 2. C++ & Java Execution (In-Browser Interpreter)
- An in-browser tree-walking interpreter written in TypeScript:
  $$\text{Source Code} \longrightarrow \text{Tokenizer} \longrightarrow \text{AST Parser} \longrightarrow \text{Stepping Interpreter}$$
- Emits the exact same **Unified Trace Format** as the Python engine.
- Supported subset:
  - **Primitives**: `int`, `long`, `double`, `float`, `char`, `bool` / `boolean`, `string` / `String`
  - **Containers**: 1D arrays (`int[]`, `vector<int>`), 2D arrays (`int[][]`, `vector<vector<int>>`), `ArrayList`, `unordered_map`, `HashMap`, `set`, `HashSet`, `stack` / `Stack`, `queue` / `Queue`, `pair`
  - **Structures**: `ListNode` (`val`, `next`), `TreeNode` (`val`, `left`, `right`)
  - **Control Flow**: `for`, `while`, `do-while`, range-for (`for (int x : nums)`), `if` / `else`, ternary `a ? b : c`, recursion, `break`, `continue`
  - **Methods & Math**: `.size()`, `.length()`, `.push_back()`, `.add()`, `.pop_back()`, `.remove()`, `.put()`, `.get()`, `.containsKey()`, `std::max`, `std::min`, `std::abs`, `Math.max`, `Math.min`, `Math.abs`, `cout <<`, `System.out.println`
- Throws friendly, explicit error messages if an unsupported keyword or construct is used, with line numbers.

### 3. Infinite Loop & Safety Guardrails
- **Step Cap**: Strict cap of 20,000 steps per execution. If a loop exceeds the cap, execution halts cleanly with a notification: `"Execution stopped: step limit reached"`.
- **Worker Time Limit**: A watchdog timer terminates and restarts workers if execution exceeds the timeout limit (e.g. 10s), ensuring the UI never hangs.

### 4. Problem Identification
- **Offline Heuristics**: Analyzes function signatures and structural signals (`nestedLoops`, `hashLookup`, `twoPointers`, `binarySearchPattern`, `slidingWindow`, `stack`, `linkedList`, `tree`, `recursion`, `swapping`) against a catalog of ~60 common algorithmic problems.
- **Low Confidence Fallback**: When an algorithm does not match catalog problems, it generates a transparent structural description:
  > *"Unrecognized algorithm: Function 'custom_fn' accepts 2 parameters and returns array. It contains nested loops, likely comparing or processing pairs of elements (O(N^2) time)."*
- **Optional AI Enhancement**: Users can optionally provide a personal Gemini or OpenAI API key (stored strictly in `localStorage`). The UI clearly states whether the analysis came from Local Heuristics or AI.

### 5. Unified Trace Format
Every engine (Python, C++, Java) emits the exact same trace object:
```ts
interface TraceStep {
  step: number;
  line: number;
  event: 'line' | 'call' | 'return' | 'branch' | 'loop' | 'output' | 'error';
  frame: string;
  depth: number;
  vars: Record<string, { type: string; value: any; raw?: string }>;
  changed: string[];
  structures: StructureInfo[];
  branch?: { line: number; condition: string; result: boolean };
  loop?: { line: number; iteration: number };
  stdout?: string;
  error?: string;
}
```

---

## ⌨️ Controls & Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `Right Arrow` | Step Forward |
| `Left Arrow` | Step Backward |
| `Home` | Reset to Step 0 |
| **Scrubber Slider** | Drag to seek directly to step $N$ of $M$ |
| **Speed Dropdown** | Set speed from $0.25\times$ to $4\times$ |
| **Jump Selector** | Jump directly to next or previous change of a variable |
| **Share Button** | Copy permalink with compressed code in URL hash |

---

## 📋 Conformance & Tests

CodeLens includes automated conformance tests verifying:
- Python tracing with `sys.settrace`, infinite loop caps, and syntax error offsets.
- LeetCode `class Solution` automatic harness invocation.
- 15+ C++ language features (vector, matrix, loops, recursion, unordered_map, ListNode, bubble sort).
- 15+ Java language features (arrays, 2D arrays, loops, recursion, HashMap, ListNode, bubble sort).
- Cross-language equivalence: Binary Search produces identical outputs and index pointers across Python, C++, and Java.

