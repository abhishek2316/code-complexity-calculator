const { BaseAnalyzer } = require('./base');

/**
 * JavaScript/TypeScript complexity analyzer
 */
class JavaScriptAnalyzer extends BaseAnalyzer {
    constructor() {
        super('javascript');
        this.fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        this.keywords = [
            'function', 'class', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'var', 'let', 'const', 'import', 'export', 'default', 'async', 'await'
        ];
        this.complexityKeywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'throw',
            '&&', '||', '?', 'async', 'await'
        ];
    }

    /**
     * Parse JavaScript/TypeScript code into AST
     * @param {string} code - Source code to parse
     * @returns {Object} AST representation
     */
    parse(code) {
        try {
            // Simple tokenizer and parser for basic JavaScript constructs
            const ast = this.simpleParser(code);
            return ast;
        } catch (error) {
            throw new Error(`JavaScript parse error: ${error.message}`);
        }
    }

    /**
     * Simple JavaScript parser (basic implementation)
     * @param {string} code - Source code
     * @returns {Object} AST
     */
    simpleParser(code) {
        const lines = code.split('\n');
        const ast = {
            type: 'Program',
            body: [],
            sourceType: 'module'
        };

        let currentLine = 0;
        
        while (currentLine < lines.length) {
            const line = lines[currentLine].trim();
            
            if (line === '' || this.isCommentLine(line)) {
                currentLine++;
                continue;
            }

            // Parse different constructs
            if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
                const func = this.parseFunction(lines, currentLine);
                ast.body.push(func.node);
                currentLine = func.endLine;
            } else if (line.includes('class ')) {
                const cls = this.parseClass(lines, currentLine);
                ast.body.push(cls.node);
                currentLine = cls.endLine;
            } else if (line.includes('if ') || line.includes('if(')) {
                const ifStmt = this.parseIfStatement(lines, currentLine);
                ast.body.push(ifStmt.node);
                currentLine = ifStmt.endLine;
            } else if (line.includes('for ') || line.includes('for(')) {
                const forStmt = this.parseForStatement(lines, currentLine);
                ast.body.push(forStmt.node);
                currentLine = forStmt.endLine;
            } else if (line.includes('while ') || line.includes('while(')) {
                const whileStmt = this.parseWhileStatement(lines, currentLine);
                ast.body.push(whileStmt.node);
                currentLine = whileStmt.endLine;
            } else if (line.includes('try ') || line.includes('try{')) {
                const tryStmt = this.parseTryStatement(lines, currentLine);
                ast.body.push(tryStmt.node);
                currentLine = tryStmt.endLine;
            } else {
                // Simple expression or statement
                ast.body.push({
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'Literal',
                        value: line,
                        raw: line
                    },
                    loc: {
                        start: { line: currentLine + 1, column: 0 },
                        end: { line: currentLine + 1, column: line.length }
                    }
                });
                currentLine++;
            }
        }

        return ast;
    }

    /**
     * Parse function declaration or expression
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} Function node and end line
     */
    parseFunction(lines, startLine) {
        const line = lines[startLine].trim();
        let endLine = startLine;
        let braceCount = 0;
        let foundStart = false;

        // Extract function name
        let name = 'anonymous';
        if (line.includes('function ')) {
            const match = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
            if (match) name = match[1];
        } else if (line.includes('const ') && line.includes('=>')) {
            const match = line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
            if (match) name = match[1];
        }

        // Extract parameters
        const params = this.extractParameters(line);

        // Find function body
        for (let i = startLine; i < lines.length; i++) {
            const currentLine = lines[i];
            
            for (const char of currentLine) {
                if (char === '{') {
                    braceCount++;
                    foundStart = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundStart && braceCount === 0) {
                        endLine = i + 1;
                        break;
                    }
                }
            }
            
            if (foundStart && braceCount === 0) {
                break;
            }
        }

        const node = {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: name },
            params: params.map(p => ({ type: 'Identifier', name: p })),
            body: {
                type: 'BlockStatement',
                body: []
            },
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Parse class declaration
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} Class node and end line
     */
    parseClass(lines, startLine) {
        const line = lines[startLine].trim();
        let endLine = startLine;
        let braceCount = 0;
        let foundStart = false;

        // Extract class name
        const match = line.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        const name = match ? match[1] : 'AnonymousClass';

        // Find class body
        for (let i = startLine; i < lines.length; i++) {
            const currentLine = lines[i];
            
            for (const char of currentLine) {
                if (char === '{') {
                    braceCount++;
                    foundStart = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundStart && braceCount === 0) {
                        endLine = i + 1;
                        break;
                    }
                }
            }
            
            if (foundStart && braceCount === 0) {
                break;
            }
        }

        const node = {
            type: 'ClassDeclaration',
            id: { type: 'Identifier', name: name },
            superClass: null,
            body: {
                type: 'ClassBody',
                body: []
            },
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Parse if statement
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} If statement node and end line
     */
    parseIfStatement(lines, startLine) {
        const line = lines[startLine].trim();
        let endLine = startLine + 1;
        let braceCount = 0;
        let foundStart = false;

        // Simple if statement parsing
        for (let i = startLine; i < lines.length; i++) {
            const currentLine = lines[i];
            
            if (currentLine.includes('{')) {
                braceCount++;
                foundStart = true;
            }
            if (currentLine.includes('}')) {
                braceCount--;
                if (foundStart && braceCount === 0) {
                    endLine = i + 1;
                    break;
                }
            }
            
            // Handle single-line if without braces
            if (i === startLine && !currentLine.includes('{')) {
                endLine = i + 1;
                break;
            }
        }

        const node = {
            type: 'IfStatement',
            test: {
                type: 'BinaryExpression',
                operator: '==',
                left: { type: 'Identifier', name: 'condition' },
                right: { type: 'Literal', value: true }
            },
            consequent: {
                type: 'BlockStatement',
                body: []
            },
            alternate: null,
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Parse for statement
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} For statement node and end line
     */
    parseForStatement(lines, startLine) {
        let endLine = this.findBlockEnd(lines, startLine);

        const node = {
            type: 'ForStatement',
            init: null,
            test: null,
            update: null,
            body: {
                type: 'BlockStatement',
                body: []
            },
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Parse while statement
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} While statement node and end line
     */
    parseWhileStatement(lines, startLine) {
        let endLine = this.findBlockEnd(lines, startLine);

        const node = {
            type: 'WhileStatement',
            test: {
                type: 'BinaryExpression',
                operator: '==',
                left: { type: 'Identifier', name: 'condition' },
                right: { type: 'Literal', value: true }
            },
            body: {
                type: 'BlockStatement',
                body: []
            },
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Parse try statement
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {Object} Try statement node and end line
     */
    parseTryStatement(lines, startLine) {
        let endLine = this.findBlockEnd(lines, startLine);

        const node = {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handler: {
                type: 'CatchClause',
                param: { type: 'Identifier', name: 'error' },
                body: {
                    type: 'BlockStatement',
                    body: []
                }
            },
            finalizer: null,
            loc: {
                start: { line: startLine + 1, column: 0 },
                end: { line: endLine, column: 0 }
            }
        };

        return { node, endLine };
    }

    /**
     * Find the end of a block statement
     * @param {string[]} lines - Source code lines
     * @param {number} startLine - Starting line index
     * @returns {number} End line index
     */
    findBlockEnd(lines, startLine) {
        let braceCount = 0;
        let foundStart = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    foundStart = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundStart && braceCount === 0) {
                        return i + 1;
                    }
                }
            }
            
            // Handle single-line statements
            if (i === startLine && !line.includes('{')) {
                return i + 1;
            }
        }
        
        return lines.length;
    }

    /**
     * Extract parameters from function definition
     * @param {string} line - Function definition line
     * @returns {string[]} Array of parameter names
     */
    extractParameters(line) {
        const params = [];
        
        // Find parameter list in parentheses
        const match = line.match(/\(([^)]*)\)/);
        if (match && match[1].trim()) {
            const paramList = match[1].split(',');
            for (const param of paramList) {
                const cleanParam = param.trim().split(/\s+/)[0]; // Remove type annotations
                if (cleanParam) {
                    params.push(cleanParam);
                }
            }
        }
        
        return params;
    }

    /**
     * Extract functions from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of function objects
     */
    extractFunctions(ast) {
        const functions = [];
        
        this.traverse(ast, (node) => {
            if (node.type === 'FunctionDeclaration' || 
                node.type === 'FunctionExpression' || 
                node.type === 'ArrowFunctionExpression') {
                
                const func = {
                    name: node.id ? node.id.name : 'anonymous',
                    node: node,
                    parameters: node.params ? node.params.map(p => p.name) : [],
                    startLine: node.loc ? node.loc.start.line : 0,
                    endLine: node.loc ? node.loc.end.line : 0,
                    type: node.type
                };
                
                functions.push(func);
            }
        });
        
        return functions;
    }

    /**
     * Extract classes from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of class objects
     */
    extractClasses(ast) {
        const classes = [];
        
        this.traverse(ast, (node) => {
            if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
                const methods = [];
                const properties = [];
                
                // Extract methods and properties
                if (node.body && node.body.body) {
                    for (const member of node.body.body) {
                        if (member.type === 'MethodDefinition') {
                            methods.push({
                                name: member.key.name,
                                kind: member.kind,
                                static: member.static
                            });
                        } else if (member.type === 'PropertyDefinition') {
                            properties.push({
                                name: member.key.name,
                                static: member.static
                            });
                        }
                    }
                }
                
                const cls = {
                    name: node.id ? node.id.name : 'AnonymousClass',
                    node: node,
                    methods: methods,
                    properties: properties,
                    startLine: node.loc ? node.loc.start.line : 0,
                    endLine: node.loc ? node.loc.end.line : 0,
                    superClass: node.superClass ? node.superClass.name : null
                };
                
                classes.push(cls);
            }
        });
        
        return classes;
    }

    /**
     * Calculate cyclomatic complexity for a node
     * @param {Object} node - AST node
     * @returns {number} Cyclomatic complexity
     */
    calculateCyclomaticComplexity(node) {
        let complexity = 1; // Base complexity
        
        this.traverse(node, (n) => {
            switch (n.type) {
                case 'IfStatement':
                    complexity += 1;
                    break;
                case 'ConditionalExpression': // Ternary operator
                    complexity += 1;
                    break;
                case 'SwitchCase':
                    if (n.test) complexity += 1; // Don't count default case
                    break;
                case 'ForStatement':
                case 'ForInStatement':
                case 'ForOfStatement':
                case 'WhileStatement':
                case 'DoWhileStatement':
                    complexity += 1;
                    break;
                case 'CatchClause':
                    complexity += 1;
                    break;
                case 'LogicalExpression':
                    if (n.operator === '&&' || n.operator === '||') {
                        complexity += 1;
                    }
                    break;
            }
        });
        
        return complexity;
    }

    /**
     * Calculate cognitive complexity for a node
     * @param {Object} node - AST node
     * @returns {number} Cognitive complexity
     */
    calculateCognitiveComplexity(node) {
        let complexity = 0;
        const nestingLevel = new Map();
        
        this.traverse(node, (n) => {
            const depth = this.calculateNestingDepth(n);
            
            switch (n.type) {
                case 'IfStatement':
                    complexity += 1 + depth;
                    break;
                case 'ConditionalExpression':
                    complexity += 1 + depth;
                    break;
                case 'SwitchStatement':
                    complexity += 1 + depth;
                    break;
                case 'ForStatement':
                case 'ForInStatement':
                case 'ForOfStatement':
                case 'WhileStatement':
                case 'DoWhileStatement':
                    complexity += 1 + depth;
                    break;
                case 'CatchClause':
                    complexity += 1 + depth;
                    break;
                case 'LogicalExpression':
                    if (n.operator === '&&' || n.operator === '||') {
                        complexity += 1;
                    }
                    break;
                case 'BreakStatement':
                case 'ContinueStatement':
                    if (n.label) {
                        complexity += 1;
                    }
                    break;
            }
        });
        
        return complexity;
    }

    /**
     * Check if a line is a comment
     * @param {string} line - Line to check
     * @returns {boolean} Whether line is a comment
     */
    isCommentLine(line) {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || 
               trimmed.startsWith('/*') || 
               trimmed.startsWith('*') ||
               (trimmed.startsWith('/**') && trimmed.endsWith('*/'));
    }

    /**
     * Extract imports from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of import statements
     */
    extractImports(ast) {
        const imports = [];
        
        this.traverse(ast, (node) => {
            if (node.type === 'ImportDeclaration') {
                imports.push({
                    source: node.source.value,
                    specifiers: node.specifiers.map(spec => ({
                        type: spec.type,
                        imported: spec.imported ? spec.imported.name : null,
                        local: spec.local.name
                    }))
                });
            }
        });
        
        return imports;
    }

    /**
     * Extract exports from AST
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of export statements
     */
    extractExports(ast) {
        const exports = [];
        
        this.traverse(ast, (node) => {
            if (node.type === 'ExportNamedDeclaration' || 
                node.type === 'ExportDefaultDeclaration' ||
                node.type === 'ExportAllDeclaration') {
                
                exports.push({
                    type: node.type,
                    declaration: node.declaration,
                    specifiers: node.specifiers || [],
                    source: node.source ? node.source.value : null
                });
            }
        });
        
        return exports;
    }

    /**
     * Get JavaScript-specific complexity patterns
     * @param {Object} ast - Abstract Syntax Tree
     * @returns {Array} Array of complexity patterns
     */
    extractComplexityPatterns(ast) {
        const patterns = super.extractComplexityPatterns(ast);
        
        // JavaScript-specific patterns
        this.traverse(ast, (node) => {
            // Callback hell detection
            if (node.type === 'CallExpression' && node.arguments) {
                const nestedCallbacks = node.arguments.filter(arg => 
                    arg.type === 'FunctionExpression' || 
                    arg.type === 'ArrowFunctionExpression'
                ).length;
                
                if (nestedCallbacks > 2) {
                    patterns.push({
                        type: 'callback_hell',
                        count: nestedCallbacks,
                        node: node,
                        severity: 'high'
                    });
                }
            }
            
            // Promise chain complexity
            if (node.type === 'CallExpression' && 
                node.callee && node.callee.property && 
                (node.callee.property.name === 'then' || node.callee.property.name === 'catch')) {
                
                let chainLength = 0;
                let current = node;
                
                while (current && current.callee && current.callee.property &&
                       (current.callee.property.name === 'then' || current.callee.property.name === 'catch')) {
                    chainLength++;
                    current = current.callee.object;
                }
                
                if (chainLength > 3) {
                    patterns.push({
                        type: 'long_promise_chain',
                        length: chainLength,
                        node: node,
                        severity: chainLength > 5 ? 'high' : 'medium'
                    });
                }
            }
        });
        
        return patterns;
    }
}

module.exports = { JavaScriptAnalyzer };