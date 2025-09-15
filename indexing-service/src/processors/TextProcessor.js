const fs = require('fs').promises;
const logger = require('../utils/logger');

class TextProcessor {
  async extractText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      logger.info(`Text file processed: ${content.length} characters`);
      
      return {
        text: content,
        metadata: {
          textLength: content.length,
          encoding: 'utf8'
        }
      };
    } catch (error) {
      logger.error(`Text processing failed for ${filePath}:`, error);
      throw new Error(`Text processing failed: ${error.message}`);
    }
  }
}

module.exports = TextProcessor;
