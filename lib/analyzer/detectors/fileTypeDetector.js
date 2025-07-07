const path = require('path');
const fs = require('fs');

class FileTypeDetector {
  constructor() {
    this.binaryExtensions = new Set([
      '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.class', '.jar', '.war', '.ear'
    ]);
  }

  /**
   * Check if file is likely a text file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if likely text file
   */
  isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check if it's a known binary extension
    if (this.binaryExtensions.has(ext)) {
      return false;
    }

    // Check file size (very large files are likely binary)
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 50 * 1024 * 1024) { // 50MB
        return false;
      }
    } catch (error) {
      return false;
    }

    return true;
  }

  /**
   * Check if file should be analyzed
   * @param {string} filePath - Path to the file
   * @param {Array<string>} ignorePatterns - Patterns to ignore
   * @returns {boolean} - True if should be analyzed
   */
  shouldAnalyze(filePath, ignorePatterns = []) {
    const normalizedPath = path.normalize(filePath);
    
    // Check ignore patterns
    for (const pattern of ignorePatterns) {
      if (normalizedPath.includes(pattern)) {
        return false;
      }
    }

    // Check if it's a text file
    if (!this.isTextFile(filePath)) {
      return false;
    }

    // Check if file exists and is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info
   * @param {string} filePath - Path to the file
   * @returns {Object} - File information
   */
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(filePath),
        basename: path.basename(filePath),
        dirname: path.dirname(filePath)
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = FileTypeDetector;