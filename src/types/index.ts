export interface AnalysisResult {
  filePath: string;
  language: string;
  complexity: ComplexityMetrics;
  functions: FunctionAnalysis[];
  // classes: ClassAnalysis[];
  summary: AnalysisSummary;
  metadata: AnalysisMetadata;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  // cognitive: number;
  // timeComplexity: string;
  // spaceComplexity: string;
  // // linesOfCode: number;
  // maintainabilityIndex: number;
}

export interface FunctionAnalysis {
  name: string;
  startLine: number;
  endLine: number;
  complexity: ComplexityMetrics;
  parameters: number;
  returnType: string;
}

// export interface ClassAnalysis {
//   name: string;
//   startLine: number;
//   endLine: number;
//   methods: FunctionAnalysis[];
//   fields: number;
//   complexity: ComplexityMetrics;
// }

export interface AnalysisSummary {
  totalFunctions: number;
  // totalClasses: number;
  averageComplexity: number;
  highComplexityFunctions: string[];
  recommendations: string[];
}

export interface AnalysisMetadata {
  originalPath: string;
  // analyzedAt: string;
  // analyzerVersion: string;
  language: string;
  // fileSize: number;
}

export interface OutputConfig {
  format: 'console' | 'file' | 'both';
  filename?: string;
  fileFormat?: 'txt' | 'json' | 'csv';
}

export interface AnalyzerConfig {
  verbose: boolean;
  maxComplexity: number;
  includeBigO: boolean;
  includeCyclomatic: boolean;
  includeCognitive: boolean;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface CyclomaticConfig {
    countCaseStatements?: boolean;  // Whether to count each case as a decision point
    countLogicalOperators?: boolean; // Whether to count && and || as decision points
    countTernary?: boolean;          // Whether to count ternary operators
}