const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const languageConfig = require('../../config/languages.json');

class LanguageDetector {
  constructor() {
    this.languages = languageConfig.languages;
  }

  /**
   * Detect language from file path and content
   * @param {string} filePath - Path to the file
   * @param {string} content - File content (optional)
   * @returns {string|null} - Detected language or null
   */
  detectLanguage(filePath, content = null) {
    // First try by extension
    const langByExt = this.detectByExtension(filePath);
    if (langByExt) return langByExt;

    // Then try by MIME type
    const langByMime = this.detectByMimeType(filePath);
    if (langByMime) return langByMime;

    // Finally try by content analysis
    if (content) {
      const langByContent = this.detectByContent(content);
      if (langByContent) return langByContent;
    }

    return null;
  }

  /**
   * Detect language by file extension
   * @param {string} filePath - Path to the file
   * @returns {string|null} - Detected language or null
   */
  detectByExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [langName, langConfig] of Object.entries(this.languages)) {
      if (langConfig.extensions.includes(ext)) {
        return langName;
      }
    }
    
    return null;
  }

  /**
   * Detect language by MIME type
   * @param {string} filePath - Path to the file
   * @returns {string|null} - Detected language or null
   */
  detectByMimeType(filePath) {
    const mimeType = mime.lookup(filePath);
    if (!mimeType) return null;

    for (const [langName, langConfig] of Object.entries(this.languages)) {
      if (langConfig.mime && langConfig.mime.includes(mimeType)) {
        return langName;
      }
    }
    
    return null;
  }

  /**
   * Detect language by analyzing file content
   * @param {string} content - File content
   * @returns {string|null} - Detected language or null
   */
  detectByContent(content) {
    const lines = content.split('\n');
    const firstLine = lines[0];
    
    // Check shebang first
    if (firstLine.startsWith('#!')) {
      for (const [langName, langConfig] of Object.entries(this.languages)) {
        if (langConfig.patterns.shebang) {
          const shebangRegex = new RegExp(langConfig.patterns.shebang);
          if (shebangRegex.test(firstLine)) {
            return langName;
          }
        }
      }
    }

    // Check for language-specific keywords
    const contentLower = content.toLowerCase();
    const scores = {};

    for (const [langName, langConfig] of Object.entries(this.languages)) {
      if (langConfig.patterns.keywords) {
        scores[langName] = 0;
        for (const keyword of langConfig.patterns.keywords) {
          const regex = new RegExp(keyword.toLowerCase(), 'g');
          const matches = contentLower.match(regex);
          if (matches) {
            scores[langName] += matches.length;
          }
        }
      }
    }

    // Return language with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      return Object.keys(scores).find(lang => scores[lang] === maxScore);
    }

    return null;
  }

  /**
   * Get parser name for a language
   * @param {string} language - Language name
   * @returns {string|null} - Parser name or null
   */
  getParserForLanguage(language) {
    const langConfig = this.languages[language];
    return langConfig ? langConfig.parser : null;
  }

  /**
   * Get all supported languages
   * @returns {Array<string>} - Array of supported language names
   */
  getSupportedLanguages() {
    return Object.keys(this.languages);
  }

  /**
   * Check if a language is supported
   * @param {string} language - Language name
   * @returns {boolean} - True if supported
   */
  isLanguageSupported(language) {
    return this.languages.hasOwnProperty(language);
  }
}

module.exports = LanguageDetector;