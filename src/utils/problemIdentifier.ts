import { ProblemAnalysis, ProblemSignature } from '../types/problem';
import { SupportedLanguage } from '../types/trace';
import { PROBLEM_CATALOG, CatalogProblem } from '../data/problemCatalog';
import { parseSignature } from './signatureParser';

export function identifyProblem(code: string, language: SupportedLanguage): ProblemAnalysis {
  const signature = parseSignature(code, language);
  const signals = detectStructuralSignals(code);

  const fnName = signature?.functionName.toLowerCase() || '';
  const codeLower = code.toLowerCase();

  let bestMatch: CatalogProblem | null = null;
  let highestScore = 0;

  for (const prob of PROBLEM_CATALOG) {
    let score = 0;

    // 1. Keyword / Function name matching
    for (const kw of prob.keywords) {
      const kwLower = kw.toLowerCase();
      if (fnName === kwLower) {
        score += 65;
        break;
      } else if (fnName.includes(kwLower) || kwLower.includes(fnName) && fnName.length > 3) {
        score += 45;
      } else if (codeLower.includes(kwLower)) {
        score += 15;
      }
    }

    // 2. Structural signals matching
    if (prob.signals) {
      for (const sig of prob.signals) {
        if (signals.includes(sig)) {
          score += 15;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = prob;
    }
  }

  // Determine confidence
  if (highestScore >= 50 && bestMatch) {
    return {
      problemId: bestMatch.id,
      problemName: bestMatch.name,
      description: bestMatch.description,
      technique: bestMatch.technique,
      timeComplexity: bestMatch.timeComplexity,
      spaceComplexity: bestMatch.spaceComplexity,
      confidence: 'high',
      source: 'local',
      signature: signature || undefined,
      structuralSignals: signals
    };
  }

  if (highestScore >= 25 && bestMatch) {
    return {
      problemId: bestMatch.id,
      problemName: bestMatch.name,
      description: bestMatch.description,
      technique: bestMatch.technique,
      timeComplexity: bestMatch.timeComplexity,
      spaceComplexity: bestMatch.spaceComplexity,
      confidence: 'medium',
      source: 'local',
      signature: signature || undefined,
      structuralSignals: signals
    };
  }

  // Low confidence / Unrecognized fallback
  const fallbackSummary = synthesizeUnrecognizedSummary(signature, signals);

  return {
    problemName: 'Custom / Unrecognized Algorithm',
    description: fallbackSummary,
    technique: signals.length > 0 ? signals.join(', ') : 'Iterative computation',
    timeComplexity: signals.includes('nestedLoops') ? 'O(N^2)' : signals.includes('binarySearchPattern') ? 'O(log N)' : 'O(N)',
    spaceComplexity: signals.includes('hashLookup') || signals.includes('stack') ? 'O(N)' : 'O(1)',
    confidence: 'low',
    source: 'local',
    signature: signature || undefined,
    structuralSignals: signals,
    unrecognizedSummary: fallbackSummary
  };
}

export function detectStructuralSignals(code: string): string[] {
  const signals: string[] = [];
  const lines = code.split('\n');

  // Nested loops detection
  let loopDepth = 0;
  let maxLoopDepth = 0;
  for (const line of lines) {
    const t = line.trim();
    if (/\b(for|while)\b/.test(t) && !t.startsWith('//') && !t.startsWith('#')) {
      loopDepth++;
      if (loopDepth > maxLoopDepth) maxLoopDepth = loopDepth;
    }
    if (t.includes('}') || (t.length > 0 && !line.startsWith(' ') && !line.startsWith('\t'))) {
      if (loopDepth > 0) loopDepth = Math.max(0, loopDepth - 1);
    }
  }
  if (maxLoopDepth >= 2 || (code.match(/\bfor\b/g) || []).length >= 2) {
    signals.push('nestedLoops');
  } else if ((code.match(/\b(for|while)\b/g) || []).length === 1) {
    signals.push('singleLoop');
  }

  // Hash Map / Set usage
  if (
    /(\bdict\b|\bHashMap\b|\bunordered_map\b|\{\}|\bset\b|\bHashSet\b|\bunordered_set\b)/.test(code) ||
    /seen\[/.test(code) ||
    /map\.(put|get|has|containsKey)/.test(code)
  ) {
    signals.push('hashLookup');
  }

  // Two pointers
  if (
    (/\b(left|right|low|high|start|end)\b/.test(code) && /\b(mid|l|r)\b/.test(code)) ||
    (/\bleft\s*<=\s*right\b/.test(code)) ||
    (/\bl\s*<\s*r\b/.test(code))
  ) {
    signals.push('twoPointers');
  }

  // Binary search pattern
  if (
    /\b(left\s*\+\s*right|\(l\s*\+\s*r\))\s*\/\s*2\b/.test(code) ||
    /\bleft\s*\+\s*\(right\s*-\s*left\)\s*\/\s*2\b/.test(code) ||
    /\b(left\s*<=\s*right|l\s*<=\s*r)\b/.test(code)
  ) {
    signals.push('binarySearchPattern');
  }

  // Stack
  if (
    /\b(stack|push|pop)\b/.test(code) &&
    (/stack\.pop\(/.test(code) || /stack\.append\(/.test(code) || /stack\.push\(/.test(code))
  ) {
    signals.push('stack');
  }

  // Linked list
  if (/\b(ListNode|\.next|->next)\b/.test(code)) {
    signals.push('linkedList');
  }

  // Tree
  if (/\b(TreeNode|\.left|\.right|->left|->right)\b/.test(code)) {
    signals.push('tree');
  }

  // Swapping
  if (
    /\[([a-zA-Z0-9_]+)\],\s*\[([a-zA-Z0-9_]+)\]\s*=\s*\[\2\],\s*\[\1\]/.test(code) ||
    /\btemp\s*=\s*[^;]+;\s*[^=]+=\s*[^;]+;\s*[^=]+=\s*temp;/.test(code)
  ) {
    signals.push('swapping');
  }

  // 1D / 2D array
  if (/(\bvector<vector|\bint\[\]\[\]|\blist\[list)/.test(code)) {
    signals.push('matrix2D');
  } else if (/(\bvector<|\bint\[\]|\blist\[|\barr\[)/.test(code)) {
    signals.push('array1D');
  }

  // Recursion
  const fnMatch = /def\s+([a-zA-Z0-9_]+)|(?:int|void|bool|ListNode|TreeNode)\s+([a-zA-Z0-9_]+)\s*\(/.exec(code);
  if (fnMatch) {
    const fnName = fnMatch[1] || fnMatch[2];
    const regex = new RegExp(`\\b${fnName}\\s*\\(`, 'g');
    const matches = code.match(regex);
    if (matches && matches.length >= 2) {
      signals.push('recursion');
    }
  }

  return signals;
}

function synthesizeUnrecognizedSummary(sig: ProblemSignature | null, signals: string[]): string {
  const parts: string[] = ['Unrecognized algorithm: Here is what the code appears to do:'];

  if (sig) {
    parts.push(`Function "${sig.functionName}" accepts ${sig.parameters.length} parameter(s)`);
    if (sig.parameters.length > 0) {
      const pDesc = sig.parameters.map(p => `${p.name} (${p.kind})`).join(', ');
      parts.push(`[${pDesc}]`);
    }
    parts.push(`and returns ${sig.returnKind}.`);
  }

  if (signals.includes('nestedLoops')) {
    parts.push('It contains nested loops, likely comparing or processing pairs of elements (O(N^2) time).');
  } else if (signals.includes('singleLoop')) {
    parts.push('It contains a single loop traversing through the input linearly (O(N) time).');
  }

  if (signals.includes('swapping')) {
    parts.push('It performs element swapping, consistent with an in-place rearrangement or sorting algorithm.');
  }

  if (signals.includes('hashLookup')) {
    parts.push('It maintains a hash table or frequency map for fast O(1) lookups.');
  }

  if (signals.includes('binarySearchPattern')) {
    parts.push('It divides the search space using midpoint calculations (logarithmic O(log N) search).');
  }

  if (signals.includes('recursion')) {
    parts.push('It is implemented recursively, breaking the task down into subproblems.');
  }

  return parts.join(' ');
}

