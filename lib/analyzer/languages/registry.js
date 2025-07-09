const path = require('path');
const fs = require('fs');

/**
 * Language Registry - Manages language analyzers and their registration
 */
class LanguageRegistry {
    constructor() {
        this.analyzers = new Map();
        this.extensions = new Map();
        this.aliases = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the registry with built-in analyzers
     */
    initialize() {
        if (this.initialized) {
            return;
        }

        // Register built-in analyzers
        this.registerBuiltInAnalyzers();
        this.initialized = true;
    }

    /**
     * Register built-in language analyzers
     */
    registerBuiltInAnalyzers() {
        try {
            // JavaScript/TypeScript
            const JavaScriptAnalyzer = require('./javascript');
            this.register('javascript', JavaScriptAnalyzer, {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
                aliases: ['js', 'ts', 'typescript', 'node', 'react']
            });

            // Python
            const PythonAnalyzer = require('./python');
            this.register('python', PythonAnalyzer, {
                extensions: ['.py', '.pyw', '.pyi'],
                aliases: ['py', 'python3']
            });

            // Java
            const JavaAnalyzer = require('./java');
            this.register('java', JavaAnalyzer, {
                extensions: ['.java'],
                aliases: ['java']
            });

            // C++
            const CppAnalyzer = require('./cpp');
            this.register('cpp', CppAnalyzer, {
                extensions: ['.cpp', '.cc', '.cxx', '.c++', '.C', '.hpp', '.hh', '.hxx', '.h++', '.H'],
                aliases: ['c++', 'cxx', 'cplusplus']
            });

        } catch (error) {
            console.warn('Warning: Some language analyzers could not be loaded:', error.message);
        }
    }

    /**
     * Register a language analyzer
     * @param {string} name - Language name
     * @param {Class} AnalyzerClass - Analyzer class
     * @param {Object} options - Registration options
     */
    register(name, AnalyzerClass, options = {}) {
        const normalizedName = name.toLowerCase();
        
        // Validate analyzer class
        if (!this.isValidAnalyzer(AnalyzerClass)) {
            throw new Error(`Invalid analyzer class for language: ${name}`);
        }

        // Register analyzer
        this.analyzers.set(normalizedName, {
            name: normalizedName,
            class: AnalyzerClass,
            extensions: options.extensions || [],
            aliases: options.aliases || [],
            metadata: options.metadata || {}
        });

        // Register file extensions
        if (options.extensions) {
            options.extensions.forEach(ext => {
                this.extensions.set(ext.toLowerCase(), normalizedName);
            });
        }

        // Register aliases
        if (options.aliases) {
            options.aliases.forEach(alias => {
                this.aliases.set(alias.toLowerCase(), normalizedName);
            });
        }
    }

    /**
     * Validate if a class is a valid analyzer
     * @param {Class} AnalyzerClass - Class to validate
     * @returns {boolean}
     */
    isValidAnalyzer(AnalyzerClass) {
        if (typeof AnalyzerClass !== 'function') {
            return false;
        }

        // Check if it has required methods (basic duck typing)
        const prototype = AnalyzerClass.prototype;
        const requiredMethods = ['analyze', 'calculateComplexity'];
        
        return requiredMethods.every(method => 
            typeof prototype[method] === 'function'
        );
    }

    /**
     * Get analyzer by language name
     * @param {string} language - Language name or alias
     * @returns {Object|null} Analyzer info
     */
    getAnalyzer(language) {
        this.initialize();
        
        const normalizedLanguage = language.toLowerCase();
        
        // Direct lookup
        if (this.analyzers.has(normalizedLanguage)) {
            return this.analyzers.get(normalizedLanguage);
        }

        // Alias lookup
        if (this.aliases.has(normalizedLanguage)) {
            const actualLanguage = this.aliases.get(normalizedLanguage);
            return this.analyzers.get(actualLanguage);
        }

        return null;
    }

    /**
     * Get analyzer by file extension
     * @param {string} extension - File extension
     * @returns {Object|null} Analyzer info
     */
    getAnalyzerByExtension(extension) {
        this.initialize();
        
        const normalizedExt = extension.toLowerCase();
        if (this.extensions.has(normalizedExt)) {
            const language = this.extensions.get(normalizedExt);
            return this.analyzers.get(language);
        }

        return null;
    }

    /**
     * Get analyzer by file path
     * @param {string} filePath - File path
     * @returns {Object|null} Analyzer info
     */
    getAnalyzerByPath(filePath) {
        const extension = path.extname(filePath);
        return this.getAnalyzerByExtension(extension);
    }

    /**
     * Create analyzer instance
     * @param {string} language - Language name
     * @param {Object} options - Analyzer options
     * @returns {Object|null} Analyzer instance
     */
    createAnalyzer(language, options = {}) {
        const analyzerInfo = this.getAnalyzer(language);
        if (!analyzerInfo) {
            return null;
        }

        return new analyzerInfo.class(options);
    }

    /**
     * Create analyzer instance by file path
     * @param {string} filePath - File path
     * @param {Object} options - Analyzer options
     * @returns {Object|null} Analyzer instance
     */
    createAnalyzerByPath(filePath, options = {}) {
        const analyzerInfo = this.getAnalyzerByPath(filePath);
        if (!analyzerInfo) {
            return null;
        }

        return new analyzerInfo.class(options);
    }

    /**
     * Get all supported languages
     * @returns {Array} Array of language names
     */
    getSupportedLanguages() {
        this.initialize();
        return Array.from(this.analyzers.keys());
    }

    /**
     * Get all supported file extensions
     * @returns {Array} Array of file extensions
     */
    getSupportedExtensions() {
        this.initialize();
        return Array.from(this.extensions.keys());
    }

    /**
     * Check if language is supported
     * @param {string} language - Language name
     * @returns {boolean}
     */
    isLanguageSupported(language) {
        return this.getAnalyzer(language) !== null;
    }

    /**
     * Check if file extension is supported
     * @param {string} extension - File extension
     * @returns {boolean}
     */
    isExtensionSupported(extension) {
        return this.getAnalyzerByExtension(extension) !== null;
    }

    /**
     * Check if file is supported
     * @param {string} filePath - File path
     * @returns {boolean}
     */
    isFileSupported(filePath) {
        return this.getAnalyzerByPath(filePath) !== null;
    }

    /**
     * Get language info by name
     * @param {string} language - Language name
     * @returns {Object|null} Language info
     */
    getLanguageInfo(language) {
        const analyzer = this.getAnalyzer(language);
        if (!analyzer) {
            return null;
        }

        return {
            name: analyzer.name,
            extensions: analyzer.extensions,
            aliases: analyzer.aliases,
            metadata: analyzer.metadata
        };
    }

    /**
     * Get all languages info
     * @returns {Array} Array of language info objects
     */
    getAllLanguagesInfo() {
        this.initialize();
        return Array.from(this.analyzers.values()).map(analyzer => ({
            name: analyzer.name,
            extensions: analyzer.extensions,
            aliases: analyzer.aliases,
            metadata: analyzer.metadata
        }));
    }

    /**
     * Register external analyzer from file
     * @param {string} filePath - Path to analyzer file
     * @param {string} languageName - Language name
     * @param {Object} options - Registration options
     */
    registerFromFile(filePath, languageName, options = {}) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Analyzer file not found: ${filePath}`);
        }

        try {
            const AnalyzerClass = require(path.resolve(filePath));
            this.register(languageName, AnalyzerClass, options);
        } catch (error) {
            throw new Error(`Failed to load analyzer from ${filePath}: ${error.message}`);
        }
    }

    /**
     * Unregister a language analyzer
     * @param {string} language - Language name
     */
    unregister(language) {
        const normalizedLanguage = language.toLowerCase();
        const analyzer = this.analyzers.get(normalizedLanguage);
        
        if (!analyzer) {
            return false;
        }

        // Remove from main registry
        this.analyzers.delete(normalizedLanguage);

        // Remove extensions
        analyzer.extensions.forEach(ext => {
            this.extensions.delete(ext.toLowerCase());
        });

        // Remove aliases
        analyzer.aliases.forEach(alias => {
            this.aliases.delete(alias.toLowerCase());
        });

        return true;
    }

    /**
     * Clear all registered analyzers
     */
    clear() {
        this.analyzers.clear();
        this.extensions.clear();
        this.aliases.clear();
        this.initialized = false;
    }

    /**
     * Get registry statistics
     * @returns {Object} Registry statistics
     */
    getStats() {
        this.initialize();
        return {
            totalLanguages: this.analyzers.size,
            totalExtensions: this.extensions.size,
            totalAliases: this.aliases.size,
            languages: this.getSupportedLanguages(),
            extensions: this.getSupportedExtensions()
        };
    }
}

// Create singleton instance
const registry = new LanguageRegistry();

module.exports = registry;