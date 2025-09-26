import { ComplexityAnalyzer } from './analyzer';
import { runInteractiveCLI } from './cli';
import { AnalyzerConfig, AnalysisResult } from './types';

export class CodeComplexityAnalyzer {
  private analyzer: ComplexityAnalyzer;
  private options: AnalyzerConfig;

  constructor(options: Partial<AnalyzerConfig> = {}) {
    this.options = {
      verbose: false,
      maxComplexity: 10,
      includeBigO: true,
      includeCyclomatic: true,
      includeCognitive: true,
      thresholds: {
        low: 5,
        medium: 10,
        high: 20
      },
      ...options
    };
    
    this.analyzer = new ComplexityAnalyzer(this.options);
  }

  /**
   * Analyze a single Java file
   * @param filePath - Path to the Java file
   * @returns Analysis results
   */
  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    return await this.analyzer.analyzeFile(filePath);
  }

  /**
   * Get supported languages
   * @returns List of supported languages
   */
  getSupportedLanguages(): string[] {
    return ['java'];
  }

  /**
   * Set analyzer options
   * @param options - Options to set
   */
  setOptions(options: Partial<AnalyzerConfig>): void {
    this.options = { ...this.options, ...options };
    this.analyzer = new ComplexityAnalyzer(this.options);
  }

  /**
   * Get current options
   * @returns Current analyzer options
   */
  getOptions(): AnalyzerConfig {
    return { ...this.options };
  }
}

// Export main class and CLI functions
export {
  ComplexityAnalyzer,
  runInteractiveCLI,
  AnalysisResult,
  AnalyzerConfig
};

// For backward compatibility
export default CodeComplexityAnalyzer;