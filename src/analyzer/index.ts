import * as fs from 'fs-extra';
import * as path from 'path';
// import { JavaAnalyzer } from './languages/java';
import { JavaAnalyzer } from './languages/java';
import { AnalysisResult, AnalyzerConfig } from '../types';

export class ComplexityAnalyzer {
  private config: AnalyzerConfig;

  constructor(config: Partial<AnalyzerConfig> = {}) {
    this.config = {
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
      ...config
    };
  }

  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    // Validate file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check if it's a Java file
    if (!this.isJavaFile(filePath)) {
      throw new Error(`Unsupported file type. Only Java files (.java) are supported.`);
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Create analyzer
    const analyzer = new JavaAnalyzer(content, filePath);
    
    // Perform analysis
    const complexity = await analyzer.analyzeComplexity();
    const functions = await analyzer.extractFunctions();
    const classes = await analyzer.extractClasses();
    
    // Generate summary
    const summary = this.generateSummary(functions, classes, complexity);
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    return {
      filePath,
      language: 'java',
      complexity,
      functions,
      classes,
      summary,
      metadata: {
        originalPath: filePath,
        analyzedAt: new Date().toISOString(),
        analyzerVersion: '1.0.0',
        language: 'java',
        fileSize: stats.size
      }
    };
  }

  private isJavaFile(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.java';
  }

  private generateSummary(functions: any[], classes: any[], complexity: any) {
    const totalFunctions = functions.length;
    const totalClasses = classes.length;
    const averageComplexity = functions.length > 0 
      ? functions.reduce((sum, fn) => sum + fn.complexity.cyclomatic, 0) / functions.length 
      : complexity.cyclomatic;
    
    const highComplexityFunctions = functions
      .filter(fn => fn.complexity.cyclomatic > this.config.thresholds.medium)
      .map(fn => fn.name);
    
    const recommendations: string[] = [];
    
    if (averageComplexity > this.config.thresholds.medium) {
      recommendations.push('Consider breaking down complex functions into smaller methods');
    }
    
    if (complexity.maintainabilityIndex < 50) {
      recommendations.push('Low maintainability index - consider refactoring');
    }
    
    if (highComplexityFunctions.length > 0) {
      recommendations.push(`High complexity functions found: ${highComplexityFunctions.join(', ')}`);
    }

    return {
      totalFunctions,
      totalClasses,
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      highComplexityFunctions,
      recommendations
    };
  }
}