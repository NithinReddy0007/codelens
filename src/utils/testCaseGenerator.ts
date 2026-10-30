import { TestCase } from '../types/testCase';
import { ProblemAnalysis, ParameterInfo } from '../types/problem';
import { PROBLEM_CATALOG, CatalogProblem } from '../data/problemCatalog';

export function generateTestCases(analysis: ProblemAnalysis): TestCase[] {
  const cases: TestCase[] = [];
  const catalogEntry = analysis.problemId
    ? PROBLEM_CATALOG.find((p) => p.id === analysis.problemId)
    : null;

  // 1. If we have catalog defaults, use first 3–4 cases only
  if (catalogEntry?.defaultCases && catalogEntry.defaultCases.length > 0) {
    const sliced = catalogEntry.defaultCases.slice(0, 4);
    for (let i = 0; i < sliced.length; i++) {
      const defCase = sliced[i];
      let expected: any = undefined;
      let hasExpected = false;

      if (catalogEntry.referenceSolution) {
        try {
          expected = catalogEntry.referenceSolution(...defCase.args);
          hasExpected = true;
        } catch (e) {
          hasExpected = false;
        }
      }

      cases.push({
        id: `case_${i + 1}`,
        label: defCase.label,
        inputs: {},
        args: defCase.args,
        expectedOutput: expected,
        hasExpected,
        status: 'untested'
      });
    }

    return cases;
  }

  // 2. Generic generator from parsed signature — exactly 3 cases
  if (analysis.signature && analysis.signature.parameters.length > 0) {
    const params = analysis.signature.parameters;
    const labels = [
      'Typical case',
      'Minimal / Empty',
      'Single element'
    ];

    for (let i = 0; i < labels.length; i++) {
      const args = params.map((p) => generateParamValue(p, i));
      cases.push({
        id: `case_${i + 1}`,
        label: labels[i],
        inputs: {},
        args,
        hasExpected: false,
        status: 'untested'
      });
    }

    return cases;
  }

  // 3. Fallback default
  return [
    {
      id: 'case_1',
      label: 'Default Input',
      inputs: {},
      args: [[5, 2, 8, 1, 9]],
      hasExpected: false,
      status: 'untested'
    }
  ];
}

function addGenericBoundaryCases(
  cases: TestCase[],
  sig: NonNullable<ProblemAnalysis['signature']>,
  catalogEntry?: CatalogProblem | null
) {
  const extraVariations = [
    { label: 'Boundary values', variant: 3 },
    { label: 'All elements equal', variant: 4 },
    { label: 'Sorted order', variant: 5 }
  ];

  for (const extra of extraVariations) {
    if (cases.length >= 8) break;
    const args = sig.parameters.map((p) => generateParamValue(p, extra.variant));
    let expected: any = undefined;
    let hasExpected = false;
    if (catalogEntry?.referenceSolution) {
      try {
        expected = catalogEntry.referenceSolution(...args);
        hasExpected = true;
      } catch (e) {
        hasExpected = false;
      }
    }
    cases.push({
      id: `case_${cases.length + 1}`,
      label: extra.label,
      inputs: {},
      args,
      expectedOutput: expected,
      hasExpected,
      status: 'untested'
    });
  }
}

function generateParamValue(param: ParameterInfo, variant: number): any {
  switch (param.kind) {
    case 'array':
      switch (variant) {
        case 0: // Typical
          return [4, 7, 1, 9, 3];
        case 1: // Minimal / Empty
          return [];
        case 2: // Single element
          return [42];
        case 3: // Negatives / Boundary
          return [-10, -3, 0, 5, -8];
        case 4: // Duplicates / All equal
          return [3, 3, 3, 3];
        case 5: // Already sorted
          return [1, 2, 3, 4, 5, 6];
        case 6: // Reverse sorted
          return [6, 5, 4, 3, 2, 1];
        case 7: // Larger case
        default:
          return [12, 5, 18, 2, 9, 14, 7, 21, 3, 11];
      }

    case 'matrix':
      switch (variant) {
        case 1:
          return [[]];
        case 2:
          return [[1]];
        default:
          return [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ];
      }

    case 'string':
      switch (variant) {
        case 0:
          return 'leetcode';
        case 1:
          return '';
        case 2:
          return 'a';
        case 3:
          return 'racecar';
        case 4:
          return 'aaaaa';
        default:
          return 'algorithm';
      }

    case 'int':
      switch (variant) {
        case 0:
          return 9;
        case 1:
          return 0;
        case 2:
          return 1;
        case 3:
          return -5;
        case 4:
          return 100;
        default:
          return 7;
      }

    case 'bool':
      return variant % 2 === 0;

    case 'linkedlist':
      switch (variant) {
        case 1:
          return [];
        case 2:
          return [1];
        default:
          return [1, 2, 3, 4, 5];
      }

    case 'tree':
      return [1, 2, 3, null, null, 4, 5];

    default:
      return 0;
  }
}

export function compareOutputs(actual: any, expected: any): boolean {
  if (actual === expected) return true;
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return actual === expected;
  }

  // Handle arrays / objects
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (!compareOutputs(actual[i], expected[i])) return false;
    }
    return true;
  }

  if (typeof actual === 'object' && typeof expected === 'object') {
    const k1 = Object.keys(actual);
    const k2 = Object.keys(expected);
    if (k1.length !== k2.length) return false;
    for (const k of k1) {
      if (!compareOutputs(actual[k], expected[k])) return false;
    }
    return true;
  }

  return false;
}

