// /**
//  * Cyclomatic Complexity Calculator
//  * Measures the number of linearly independent paths through code
//  */

import { CyclomaticConfig } from '../../types';



const DEFAULT_CONFIG: CyclomaticConfig = {
    countCaseStatements: true,
    countLogicalOperators: true,
    countTernary: true
};

export class CyclomaticComplexityCalculator {
    private config: CyclomaticConfig;

    constructor(config: CyclomaticConfig = DEFAULT_CONFIG) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Calculate cyclomatic complexity for the given code content
     * Formula: M = E - N + 2P (where E = edges, N = nodes, P = connected components)
     * Simplified: Count decision points + 1
     */
    calculate(content: string): number {
        if (!content || content.trim().length === 0) {
            return 1; // Base complexity for empty code
        }

        let complexity = 1; // Base complexity

        try {
            // Core decision points (always counted)
            complexity += this.countPattern(content, /\bif\b/g);           // if statements
            complexity += this.countPattern(content, /\belse\s+if\b/g);    // else if statements
            complexity += this.countPattern(content, /\bwhile\b/g);        // while loops
            complexity += this.countPattern(content, /\bfor\b/g);          // for loops
            complexity += this.countPattern(content, /\bdo\b/g);           // do-while loops
            complexity += this.countPattern(content, /\bcatch\b/g);        // catch blocks

            // Switch statements
            const switchCount = this.countPattern(content, /\bswitch\b/g);
            complexity += switchCount;

            // Case statements (optional)
            if (this.config.countCaseStatements) {
                complexity += this.countPattern(content, /\bcase\b/g);
            }

            // Logical operators (optional)
            if (this.config.countLogicalOperators) {
                complexity += this.countPattern(content, /\&\&/g);         // logical AND
                complexity += this.countPattern(content, /\|\|/g);         // logical OR
            }

            // Ternary operators (optional)
            if (this.config.countTernary) {
                complexity += this.countPattern(content, /\?/g);           // ternary operator
            }

        } catch (error) {
            console.error('Error calculating cyclomatic complexity:', error);
            return 1; // Return base complexity on error
        }

        return Math.max(1, complexity);
    }

    /**
     * Calculate complexity with detailed breakdown
     */
    calculateDetailed(content: string): CyclomaticDetails {
        if (!content || content.trim().length === 0) {
            return {
                total: 1,
                breakdown: {},
                interpretation: 'Simple - Low Risk'
            };
        }

        const breakdown: Record<string, number> = {
            ifStatements: this.countPattern(content, /\bif\b/g),
            elseIfStatements: this.countPattern(content, /\belse\s+if\b/g),
            whileLoops: this.countPattern(content, /\bwhile\b/g),
            forLoops: this.countPattern(content, /\bfor\b/g),
            doWhileLoops: this.countPattern(content, /\bdo\b/g),
            switchStatements: this.countPattern(content, /\bswitch\b/g),
            catchBlocks: this.countPattern(content, /\bcatch\b/g),
        };

        if (this.config.countCaseStatements) {
            breakdown.caseStatements = this.countPattern(content, /\bcase\b/g);
        }

        if (this.config.countLogicalOperators) {
            breakdown.logicalAnd = this.countPattern(content, /\&\&/g);
            breakdown.logicalOr = this.countPattern(content, /\|\|/g);
        }

        if (this.config.countTernary) {
            breakdown.ternaryOperators = this.countPattern(content, /\?/g);
        }

        const total = 1 + Object.values(breakdown).reduce((sum, count) => sum + count, 0);

        return {
            total: Math.max(1, total),
            breakdown,
            interpretation: this.interpretComplexity(total)
        };
    }

    /**
     * Count occurrences of a pattern in content
     */
    private countPattern(content: string, pattern: RegExp): number {
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Interpret complexity score
     */
    private interpretComplexity(score: number): string {
        if (score <= 5) return 'Simple - Low Risk';
        if (score <= 10) return 'Moderate - Medium Risk';
        if (score <= 20) return 'Complex - High Risk';
        if (score <= 50) return 'Very Complex - Very High Risk';
        return 'Extremely Complex - Unmaintainable';
    }
}

export interface CyclomaticDetails {
    total: number;
    breakdown: Record<string, number>;
    interpretation: string;
}

// Export a default instance
export const cyclomaticCalculator = new CyclomaticComplexityCalculator();