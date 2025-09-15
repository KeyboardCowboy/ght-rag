const fs = require('fs').promises;
const mammoth = require('mammoth');
const logger = require('../utils/logger');

class DocxProcessor {
  async extractText(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      logger.info(`DOCX processed: ${result.value.length} characters`);
      
      return {
        text: result.value,
        metadata: {
          textLength: result.value.length,
          messages: result.messages || []
        }
      };
    } catch (error) {
      logger.error(`DOCX processing failed for ${filePath}:`, error);
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }
}

module.exports = DocxProcessor;
