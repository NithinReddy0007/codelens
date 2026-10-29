export interface TestCase {
  id: string;
  label: string;
  inputs: Record<string, any>; // or positional args array
  args: any[];
  expectedOutput?: any;
  hasExpected: boolean;
  status?: 'passed' | 'failed' | 'error' | 'untested';
  actualOutput?: any;
  error?: string;
}

