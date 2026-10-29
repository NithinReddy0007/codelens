export type TraceEvent =
  | 'line'
  | 'call'
  | 'return'
  | 'branch'
  | 'loop'
  | 'output'
  | 'error';

export type StructureKind =
  | 'array'
  | 'matrix'
  | 'map'
  | 'set'
  | 'stack'
  | 'queue'
  | 'linkedlist'
  | 'tree';

export interface StructureInfo {
  id: string; // name or identifier (e.g. "arr", "nums", "stack")
  kind: StructureKind;
  data: any; // array values, matrix rows, key-value entries, node graph, etc.
  pointers: Record<string, number | string>; // e.g. { i: 2, j: 3, left: 0 }
  highlighted: (number | string)[]; // indices or node keys currently active/compared/written
}

export interface VariableValue {
  type: string;
  value: any;
  raw?: string;
  isPointer?: boolean;
}

export interface TraceStep {
  step: number;
  line: number;
  event: TraceEvent;
  frame: string;
  depth: number;
  vars: Record<string, VariableValue>;
  changed: string[];
  structures: StructureInfo[];
  branch?: {
    line: number;
    condition: string;
    result: boolean;
  };
  loop?: {
    line: number;
    iteration: number;
  };
  stdout?: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  trace: TraceStep[];
  totalSteps: number;
  truncated: boolean;
  error?: {
    line?: number;
    message: string;
    type?: string;
  };
  stdout: string;
  returnValue?: any;
  stats?: {
    durationMs: number;
    stepsRecorded: number;
  };
}

export type SupportedLanguage = 'python' | 'java' | 'cpp';

