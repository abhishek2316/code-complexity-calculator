const { ComplexityAnalyzer } = require('./analyzer');
const { runCLI, runInteractiveCLI } = require('./cli');

class CodeComplexityAnalyzer {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      includeTests: false,
      outputFormat: 'console',
      ...options
    };
    this.analyzer = new ComplexityAnalyzer(this.options);
  }

  /**
   * Analyze a single file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFile(filePath) {
    return await this.analyzer.analyzeFile(filePath);
  }

  /**
   * Analyze an entire project
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeProject(projectPath) {
    return await this.analyzer.analyzeProject(projectPath);
  }

  /**
   * Analyze code from GitHub URL
   * @param {string} githubUrl - GitHub URL
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeGitHub(githubUrl) {
    return await this.analyzer.analyzeGitHub(githubUrl);
  }

  /**
   * Get supported languages
   * @returns {Array<string>} List of supported languages
   */
  getSupportedLanguages() {
    return this.analyzer.getSupportedLanguages();
  }

  /**
   * Set analyzer options
   * @param {Object} options - Options to set
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.analyzer.setOptions(this.options);
  }
}

// Export main class and CLI functions
module.exports = {
  CodeComplexityAnalyzer,
  ComplexityAnalyzer,
  runCLI,
  runInteractiveCLI
};

// For backward compatibility
module.exports.default = CodeComplexityAnalyzer;