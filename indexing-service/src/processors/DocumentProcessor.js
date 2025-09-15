const fs = require('fs').promises;
const path = require('path');
const PDFProcessor = require('./PDFProcessor');
const DocxProcessor = require('./DocxProcessor');
const TextProcessor = require('./TextProcessor');
const logger = require('../utils/logger');

class DocumentProcessor {
  constructor() {
    this.processors = {
      '.pdf': new PDFProcessor(),
      '.docx': new DocxProcessor(),
      '.doc': new DocxProcessor(),
      '.txt': new TextProcessor(),
      '.md': new TextProcessor(),
      '.markdown': new TextProcessor()
    };
  }

  /**
   * Process a document file and extract text content
   * @param {string} filePath - Path to the document file
   * @returns {Object} Processing result with text content and metadata
   */
  async processDocument(filePath) {
    try {
      const fileStats = await fs.stat(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      logger.info(`Processing document: ${filePath} (${fileExtension})`);

      // Check if we have a processor for this file type
      if (!this.processors[fileExtension]) {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Get file metadata
      const metadata = {
        filePath,
        fileName: path.basename(filePath),
        fileExtension,
        fileSize: fileStats.size,
        modifiedAt: fileStats.mtime,
        createdAt: fileStats.birthtime
      };

      // Process the file
      const processor = this.processors[fileExtension];
      const result = await processor.extractText(filePath);

      return {
        text: result.text,
        metadata: {
          ...metadata,
          ...result.metadata
        },
        success: true
      };

    } catch (error) {
      logger.error(`Failed to process document ${filePath}:`, error);
      return {
        text: '',
        metadata: {
          filePath,
          fileName: path.basename(filePath),
          error: error.message
        },
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get supported file extensions
   * @returns {Array} Array of supported file extensions
   */
  getSupportedExtensions() {
    return Object.keys(this.processors);
  }

  /**
   * Check if a file type is supported
   * @param {string} extension - File extension (with or without dot)
   * @returns {boolean} True if supported
   */
  isSupported(extension) {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return this.processors.hasOwnProperty(ext.toLowerCase());
  }
}

module.exports = DocumentProcessor;
