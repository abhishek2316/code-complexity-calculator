import { ComplexityMetrics, FunctionAnalysis, ClassAnalysis } from '../../types';

export abstract class BaseAnalyzer {
    protected content: string;
    protected filePath: string;

    constructor(content: string, filePath: string) {
        this.content = content;
        this.filePath = filePath;
    }

    abstract analyzeComplexity(): Promise<ComplexityMetrics>;
    abstract extractFunctions(): Promise<FunctionAnalysis[]>;
    abstract extractClasses(): Promise<ClassAnalysis[]>;
    abstract calculateTimeComplexity(): string;
    abstract calculateSpaceComplexity(): string;

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

    protected calculateCyclomaticComplexity(): number {
        if (!this.content) return 1;

        // Decision points that increase complexity
        const decisionPatterns = [
            /\bif\b/g,           // if statements
            /\belse\s+if\b/g,    // else if statements  
            /\bwhile\b/g,        // while loops
            /\bfor\b/g,          // for loops
            /\bdo\b/g,           // do-while loops
            /\bswitch\b/g,       // switch statements
            /\bcase\b/g,         // case labels
            /\bcatch\b/g,        // catch blocks
            /\&\&/g,             // logical AND
            /\|\|/g,             // logical OR
            /\?/g,               // ternary operator
        ];

        let complexity = 1; // Base complexity

        try {
            for (const pattern of decisionPatterns) {
                const matches = this.content.match(pattern);
                if (matches) {
                    complexity += matches.length;
                }
            }
        } catch (error) {
            console.error('Error calculating cyclomatic complexity:', error);
            return 1; // Return base complexity on error
        }

        return Math.max(1, complexity);
    }

    protected calculateCognitiveComplexity(): number {
        // Simplified cognitive complexity calculation
        const cognitiveKeywords = [
            'if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'break', 'continue'
        ];

        let complexity = 0;
        const lines = this.content.split('\n');
        let nestingLevel = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Increase nesting for blocks
            if (trimmedLine.includes('{')) nestingLevel++;
            if (trimmedLine.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);

            // Check for cognitive complexity keywords
            for (const keyword of cognitiveKeywords) {
                if (trimmedLine.includes(keyword)) {
                    complexity += 1 + nestingLevel;
                    break;
                }
            }
        }

        return complexity;
    }

    protected calculateMaintainabilityIndex(complexity: number, linesOfCode: number): number {
        // Simplified maintainability index calculation
        // Higher is better (0-100 scale)
        const halsteadVolume = linesOfCode * 2; // Simplified
        const maintainabilityIndex = Math.max(0,
            (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
        );

        return Math.round(maintainabilityIndex);
    }
}