const BaseAnalyzer = require('./base');

/**
 * Java Complexity Analyzer
 * Analyzes Java code for various complexity metrics
 */
class JavaAnalyzer extends BaseAnalyzer {
    constructor(options = {}) {
        super(options);
        this.language = 'java';
        
        // Java-specific patterns
        this.patterns = {
            // Control flow patterns
            controlFlow: /\b(if|else|while|for|do|switch|case|default)\b/g,
            loops: /\b(for|while|do)\b/g,
            conditionals: /\b(if|else|switch|case)\b/g,
            
            // Method and class patterns
            methods: /(?:public|private|protected|static|final|abstract|synchronized|native|strictfp)?\s*(?:public|private|protected|static|final|abstract|synchronized|native|strictfp)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*\{/g,
            classes: /(?:public|private|protected|static|final|abstract)?\s*class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w\s,]+)?\s*\{/g,
            interfaces: /(?:public|private|protected)?\s*interface\s+(\w+)(?:\s+extends\s+[\w\s,]+)?\s*\{/g,
            
            // Exception handling
            exceptions: /\b(try|catch|finally|throw|throws)\b/g,
            
            // Comments
            singleLineComments: /\/\/.*$/gm,
            multiLineComments: /\/\*[\s\S]*?\*\//g,
            
            // Strings
            strings: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
            
            // Logical operators
            logicalOperators: /&&|\|\||!(?!=)/g,
            
            // Complex expressions
            ternary: /\?.*?:/g,
            lambdas: /\([^)]*\)\s*->/g,
            
            // Nesting indicators
            openBrace: /\{/g,
            closeBrace: /\}/g,
            
            // Java-specific complexity patterns
            generics: /<[^>]+>/g,
            annotations: /@\w+(?:\([^)]*\))?/g,
            enums: /enum\s+\w+/g,
            
            // Stream operations (Java 8+)
            streams: /\.(?:stream|parallelStream|map|filter|reduce|collect|forEach|anyMatch|allMatch|noneMatch)\s*\(/g,
            
            // Reflection usage
            reflection: /\.(?:getClass|forName|getDeclaredMethod|getMethod|newInstance)\s*\(/g,
            
            // Synchronization
            synchronized: /\bsynchronized\b/g,
            
            // Recursion detection
            recursion: /(\w+)\s*\([^)]*\)\s*\{[^}]*\1\s*\(/g
        };
    }

    /**
     * Analyze Java code
     * @param {string} code - Java source code
     * @param {string} filePath - File path
     * @returns {Object} Analysis results
     */
    analyze(code, filePath) {
        // Remove comments and strings for accurate analysis
        const cleanCode = this.removeCommentsAndStrings(code);
        
        const analysis = {
            language: this.language,
            filePath,
            metrics: this.calculateComplexity(cleanCode),
            structure: this.analyzeStructure(cleanCode),
            issues: this.detectIssues(cleanCode),
            suggestions: []
        };

        // Add suggestions based on complexity
        analysis.suggestions = this.generateSuggestions(analysis);

        return analysis;
    }

    /**
     * Calculate complexity metrics for Java code
     * @param {string} code - Clean Java code
     * @returns {Object} Complexity metrics
     */
    calculateComplexity(code) {
        const cyclomatic = this.calculateCyclomaticComplexity(code);
        const cognitive = this.calculateCognitiveComplexity(code);
        const nesting = this.calculateNestingDepth(code);
        
        return {
            cyclomatic,
            cognitive,
            nesting,
            lines: this.countLines(code),
            methods: this.countMethods(code),
            classes: this.countClasses(code),
            overall: this.calculateOverallComplexity(cyclomatic, cognitive, nesting)
        };
    }

    /**
     * Calculate cyclomatic complexity
     * @param {string} code - Java code
     * @returns {number} Cyclomatic complexity
     */
    calculateCyclomaticComplexity(code) {
        let complexity = 1; // Base complexity
        
        // Count decision points
        const controlFlowMatches = code.match(this.patterns.controlFlow) || [];
        const logicalMatches = code.match(this.patterns.logicalOperators) || [];
        const ternaryMatches = code.match(this.patterns.ternary) || [];
        const exceptionMatches = code.match(/\bcatch\b/g) || [];
        
        complexity += controlFlowMatches.length;
        complexity += logicalMatches.length;
        complexity += ternaryMatches.length;
        complexity += exceptionMatches.length;
        
        // Case statements add complexity
        const caseMatches = code.match(/\bcase\b/g) || [];
        complexity += caseMatches.length;
        
        return complexity;
    }

    /**
     * Calculate cognitive complexity (Java-specific)
     * @param {string} code - Java code
     * @returns {number} Cognitive complexity
     */
    calculateCognitiveComplexity(code) {
        let complexity = 0;
        let nestingLevel = 0;
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Track nesting level
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            
            // Check for complexity-adding constructs
            if (this.isComplexityIncreasingConstruct(line)) {
                complexity += 1 + nestingLevel;
            }
            
            // Update nesting level
            nestingLevel += openBraces - closeBraces;
            nestingLevel = Math.max(0, nestingLevel);
        }
        
        return complexity;
    }

