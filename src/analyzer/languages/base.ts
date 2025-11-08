import { ComplexityMetrics, FunctionAnalysis } from '../../types';

export abstract class BaseAnalyzer {
    protected content: string;
    protected filePath: string;

    constructor(content: string, filePath: string) {
        this.content = content;
        this.filePath = filePath;
    }

    abstract analyzeComplexity(): Promise<ComplexityMetrics>;
    abstract extractFunctions(): Promise<FunctionAnalysis[]>;
    // abstract extractClasses(): Promise<ClassAnalysis[]>;
    // abstract calculateTimeComplexity(): string;
    // abstract calculateSpaceComplexity(): string;

    protected countLines(): number {
        return this.content.split('\n').length;
    }

    // protected calculateCyclomaticComplexity(): number {
    //     // Base implementation - count decision points
    //     // const decisionKeywords = [
    //     //   'if', 'else', 'while', 'for', 'switch', 'case', 'catch',
    //     //   '&&', '||', '?', ':'
    //     // ];

    //     const decisionKeywords = [
    //         /\bif\b/g,           // if statements
    //         /\belse\s+if\b/g,    // else if statements  
    //         /\bwhile\b/g,        // while loops
    //         /\bfor\b/g,          // for loops
    //         /\bdo\b/g,           // do-while loops
    //         /\bswitch\b/g,       // switch statements
    //         /\bcase\b/g,         // case labels
    //         /\bcatch\b/g,        // catch blocks
    //         /\&\&/g,             // logical AND
    //         /\|\|/g,             // logical OR
    //         /\?/g,               // ternary operator
    //     ];
    //     let complexity = 1; // Base complexity

    //     for (const keyword of decisionKeywords) {
    //         const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    //         const matches = this.content.match(regex);
    //         if (matches) {
    //             complexity += matches.length;
    //         }
    //     }

    //     return complexity;
    // }

    //  Working version of cyclomatic complexity calculation

    // protected calculateCyclomaticComplexity(): number {
    //     if (!this.content) return 1;

    //     // Decision points that increase complexity
    //     const decisionPatterns = [
    //         /\bif\b/g,           // if statements
    //         /\belse\s+if\b/g,    // else if statements  
    //         /\bwhile\b/g,        // while loops
    //         /\bfor\b/g,          // for loops
    //         /\bdo\b/g,           // do-while loops
    //         /\bswitch\b/g,       // switch statements
    //         /\bcase\b/g,         // case labels
    //         /\bcatch\b/g,        // catch blocks
    //         /\&\&/g,             // logical AND
    //         /\|\|/g,             // logical OR
    //         /\?/g,               // ternary operator
    //     ];

    //     let complexity = 1; // Base complexity

    //     try {
    //         for (const pattern of decisionPatterns) {
    //             const matches = this.content.match(pattern);
    //             if (matches) {
    //                 complexity += matches.length;
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error calculating cyclomatic complexity:', error);
    //         return 1; // Return base complexity on error
    //     }

    //     return Math.max(1, complexity);
    // }

    // protected calculateCognitiveComplexity(): number {
    //     // Simplified cognitive complexity calculation
    //     const cognitiveKeywords = [
    //         'if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'break', 'continue'
    //     ];

    //     let complexity = 0;
    //     const lines = this.content.split('\n');
    //     let nestingLevel = 0;

    //     for (const line of lines) {
    //         const trimmedLine = line.trim();

    //         // Increase nesting for blocks
    //         if (trimmedLine.includes('{')) nestingLevel++;
    //         if (trimmedLine.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);

    //         // Check for cognitive complexity keywords
    //         for (const keyword of cognitiveKeywords) {
    //             if (trimmedLine.includes(keyword)) {
    //                 complexity += 1 + nestingLevel;
    //                 break;
    //             }
    //         }
    //     }

    //     return complexity;
    // }

