export interface ParameterInfo {
  name: string;
  type: string;
  kind: 'int' | 'float' | 'bool' | 'string' | 'char' | 'array' | 'matrix' | 'linkedlist' | 'tree' | 'unknown';
  itemType?: string;
}

export interface ProblemSignature {
  functionName: string;
  className?: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnKind: 'int' | 'float' | 'bool' | 'string' | 'char' | 'array' | 'matrix' | 'linkedlist' | 'tree' | 'void' | 'unknown';
}

export interface ProblemAnalysis {
  problemId?: string;
  problemName: string;
  description: string;
  technique: string;
  timeComplexity: string;
  spaceComplexity: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'local' | 'ai_gemini' | 'ai_openai';
  signature?: ProblemSignature;
  structuralSignals: string[];
  unrecognizedSummary?: string;
}