    /**
     * Check if line contains complexity-increasing constructs
     * @param {string} line - Code line
     * @returns {boolean} True if line increases complexity
     */
    isComplexityIncreasingConstruct(line) {
        const complexityPatterns = [
            /\bif\b/,
            /\belse\s+if\b/,
            /\bwhile\b/,
            /\bfor\b/,
            /\bdo\b/,
            /\bswitch\b/,
            /\bcatch\b/,
            /\bcase\b/,
            /&&/,
            /\|\|/,
            /\?.*:/
        ];
        
        return complexityPatterns.some(pattern => pattern.test(line));
    }

    /**
     * Calculate maximum nesting depth
     * @param {string} code - Java code
     * @returns {number} Maximum nesting depth
     */
    calculateNestingDepth(code) {
        let depth = 0;
        let maxDepth = 0;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            if (char === '{') {
                depth++;
                maxDepth = Math.max(maxDepth, depth);
            } else if (char === '}') {
                depth--;
            }
        }
        
        return maxDepth;
    }

    /**
     * Count methods in Java code
     * @param {string} code - Java code
     * @returns {number} Method count
     */
    countMethods(code) {
        const matches = code.match(this.patterns.methods) || [];
        return matches.length;
    }

    /**
     * Count classes in Java code
     * @param {string} code - Java code
     * @returns {number} Class count
     */
    countClasses(code) {
        const classMatches = code.match(this.patterns.classes) || [];
        const interfaceMatches = code.match(this.patterns.interfaces) || [];
        const enumMatches = code.match(this.patterns.enums) || [];
        
        return classMatches.length + interfaceMatches.length + enumMatches.length;
    }

    /**
     * Analyze code structure
     * @param {string} code - Java code
     * @returns {Object} Structure analysis
     */
    analyzeStructure(code) {
        return {
            classes: this.extractClasses(code),
            methods: this.extractMethods(code),
            packages: this.extractPackages(code),
            imports: this.extractImports(code),
            annotations: this.extractAnnotations(code)
        };
    }

    /**
     * Extract class information
     * @param {string} code - Java code
     * @returns {Array} Class information
     */
    extractClasses(code) {
        const classes = [];
        const classMatches = code.matchAll(this.patterns.classes);
        
        for (const match of classMatches) {
            classes.push({
                name: match[1],
                type: 'class',
                line: this.getLineNumber(code, match.index)
            });
        }
        
        const interfaceMatches = code.matchAll(this.patterns.interfaces);
        for (const match of interfaceMatches) {
            classes.push({
                name: match[1],
                type: 'interface',
                line: this.getLineNumber(code, match.index)
            });
        }
        
        return classes;
    }

    /**
     * Extract method information
     * @param {string} code - Java code
     * @returns {Array} Method information
     */
    extractMethods(code) {
        const methods = [];
        const methodMatches = code.matchAll(this.patterns.methods);
        
        for (const match of methodMatches) {
            methods.push({
                name: match[1],
                line: this.getLineNumber(code, match.index),
                complexity: this.calculateMethodComplexity(match[0])
            });
        }
        
        return methods;
    }

    /**
     * Extract package information
     * @param {string} code - Java code
     * @returns {string|null} Package name
     */
    extractPackages(code) {
        const packageMatch = code.match(/package\s+([\w.]+);/);
        return packageMatch ? packageMatch[1] : null;
    }

    /**
     * Extract import statements
     * @param {string} code - Java code
     * @returns {Array} Import statements
     */
    extractImports(code) {
        const imports = [];
        const importMatches = code.matchAll(/import\s+(?:static\s+)?([\w.*]+);/g);
        
        for (const match of importMatches) {
            imports.push(match[1]);
        }
        
        return imports;
    }

    /**
     * Extract annotations
     * @param {string} code - Java code
     * @returns {Array} Annotations
     */
    extractAnnotations(code) {
        const annotations = [];
        const annotationMatches = code.matchAll(this.patterns.annotations);
        
        for (const match of annotationMatches) {
            annotations.push({
                name: match[0],
                line: this.getLineNumber(code, match.index)
            });
        }
        
        return annotations;
    }

    /**
     * Calculate method-specific complexity
     * @param {string} methodCode - Method code
     * @returns {number} Method complexity
     */
    calculateMethodComplexity(methodCode) {
        return this.calculateCyclomaticComplexity(methodCode);
    }

    /**
     * Detect code issues
     * @param {string} code - Java code
     * @returns {Array} Detected issues
     */
    detectIssues(code) {
        const issues = [];
        
        // Long methods
        const methods = this.extractMethods(code);
        methods.forEach(method => {
            if (method.complexity > 10) {
                issues.push({
                    type: 'high_complexity',
                    severity: 'warning',
                    message: `Method '${method.name}' has high complexity (${method.complexity})`,
                    line: method.line
                });
            }
        });
        
        // Nested complexity
        const nestingDepth = this.calculateNestingDepth(code);
        if (nestingDepth > 4) {
            issues.push({
                type: 'deep_nesting',
                severity: 'warning',
                message: `Deep nesting detected (depth: ${nestingDepth})`,
                line: null
            });
        }
        
        // God classes
        const lines = this.countLines(code);
        if (lines > 500) {
            issues.push({
                type: 'god_class',
                severity: 'warning',
                message: `Class is too large (${lines} lines)`,
                line: null
            });
        }
        
        return issues;
    }

    /**
     * Generate suggestions based on analysis
     * @param {Object} analysis - Analysis results
     * @returns {Array} Suggestions
     */
    generateSuggestions(analysis) {
        const suggestions = [];
        
        if (analysis.metrics.cyclomatic > 15) {
            suggestions.push({
                type: 'refactor',
                message: 'Consider breaking down complex methods into smaller, more focused methods',
                priority: 'high'
            });
        }
        
        if (analysis.metrics.nesting > 4) {
            suggestions.push({
                type: 'refactor',
                message: 'Reduce nesting depth by extracting methods or using early returns',
                priority: 'medium'
            });
        }
        
        if (analysis.metrics.lines > 500) {
            suggestions.push({
                type: 'refactor',
                message: 'Consider splitting large classes into smaller, more cohesive classes',
                priority: 'medium'
            });
        }
        
        return suggestions;
    }

    /**
     * Remove comments and strings from code
     * @param {string} code - Java code
     * @returns {string} Clean code
     */
    removeCommentsAndStrings(code) {
        // Remove multi-line comments
        code = code.replace(this.patterns.multiLineComments, '');
        
        // Remove single-line comments
        code = code.replace(this.patterns.singleLineComments, '');
        
        // Remove strings
        code = code.replace(this.patterns.strings, '""');
        
        return code;
    }

    /**
     * Get line number for a given index
     * @param {string} code - Source code
     * @param {number} index - Character index
     * @returns {number} Line number
     */
    getLineNumber(code, index) {
        return code.substring(0, index).split('\n').length;
    }

    /**
     * Count lines of code
     * @param {string} code - Source code
     * @returns {number} Line count
     */
    countLines(code) {
        return code.split('\n').length;
    }

    /**
     * Calculate overall complexity score
     * @param {number} cyclomatic - Cyclomatic complexity
     * @param {number} cognitive - Cognitive complexity
     * @param {number} nesting - Nesting depth
     * @returns {number} Overall complexity score
     */
    calculateOverallComplexity(cyclomatic, cognitive, nesting) {
        // Weighted average of different complexity metrics
        return Math.round(
            (cyclomatic * 0.4 + cognitive * 0.4 + nesting * 0.2)
        );
    }
}

module.exports = JavaAnalyzer;