    // protected calculateMaintainabilityIndex(complexity: number, linesOfCode: number): number {
    //     // Simplified maintainability index calculation
    //     // Higher is better (0-100 scale)
    //     const halsteadVolume = linesOfCode * 2; // Simplified
    //     const maintainabilityIndex = Math.max(0,
    //         (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
    //     );

    //     return Math.round(maintainabilityIndex);
    // }

    protected calculateCognitiveComplexity(): number {
        if (!this.content) return 0;

        const lines = this.content.split('\n');
        let complexity = 0;
        let nestingLevel = 0;
        let inMultilineComment = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Handle multi-line comments
            if (line.includes('/*')) inMultilineComment = true;
            if (line.includes('*/')) {
                inMultilineComment = false;
                continue;
            }
            if (inMultilineComment || line.startsWith('//') || line.startsWith('*')) {
                continue;
            }

            // Remove inline comments
            line = line.split('//')[0].trim();

            if (!line) continue;

            // === COGNITIVE COMPLEXITY RULES ===

            // 1. if statement: +1 + nesting
            if (/\bif\s*\(/.test(line) && !/\belse\s+if/.test(line)) {
                complexity += 1 + nestingLevel;
            }

            // 2. else if: +1 (no nesting increment)
            else if (/\belse\s+if\s*\(/.test(line)) {
                complexity += 1;
            }

            // 3. else: +1
            else if (/\belse\b(?!\s+if)/.test(line)) {
                complexity += 1;
            }

            // 4. Loops: +1 + nesting
            else if (/\b(for|while|do)\s*\(/.test(line)) {
                complexity += 1 + nestingLevel;
            }

            // 5. switch: +1 + nesting
            else if (/\bswitch\s*\(/.test(line)) {
                complexity += 1 + nestingLevel;
            }

            // 6. case: NO INCREMENT (not in cognitive complexity)
            // (Unlike cyclomatic, case doesn't add cognitive complexity)

            // 7. catch: +1 + nesting
            else if (/\bcatch\s*\(/.test(line)) {
                complexity += 1 + nestingLevel;
            }

            // 8. break/continue: +1
            else if (/\b(break|continue)\s*;/.test(line)) {
                complexity += 1;
            }

            // 9. Logical operators: +1 for EACH (but not for else-if)
            if (!/\belse\s+if/.test(line)) {
                const andOr = (line.match(/&&|\|\|/g) || []).length;
                complexity += andOr;
            }

            // 10. Ternary operator: +1 + nesting
            const ternary = (line.match(/\?/g) || []).length;
            if (ternary > 0) {
                complexity += ternary * (1 + nestingLevel);
            }

            // === UPDATE NESTING LEVEL ===
            // Increment nesting for structures that create blocks
            if (/\b(if|for|while|do|switch|catch|else)\b/.test(line) && !line.endsWith(';')) {
                const openBraces = (line.match(/\{/g) || []).length;
                if (openBraces > 0 || lines[i + 1]?.trim().startsWith('{')) {
                    nestingLevel++;
                }
            }

            // Decrement nesting when blocks close
            const closeBraces = (line.match(/\}/g) || []).length;
            nestingLevel = Math.max(0, nestingLevel - closeBraces);
        }

        return Math.max(0, complexity);
    }

    protected calculateMaintainabilityIndex(complexity: number, linesOfCode: number): number {
        if (linesOfCode === 0 || complexity === 0) return 100;

        try {
            // Simplified maintainability index calculation
            // Based on Microsoft's maintainability index formula
            const halsteadVolume = Math.max(1, linesOfCode * 2); // Simplified Halstead volume
            const cyclomaticComplexity = Math.max(1, complexity);

            const maintainabilityIndex = Math.max(0,
                (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
            );

            return Math.min(100, Math.max(0, Math.round(maintainabilityIndex)));
        } catch (error) {
            console.error('Error calculating maintainability index:', error);
            return 50; // Return neutral score on error
        }
    }
}