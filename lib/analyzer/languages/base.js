/**
 * Base analyzer class that defines the interface for language-specific analyzers
 */
class BaseAnalyzer {
    constructor(language) {
        this.language = language;
        this.fileExtensions = [];
        this.keywords = [];
        this.operators = [];
        this.complexityKeywords = [];
    }

    /**
     * Parse source code into an Abstract Syntax Tree (AST)
     * @param {string} code - Source code to parse
     * @returns {Object} AST representation
     */
    parse(code) {
        throw new Error('parse() method must be implemented by subclass');
    }

    /**
     * Extract functions from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of function objects
     */
    extractFunctions(ast) {
        throw new Error('extractFunctions() method must be implemented by subclass');
    }

    /**
     * Extract classes from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of class objects
     */
    extractClasses(ast) {
        throw new Error('extractClasses() method must be implemented by subclass');
    }

    /**
     * Calculate cyclomatic complexity for a node
     * @param {Object} node - AST node
     * @returns {number} Cyclomatic complexity
     */
    calculateCyclomaticComplexity(node) {
        throw new Error('calculateCyclomaticComplexity() method must be implemented by subclass');
    }

    /**
     * Calculate cognitive complexity for a node
     * @param {Object} node - AST node
     * @returns {number} Cognitive complexity
     */
    calculateCognitiveComplexity(node) {
        throw new Error('calculateCognitiveComplexity() method must be implemented by subclass');
    }

    /**
     * Get supported file extensions
     * @returns {string[]} Array of file extensions
     */
    getSupportedExtensions() {
        return this.fileExtensions;
    }

    /**
     * Check if file extension is supported
     * @param {string} extension - File extension
     * @returns {boolean} Whether extension is supported
     */
    supportsExtension(extension) {
        return this.fileExtensions.includes(extension.toLowerCase());
    }

    /**
     * Get language keywords that affect complexity
     * @returns {string[]} Array of keywords
     */
    getComplexityKeywords() {
        return this.complexityKeywords;
    }

    /**
     * Validate if code is syntactically correct
     * @param {string} code - Source code
     * @returns {boolean} Whether code is valid
     */
    validateSyntax(code) {
        try {
            this.parse(code);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Count lines of code (excluding comments and blank lines)
     * @param {string} code - Source code
     * @returns {Object} Line count statistics
     */
    countLines(code) {
        const lines = code.split('\n');
        let total = lines.length;
        let blank = 0;
        let comments = 0;
        let code_lines = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed === '') {
                blank++;
            } else if (this.isCommentLine(trimmed)) {
                comments++;
            } else {
                code_lines++;
            }
        }

        return {
            total,
            blank,
            comments,
            code: code_lines
        };
    }

    /**
     * Check if a line is a comment
     * @param {string} line - Line to check
     * @returns {boolean} Whether line is a comment
     */
    isCommentLine(line) {
        // Default implementation - should be overridden by subclasses
        return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
    }

    /**
     * Extract imports/includes from code
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of import/include statements
     */
    extractImports(ast) {
        // Default implementation - should be overridden by subclasses
        return [];
    }

    /**
     * Extract exports from code
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of export statements
     */
    extractExports(ast) {
        // Default implementation - should be overridden by subclasses
        return [];
    }

    /**
     * Get complexity factors for different constructs
     * @returns {Object} Complexity factor mappings
     */
    getComplexityFactors() {
        return {
            // Basic control structures
            'if': 1,
            'else': 0,
            'elseif': 1,
            'switch': 1,
            'case': 1,
            'default': 0,
            
            // Loops
            'for': 1,
            'foreach': 1,
            'while': 1,
            'do': 1,
            
            // Exception handling
            'try': 0,
            'catch': 1,
            'finally': 0,
            'throw': 1,
            
            // Logical operators
            '&&': 1,
            '||': 1,
            '?': 1, // ternary operator
            
            // Functions
            'function': 1,
            'method': 1,
            'constructor': 1,
            
            // Classes
            'class': 1,
            'interface': 1,
            'abstract': 1
        };
    }

