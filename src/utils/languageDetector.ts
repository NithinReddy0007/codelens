import { SupportedLanguage } from '../types/trace';

export function detectLanguage(code: string): SupportedLanguage {
  const trimmed = code.trim();

  // Strong C++ signatures
  if (
    trimmed.includes('#include') ||
    trimmed.includes('std::') ||
    trimmed.includes('cout <<') ||
    trimmed.includes('cin >>') ||
    trimmed.includes('vector<') ||
    trimmed.includes('unordered_map<') ||
    trimmed.includes('pair<') ||
    /\b(int|void)\s+main\s*\(\s*\)/.test(trimmed)
  ) {
    return 'cpp';
  }

  // Strong Java signatures
  if (
    trimmed.includes('public class') ||
    trimmed.includes('System.out.println') ||
    trimmed.includes('public static void main') ||
    trimmed.includes('ArrayList<') ||
    trimmed.includes('HashMap<') ||
    trimmed.includes('String[] args')
  ) {
    return 'java';
  }

  // Strong Python signatures
  if (
    trimmed.includes('def ') ||
    trimmed.includes('elif ') ||
    trimmed.includes('import ') ||
    trimmed.includes('from ') ||
    trimmed.includes('__name__') ||
    trimmed.includes('self.') ||
    /print\s*\(/.test(trimmed)
  ) {
    return 'python';
  }

  // LeetCode class Solution signatures
  if (trimmed.includes('class Solution:')) {
    return 'python';
  }
  if (trimmed.includes('class Solution {')) {
    // Check if C++ or Java syntax inside class Solution
    if (trimmed.includes('public:') || trimmed.includes('vector<') || trimmed.includes('bool ')) {
      return 'cpp';
    }
    if (trimmed.includes('public int') || trimmed.includes('public boolean') || trimmed.includes('public void')) {
      return 'java';
    }
  }

  return 'python';
}

