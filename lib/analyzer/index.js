const fs = require('fs').promises;
const path = require('path');
const { LanguageRegistry } = require('./languages/registry');
const { CyclomaticComplexityCalculator } = require('./complexity/cyclomatic');
const { CognitiveComplexityCalculator } = require('./complexity/cognitive');
const { TimeComplexityCalculator } = require('./complexity/time');
const { SpaceComplexityCalculator } = require('./complexity/space');
const { MetricsCalculator } = require('./complexity/metrics');
const { LanguageDetector } = require('./detectors/languageDetector');

class ComplexityAnalyzer {
    constructor(options = {}) {
        this.options = {
            includeTests: false,
            includeNodeModules: false,
            maxFileSize: 1024 * 1024, // 1MB
            timeout: 30000, // 30 seconds
            ...options
        };
        
        this.registry = new LanguageRegistry();
        this.languageDetector = new LanguageDetector();
        this.metrics = new MetricsCalculator();
        
        // Initialize complexity calculators
        this.cyclomaticCalculator = new CyclomaticComplexityCalculator();
        this.cognitiveCalculator = new CognitiveComplexityCalculator();
        this.timeCalculator = new TimeComplexityCalculator();
        this.spaceCalculator = new SpaceComplexityCalculator();
    }

    /**
     * Analyze a single file
     * @param {string} filePath - Path to the file to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            // Check file size
            if (stats.size > this.options.maxFileSize) {
                throw new Error(`File too large: ${stats.size} bytes`);
            }

            const content = await fs.readFile(filePath, 'utf-8');
            const language = this.languageDetector.detectLanguage(filePath, content);
            
            if (!language) {
                throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
            }

            const analyzer = this.registry.getAnalyzer(language);
            if (!analyzer) {
                throw new Error(`No analyzer found for language: ${language}`);
            }

            // Parse the file
            const ast = analyzer.parse(content);
            
            // Calculate complexities
            const results = {
                file: filePath,
                language: language,
                size: stats.size,
                lines: content.split('\n').length,
                timestamp: new Date().toISOString(),
                complexity: {
                    cyclomatic: this.cyclomaticCalculator.calculate(ast, language),
                    cognitive: this.cognitiveCalculator.calculate(ast, language),
                    time: this.timeCalculator.estimate(ast, language),
                    space: this.spaceCalculator.estimate(ast, language)
                },
                functions: [],
                classes: [],
                metrics: {}
            };

            // Extract functions and their complexities
            const functions = analyzer.extractFunctions(ast);
            results.functions = functions.map(func => ({
                name: func.name,
                startLine: func.startLine,
                endLine: func.endLine,
                parameters: func.parameters,
                complexity: {
                    cyclomatic: this.cyclomaticCalculator.calculateFunction(func.node, language),
                    cognitive: this.cognitiveCalculator.calculateFunction(func.node, language)
                }
            }));

            // Extract classes and their complexities
            const classes = analyzer.extractClasses(ast);
            results.classes = classes.map(cls => ({
                name: cls.name,
                startLine: cls.startLine,
                endLine: cls.endLine,
                methods: cls.methods,
                properties: cls.properties,
                complexity: {
                    cyclomatic: this.cyclomaticCalculator.calculateClass(cls.node, language),
                    cognitive: this.cognitiveCalculator.calculateClass(cls.node, language)
                }
            }));

            // Calculate overall metrics
            results.metrics = this.metrics.calculate(results);

            return results;
        } catch (error) {
            return {
                file: filePath,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyze multiple files
     * @param {string[]} filePaths - Array of file paths to analyze
     * @returns {Promise<Object>} Combined analysis results
     */
    async analyzeFiles(filePaths) {
        const results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: filePaths.length,
                analyzedFiles: 0,
                errorFiles: 0,
                languages: new Set(),
                totalLines: 0,
                totalSize: 0
            },
            files: [],
            aggregated: {
                complexity: {
                    cyclomatic: { min: Infinity, max: 0, avg: 0, total: 0 },
                    cognitive: { min: Infinity, max: 0, avg: 0, total: 0 }
                },
                functions: {
                    total: 0,
                    mostComplex: null,
                    averageComplexity: 0
                },
                classes: {
                    total: 0,
                    mostComplex: null,
                    averageComplexity: 0
                }
            }
        };

        // Process files in parallel with concurrency limit
        const concurrency = Math.min(10, filePaths.length);
        const chunks = this.chunkArray(filePaths, concurrency);
        
        for (const chunk of chunks) {
            const chunkResults = await Promise.all(
                chunk.map(filePath => this.analyzeFile(filePath))
            );
            
            for (const result of chunkResults) {
                results.files.push(result);
                
                if (result.error) {
                    results.summary.errorFiles++;
                    continue;
                }
                
                results.summary.analyzedFiles++;
                results.summary.languages.add(result.language);
                results.summary.totalLines += result.lines;
                results.summary.totalSize += result.size;
                
                // Update aggregated stats
                this.updateAggregatedStats(results.aggregated, result);
            }
        }

        // Convert Set to Array for JSON serialization
        results.summary.languages = Array.from(results.summary.languages);
        
        // Calculate final averages
        this.finalizeAggregatedStats(results.aggregated, results.summary.analyzedFiles);
        
        return results;
    }

    /**
     * Analyze a directory
     * @param {string} dirPath - Path to the directory to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeDirectory(dirPath) {
        const files = await this.findSourceFiles(dirPath);
        return this.analyzeFiles(files);
    }

    /**
     * Find source files in a directory
     * @param {string} dirPath - Directory path
     * @returns {Promise<string[]>} Array of file paths
     */
    async findSourceFiles(dirPath) {
        const files = [];
        
        async function traverse(currentPath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip certain directories
                    if (this.shouldSkipDirectory(entry.name)) {
                        continue;
                    }
                    await traverse.call(this, fullPath);
                } else if (entry.isFile()) {
                    if (this.shouldAnalyzeFile(fullPath)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        
        await traverse.call(this, dirPath);
        return files;
    }

    /**
     * Check if a directory should be skipped
     * @param {string} dirName - Directory name
     * @returns {boolean} Whether to skip the directory
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules', '.git', '.svn', '.hg',
            'dist', 'build', 'target', 'bin', 'obj',
            '.idea', '.vscode', '__pycache__', '.pytest_cache'
        ];
        
        if (!this.options.includeNodeModules && dirName === 'node_modules') {
            return true;
        }
        
        if (!this.options.includeTests && (dirName.includes('test') || dirName.includes('spec'))) {
            return true;
        }
        
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }

    /**
     * Check if a file should be analyzed
     * @param {string} filePath - File path
     * @returns {boolean} Whether to analyze the file
     */
    shouldAnalyzeFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.java'];
        
        if (!supportedExtensions.includes(ext)) {
            return false;
        }
        
        if (!this.options.includeTests && this.isTestFile(filePath)) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if a file is a test file
     * @param {string} filePath - File path
     * @returns {boolean} Whether the file is a test file
     */
    isTestFile(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        const testPatterns = [
            'test', 'spec', '.test.', '.spec.',
            'tests', 'specs', '__tests__'
        ];
        
        return testPatterns.some(pattern => fileName.includes(pattern));
    }

    /**
     * Split array into chunks
     * @param {Array} array - Array to chunk
     * @param {number} size - Chunk size
     * @returns {Array[]} Array of chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Update aggregated statistics
     * @param {Object} aggregated - Aggregated stats object
     * @param {Object} result - File analysis result
     */
    updateAggregatedStats(aggregated, result) {
        const { complexity, functions, classes } = result;
        
        // Update complexity stats
        if (complexity.cyclomatic.total !== undefined) {
            aggregated.complexity.cyclomatic.min = Math.min(
                aggregated.complexity.cyclomatic.min, 
                complexity.cyclomatic.total
            );
            aggregated.complexity.cyclomatic.max = Math.max(
                aggregated.complexity.cyclomatic.max, 
                complexity.cyclomatic.total
            );
            aggregated.complexity.cyclomatic.total += complexity.cyclomatic.total;
        }
        
        if (complexity.cognitive.total !== undefined) {
            aggregated.complexity.cognitive.min = Math.min(
                aggregated.complexity.cognitive.min, 
                complexity.cognitive.total
            );
            aggregated.complexity.cognitive.max = Math.max(
                aggregated.complexity.cognitive.max, 
                complexity.cognitive.total
            );
            aggregated.complexity.cognitive.total += complexity.cognitive.total;
        }
        
        // Update function stats
        aggregated.functions.total += functions.length;
        
        // Update class stats
        aggregated.classes.total += classes.length;
    }

    /**
     * Finalize aggregated statistics
     * @param {Object} aggregated - Aggregated stats object
     * @param {number} totalFiles - Total number of analyzed files
     */
    finalizeAggregatedStats(aggregated, totalFiles) {
        if (totalFiles > 0) {
            aggregated.complexity.cyclomatic.avg = 
                aggregated.complexity.cyclomatic.total / totalFiles;
            aggregated.complexity.cognitive.avg = 
                aggregated.complexity.cognitive.total / totalFiles;
        }
        
        // Handle edge cases
        if (aggregated.complexity.cyclomatic.min === Infinity) {
            aggregated.complexity.cyclomatic.min = 0;
        }
        if (aggregated.complexity.cognitive.min === Infinity) {
            aggregated.complexity.cognitive.min = 0;
        }
    }
}

module.exports = { ComplexityAnalyzer };