    /**
     * Traverse AST and apply visitor pattern
     * @param {Object} node - AST node to traverse
     * @param {Function} visitor - Visitor function
     * @param {Object} context - Context object
     */
    traverse(node, visitor, context = {}) {
        if (!node || typeof node !== 'object') {
            return;
        }

        // Apply visitor to current node
        visitor(node, context);

        // Recursively traverse child nodes
        for (const key in node) {
            if (node.hasOwnProperty(key) && key !== 'parent') {
                const child = node[key];
                
                if (Array.isArray(child)) {
                    child.forEach(item => {
                        if (item && typeof item === 'object') {
                            item.parent = node;
                            this.traverse(item, visitor, context);
                        }
                    });
                } else if (child && typeof child === 'object') {
                    child.parent = node;
                    this.traverse(child, visitor, context);
                }
            }
        }
    }

    /**
     * Find nodes of specific type
     * @param {Object} ast - Abstract Syntax Tree
     * @param {string} nodeType - Type of nodes to find
     * @returns {Array} Array of matching nodes
     */
    findNodes(ast, nodeType) {
        const nodes = [];
        
        this.traverse(ast, (node) => {
            if (node.type === nodeType) {
                nodes.push(node);
            }
        });
        
        return nodes;
    }

    /**
     * Calculate nesting depth of a node
     * @param {Object} node - AST node
     * @returns {number} Nesting depth
     */
    calculateNestingDepth(node) {
        let depth = 0;
        let current = node.parent;
        
        while (current) {
            if (this.isNestingNode(current)) {
                depth++;
            }
            current = current.parent;
        }
        
        return depth;
    }

    /**
     * Check if node contributes to nesting
     * @param {Object} node - AST node
     * @returns {boolean} Whether node contributes to nesting
     */
    isNestingNode(node) {
        const nestingTypes = [
            'IfStatement', 'WhileStatement', 'ForStatement',
            'DoWhileStatement', 'SwitchStatement', 'TryStatement',
            'CatchClause', 'FunctionDeclaration', 'ArrowFunctionExpression',
            'FunctionExpression', 'ClassDeclaration', 'MethodDefinition'
        ];
        
        return nestingTypes.includes(node.type);
    }

    /**
     * Get metrics for a function
     * @param {Object} func - Function object
     * @returns {Object} Function metrics
     */
    getFunctionMetrics(func) {
        return {
            name: func.name,
            parameters: func.parameters ? func.parameters.length : 0,
            lineCount: func.endLine - func.startLine + 1,
            complexity: {
                cyclomatic: this.calculateCyclomaticComplexity(func.node),
                cognitive: this.calculateCognitiveComplexity(func.node)
            },
            nestingDepth: this.calculateNestingDepth(func.node)
        };
    }

    /**
     * Get metrics for a class
     * @param {Object} cls - Class object
     * @returns {Object} Class metrics
     */
    getClassMetrics(cls) {
        return {
            name: cls.name,
            methods: cls.methods ? cls.methods.length : 0,
            properties: cls.properties ? cls.properties.length : 0,
            lineCount: cls.endLine - cls.startLine + 1,
            complexity: {
                cyclomatic: this.calculateCyclomaticComplexity(cls.node),
                cognitive: this.calculateCognitiveComplexity(cls.node)
            }
        };
    }

    /**
     * Extract code patterns that might indicate complexity
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of pattern objects
     */
    extractComplexityPatterns(ast) {
        const patterns = [];
        
        this.traverse(ast, (node) => {
            // Deep nesting
            const depth = this.calculateNestingDepth(node);
            if (depth > 3) {
                patterns.push({
                    type: 'deep_nesting',
                    depth: depth,
                    node: node,
                    severity: depth > 5 ? 'high' : 'medium'
                });
            }
            
            // Long parameter lists
            if (node.params && node.params.length > 5) {
                patterns.push({
                    type: 'long_parameter_list',
                    count: node.params.length,
                    node: node,
                    severity: node.params.length > 10 ? 'high' : 'medium'
                });
            }
        });
        
        return patterns;
    }
}

module.exports = { BaseAnalyzer };