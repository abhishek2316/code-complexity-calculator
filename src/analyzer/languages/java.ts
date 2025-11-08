import { BaseAnalyzer } from './base';
// import { ComplexityMetrics, FunctionAnalysis, ClassAnalysis } from '../../types';
import { ComplexityMetrics, FunctionAnalysis} from '../../types';
import { cyclomaticCalculator } from '../complexity/cyclomatic';


export class JavaAnalyzer extends BaseAnalyzer {
    async analyzeComplexity(): Promise<ComplexityMetrics> {
        const cyclomatic = cyclomaticCalculator.calculate(this.content);


        // const cognitive = this.calculateCognitiveComplexity();
        // const linesOfCode = this.countLines();
        // const timeComplexity = this.calculateTimeComplexity();
        // const spaceComplexity = this.calculateSpaceComplexity();
        // const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomatic, linesOfCode);

        return {
            cyclomatic,
            // cognitive,
            // timeComplexity,
            // spaceComplexity,
            // // linesOfCode,
            // maintainabilityIndex
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

    // async extractClasses(): Promise<ClassAnalysis[]> {
    //     const classes: ClassAnalysis[] = [];
    //     const lines = this.content.split('\n');

    //     // Java class pattern: access_modifier class ClassName
    //     const classPattern = /^\s*(public|private|protected)?\s*class\s+(\w+)/;

    //     for (let i = 0; i < lines.length; i++) {
    //         const line = lines[i];
    //         if (!line) continue; // Skip undefined lines

    //         const match = line.match(classPattern);

    //         if (match) {
    //             const [, , className] = match;

    //             // Skip if className is missing
    //             if (!className) continue;

    //             // Find class end
    //             let braceCount = 0;
    //             let endLine = i;
    //             let classContent = '';

    //             for (let j = i; j < lines.length; j++) {
    //                 const currentLine = lines[j];
    //                 if (!currentLine) continue; // Skip undefined lines

    //                 classContent += currentLine + '\n';

    //                 braceCount += (currentLine.match(/\{/g) || []).length;
    //                 braceCount -= (currentLine.match(/\}/g) || []).length;

    //                 if (braceCount === 0 && j > i) {
    //                     endLine = j;
    //                     break;
    //                 }
    //             }

    //             // Create temporary analyzer for class
    //             const classAnalyzer = new JavaAnalyzer(classContent, this.filePath);
    //             const complexity = await classAnalyzer.analyzeComplexity();
    //             const methods = await classAnalyzer.extractFunctions();

    //             classes.push({
    //                 name: className,
    //                 startLine: i + 1,
    //                 endLine: endLine + 1,
    //                 methods,
    //                 fields: this.countFields(classContent),
    //                 complexity
    //             });
    //         }
    //     }

    //     return classes;
    // }

    // calculateTimeComplexity(): string {
    //     const content = this.content;
    //     const lowerContent = content.toLowerCase();

    //     // Check for sorting methods (O(n log n))
    //     if (/Arrays\.sort\s*\(|Collections\.sort\s*\(|\.sort\s*\(/i.test(content)) {
    //         return 'O(n log n)';
    //     }

    //     // Check for binary search (O(log n))
    //     if (lowerContent.includes('binarysearch') || /binary\s*search/i.test(content)) {
    //         return 'O(log n)';
    //     }

    //     // Count loop nesting depth
    //     let maxNestingDepth = 0;
    //     let currentDepth = 0;
    //     let braceStack: string[] = [];
    //     const lines = content.split('\n');

    //     for (const line of lines) {
    //         if (!line) continue;
    //         const trimmed = line.trim();

    //         // Skip comments
    //         if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    //             continue;
    //         }

    //         // Check for loop keywords
    //         if (/\b(for|while|do)\s*\(/.test(trimmed)) {
    //             currentDepth++;
    //             maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
    //             braceStack.push('loop');
    //         }

    //         // Track closing braces
    //         const closeBraces = (trimmed.match(/\}/g) || []).length;
    //         for (let i = 0; i < closeBraces; i++) {
    //             if (braceStack.length > 0 && braceStack[braceStack.length - 1] === 'loop') {
    //                 braceStack.pop();
    //                 currentDepth = Math.max(0, currentDepth - 1);
    //             }
    //         }
    //     }

    //     // Check for recursion
    //     if (this.hasRecursiveCalls()) {
    //         // Check if it's divide and conquer (likely O(n log n) or O(log n))
    //         if (lowerContent.includes('/ 2') || lowerContent.includes('/2') || lowerContent.includes('>>')) {
    //             if (maxNestingDepth >= 1) {
    //                 return 'O(n log n)'; // Like merge sort
    //             }
    //             return 'O(log n)'; // Like binary search recursion
    //         }
    //         // Check for memoization/dynamic programming
    //         if (lowerContent.includes('memo') || lowerContent.includes('dp[') || lowerContent.includes('cache')) {
    //             return 'O(n²)'; // Common DP complexity
    //         }
    //         return 'O(2^n)'; // Exponential for simple recursion
    //     }

    //     // Return based on nesting depth
    //     if (maxNestingDepth >= 3) return 'O(n³)';
    //     if (maxNestingDepth === 2) return 'O(n²)';
    //     if (maxNestingDepth === 1) return 'O(n)';

    //     return 'O(1)';
    // }

    // calculateSpaceComplexity(): string {
    //     const content = this.content;
    //     const lowerContent = content.toLowerCase();
    //     const lines = content.split('\n');

    //     // Check for sorting methods that use extra space
    //     if (/Arrays\.sort\s*\(/i.test(content)) {
    //         // Arrays.sort() in Java uses Dual-Pivot Quicksort with O(log n) stack space
    //         return 'O(log n)';
    //     }

    //     if (/Collections\.sort\s*\(/i.test(content)) {
    //         return 'O(n)'; // Collections.sort uses TimSort with O(n) space
    //     }

    //     // Check for array/collection creation with size n
    //     const arrayPattern = /new\s+(int|long|double|float|string|object|boolean|char|byte|short)\s*\[\s*\w+\s*\]/i;
    //     const collectionPattern = /new\s+(arraylist|hashmap|hashset|linkedlist|treemap|treeset|vector|stack|queue|priorityqueue)/i;

    //     let hasNSpaceStructure = false;
    //     for (const line of lines) {
    //         if (!line) continue;
    //         if (arrayPattern.test(line) || collectionPattern.test(line)) {
    //             hasNSpaceStructure = true;
    //             break;
    //         }
    //     }

    //     // Check for recursive calls
    //     if (this.hasRecursiveCalls()) {
    //         // Recursion uses stack space
    //         const maxDepth = this.getRecursionDepth();
    //         if (maxDepth > 1) {
    //             return 'O(n)'; // Deep recursion
    //         }
    //         return 'O(log n)'; // Shallow recursion (divide and conquer)
    //     }

    //     // Check for nested data structures
    //     if (content.includes('[][]') || /\w+\s*\[\s*\]\s*\[\s*\]/.test(content)) {
    //         return 'O(n²)';
    //     }

    //     if (hasNSpaceStructure) {
    //         return 'O(n)';
    //     }

    //     return 'O(1)';
    // }

    // private getRecursionDepth(): number {
    //     // Simple heuristic: check for divide-by-2 patterns
    //     const lowerContent = this.content.toLowerCase();
    //     if (lowerContent.includes('/ 2') || lowerContent.includes('/2')) {
    //         return 1; // Log depth (divide and conquer)
    //     }
    //     return 2; // Assume linear depth
    // }

    // private hasRecursiveCalls(): boolean {
    //     const lines = this.content.split('\n');
    //     const methodNames: Set<string> = new Set();

    //     // Extract method names with better pattern
    //     const methodPattern = /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*\{?/;

    //     for (const line of lines) {
    //         if (!line) continue;

    //         const match = line.match(methodPattern);
    //         if (match && match[3]) {
    //             methodNames.add(match[3]);
    //         }
    //     }

    //     // Check if any method calls itself within its body
    //     for (const methodName of methodNames) {
    //         // Find method body
    //         let inMethod = false;
    //         let braceCount = 0;

    //         for (const line of lines) {
    //             if (!line) continue;

    //             // Check if this line declares the method
    //             if (line.includes(methodName + '(') && /^\s*(public|private|protected)/.test(line)) {
    //                 inMethod = true;
    //             }

    //             if (inMethod) {
    //                 braceCount += (line.match(/\{/g) || []).length;
    //                 braceCount -= (line.match(/\}/g) || []).length;

    //                 // Check for recursive call (excluding the declaration line)
    //                 if (braceCount > 0 && new RegExp(`\\b${methodName}\\s*\\(`).test(line)) {
    //                     return true;
    //                 }

    //                 // Method ended
    //                 if (braceCount === 0 && inMethod) {
    //                     inMethod = false;
    //                 }
    //             }
    //         }
    //     }

    //     return false;
    // }

    private countParameters(methodLine: string): number {
        const paramMatch = methodLine.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1]) return 0;

        const paramString = paramMatch[1].trim();
        if (!paramString) return 0;

        return paramString.split(',').length;
    }

    // private countFields(classContent: string): number {
    //     const lines = classContent.split('\n');
    //     let fieldCount = 0;

    //     const fieldPattern = /^\s*(private|protected|public)?\s*(static)?\s*(final)?\s*\w+\s+\w+/;

    //     for (const line of lines) {
    //         if (!line) continue; // Skip undefined lines

    //         if (fieldPattern.test(line) && !line.includes('(') && line.includes(';')) {
    //             fieldCount++;
    //         }
    //     }

    //     return fieldCount;
    // }
}