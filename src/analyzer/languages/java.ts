import { BaseAnalyzer } from './base';
import { ComplexityMetrics, FunctionAnalysis, ClassAnalysis } from '../../types';

export class JavaAnalyzer extends BaseAnalyzer {
  async analyzeComplexity(): Promise<ComplexityMetrics> {
    const cyclomatic = this.calculateCyclomaticComplexity();
    const cognitive = this.calculateCognitiveComplexity();
    const linesOfCode = this.countLines();
    const timeComplexity = this.calculateTimeComplexity();
    const spaceComplexity = this.calculateSpaceComplexity();
    const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomatic, linesOfCode);

    return {
      cyclomatic,
      cognitive,
      timeComplexity,
      spaceComplexity,
      linesOfCode,
      maintainabilityIndex
    };
  }

  async extractFunctions(): Promise<FunctionAnalysis[]> {
    const functions: FunctionAnalysis[] = [];
    const lines = this.content.split('\n');
    
    // Java method pattern: access_modifier return_type method_name(parameters)
    const methodPattern = /^\s*(public|private|protected)?\s*(static)?\s*(\w+)\s+(\w+)\s*\([^)]*\)\s*\{?/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      
      const match = line.match(methodPattern);
      
      if (match) {
        const [, , , returnType, methodName] = match;
        
        // Skip if essential parts are missing
        if (!methodName || !returnType) continue;
        
        // Skip constructors and main method for complexity
        if (methodName === 'main' || returnType === 'void') {
          continue;
        }

        // Find method end
        let braceCount = 0;
        let endLine = i;
        let methodContent = '';
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (!currentLine) continue; // Skip undefined lines
          
          methodContent += currentLine + '\n';
          
          braceCount += (currentLine.match(/\{/g) || []).length;
          braceCount -= (currentLine.match(/\}/g) || []).length;
          
          if (braceCount === 0 && j > i) {
            endLine = j;
            break;
          }
        }

        // Create temporary analyzer for method
        const methodAnalyzer = new JavaAnalyzer(methodContent, this.filePath);
        const complexity = await methodAnalyzer.analyzeComplexity();
        
        functions.push({
          name: methodName,
          startLine: i + 1,
          endLine: endLine + 1,
          complexity,
          parameters: this.countParameters(line),
          returnType: returnType
        });
      }
    }

    return functions;
  }

  async extractClasses(): Promise<ClassAnalysis[]> {
    const classes: ClassAnalysis[] = [];
    const lines = this.content.split('\n');
    
    // Java class pattern: access_modifier class ClassName
    const classPattern = /^\s*(public|private|protected)?\s*class\s+(\w+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      
      const match = line.match(classPattern);
      
      if (match) {
        const [, , className] = match;
        
        // Skip if className is missing
        if (!className) continue;
        
        // Find class end
        let braceCount = 0;
        let endLine = i;
        let classContent = '';
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (!currentLine) continue; // Skip undefined lines
          
          classContent += currentLine + '\n';
          
          braceCount += (currentLine.match(/\{/g) || []).length;
          braceCount -= (currentLine.match(/\}/g) || []).length;
          
          if (braceCount === 0 && j > i) {
            endLine = j;
            break;
          }
        }

        // Create temporary analyzer for class
        const classAnalyzer = new JavaAnalyzer(classContent, this.filePath);
        const complexity = await classAnalyzer.analyzeComplexity();
        const methods = await classAnalyzer.extractFunctions();
        
        classes.push({
          name: className,
          startLine: i + 1,
          endLine: endLine + 1,
          methods,
          fields: this.countFields(classContent),
          complexity
        });
      }
    }

    return classes;
  }

  calculateTimeComplexity(): string {
    const content = this.content.toLowerCase();
    
    // Check for nested loops
    const forLoops = (content.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (content.match(/\bwhile\s*\(/g) || []).length;
    const totalLoops = forLoops + whileLoops;
    
    // Simple heuristic based on loop nesting
    if (content.includes('for') && content.includes('for')) {
      // Check for nested loops pattern
      const nestedPattern = /for\s*\([^}]*for\s*\(/g;
      if (nestedPattern.test(content)) {
        return 'O(n²)';
      }
    }
    
    if (totalLoops >= 3) return 'O(n³)';
    if (totalLoops === 2) return 'O(n²)';
    if (totalLoops === 1) return 'O(n)';
    if (content.includes('binarysearch') || content.includes('binary search')) return 'O(log n)';
    
    return 'O(1)';
  }

  calculateSpaceComplexity(): string {
    const content = this.content.toLowerCase();
    
    // Check for data structures that use additional space
    if (content.includes('arraylist') || content.includes('hashmap') || content.includes('hashset')) {
      return 'O(n)';
    }
    
    // Check for recursive calls
    if (content.includes('recursion') || this.hasRecursiveCalls()) {
      return 'O(n)'; // Stack space for recursion
    }
    
    return 'O(1)';
  }

  private hasRecursiveCalls(): boolean {
    const lines = this.content.split('\n');
    const methodNames: string[] = [];
    
    // Extract method names
    const methodPattern = /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\([^)]*\)/;
    
    for (const line of lines) {
      if (!line) continue; // Skip undefined lines
      
      const match = line.match(methodPattern);
      if (match && match[3]) {
        methodNames.push(match[3]);
      }
    }
    
    // Check if any method calls itself
    for (const methodName of methodNames) {
      const callPattern = new RegExp(`\\b${methodName}\\s*\\(`, 'g');
      const matches = this.content.match(callPattern);
      if (matches && matches.length > 1) { // More than the declaration
        return true;
      }
    }
    
    return false;
  }

  private countParameters(methodLine: string): number {
    const paramMatch = methodLine.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1]) return 0;
    
    const paramString = paramMatch[1].trim();
    if (!paramString) return 0;
    
    return paramString.split(',').length;
  }

  private countFields(classContent: string): number {
    const lines = classContent.split('\n');
    let fieldCount = 0;
    
    const fieldPattern = /^\s*(private|protected|public)?\s*(static)?\s*(final)?\s*\w+\s+\w+/;
    
    for (const line of lines) {
      if (!line) continue; // Skip undefined lines
      
      if (fieldPattern.test(line) && !line.includes('(') && line.includes(';')) {
        fieldCount++;
      }
    }
    
    return fieldCount;
  }
}