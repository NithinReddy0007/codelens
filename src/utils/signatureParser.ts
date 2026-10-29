import { ParameterInfo, ProblemSignature } from '../types/problem';
import { SupportedLanguage } from '../types/trace';

export function parseSignature(code: string, language: SupportedLanguage): ProblemSignature | null {
  const trimmed = code.trim();

  // 1. Python Signature Parsing
  if (language === 'python') {
    // Check class Solution
    const classMatch = /class\s+Solution\s*:/i.test(trimmed);
    const defMatch = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/.exec(trimmed);

    if (defMatch) {
      const fnName = defMatch[1];
      const rawParams = defMatch[2].split(',').map(p => p.trim()).filter(Boolean);
      const rawRet = defMatch[3]?.trim() || 'unknown';

      const parameters: ParameterInfo[] = [];
      for (const p of rawParams) {
        if (p === 'self') continue;
        const [pName, pType] = p.split(':').map(s => s.trim());
        const mapped = mapTypeKind(pType || 'unknown');
        parameters.push({
          name: pName,
          type: pType || 'any',
          kind: mapped.kind,
          itemType: mapped.itemType
        });
      }

      const retMapped = mapTypeKind(rawRet);
      return {
        functionName: fnName,
        className: classMatch ? 'Solution' : undefined,
        parameters,
        returnType: rawRet,
        returnKind: retMapped.kind
      };
    }
  }

  // 2. C++ Signature Parsing
  if (language === 'cpp') {
    const classMatch = /class\s+Solution\b/i.test(trimmed);
    // e.g. int search(vector<int>& nums, int target)
    // vector<int> twoSum(vector<int>& nums, int target)
    // void bubbleSort(vector<int>& arr)
    const methodMatch = /(?:public:\s*)?([\w<>:&*]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/.exec(trimmed);

    if (methodMatch) {
      const retType = methodMatch[1].trim();
      const fnName = methodMatch[2].trim();
      const rawParams = methodMatch[3].split(',').map(p => p.trim()).filter(Boolean);

      // Exclude main
      if (fnName === 'main') return null;

      const parameters: ParameterInfo[] = [];
      for (const p of rawParams) {
        // e.g. "vector<int>& nums" or "int target"
        const parts = p.split(/\s+/);
        const pName = parts[parts.length - 1].replace(/[&*]/g, '');
        const pType = parts.slice(0, parts.length - 1).join(' ').replace(/[&*]/g, '');
        const mapped = mapTypeKind(pType);
        parameters.push({
          name: pName,
          type: pType,
          kind: mapped.kind,
          itemType: mapped.itemType
        });
      }

      const retMapped = mapTypeKind(retType);
      return {
        functionName: fnName,
        className: classMatch ? 'Solution' : undefined,
        parameters,
        returnType: retType,
        returnKind: retMapped.kind
      };
    }
  }

  // 3. Java Signature Parsing
  if (language === 'java') {
    const classMatch = /class\s+Solution\b/i.test(trimmed);
    // e.g. public int[] twoSum(int[] nums, int target)
    // public int search(int[] nums, int target)
    const methodMatch = /(?:public\s+|private\s+|protected\s+|static\s+)*([\w<>\[\]]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/.exec(trimmed);

    if (methodMatch) {
      const retType = methodMatch[1].trim();
      const fnName = methodMatch[2].trim();
      const rawParams = methodMatch[3].split(',').map(p => p.trim()).filter(Boolean);

      if (fnName === 'main') return null;

      const parameters: ParameterInfo[] = [];
      for (const p of rawParams) {
        const parts = p.split(/\s+/);
        const pName = parts[parts.length - 1];
        const pType = parts.slice(0, parts.length - 1).join(' ');
        const mapped = mapTypeKind(pType);
        parameters.push({
          name: pName,
          type: pType,
          kind: mapped.kind,
          itemType: mapped.itemType
        });
      }

      const retMapped = mapTypeKind(retType);
      return {
        functionName: fnName,
        className: classMatch ? 'Solution' : undefined,
        parameters,
        returnType: retType,
        returnKind: retMapped.kind
      };
    }
  }

  return null;
}

function mapTypeKind(typeStr: string): { kind: ParameterInfo['kind']; itemType?: string } {
  const t = typeStr.toLowerCase().replace(/\s+/g, '');

  if (t.includes('vector<vector') || t.includes('int[][]') || t.includes('list[list')) {
    return { kind: 'matrix', itemType: 'int' };
  }
  if (t.includes('vector') || t.includes('[]') || t.includes('list[') || t.includes('arraylist')) {
    return { kind: 'array', itemType: 'int' };
  }
  if (t.includes('listnode')) {
    return { kind: 'linkedlist' };
  }
  if (t.includes('treenode')) {
    return { kind: 'tree' };
  }
  if (t.includes('int') || t.includes('long') || t.includes('short') || t.includes('byte')) {
    return { kind: 'int' };
  }
  if (t.includes('float') || t.includes('double')) {
    return { kind: 'float' };
  }
  if (t.includes('bool')) {
    return { kind: 'bool' };
  }
  if (t.includes('string') || t.includes('str')) {
    return { kind: 'string' };
  }
  if (t.includes('char')) {
    return { kind: 'char' };
  }
  return { kind: 'unknown' };
}

