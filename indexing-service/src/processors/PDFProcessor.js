const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');

class PDFProcessor {
  async extractText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      logger.info(`PDF processed: ${data.numpages} pages, ${data.text.length} characters`);
      
      return {
        text: data.text,
        metadata: {
          numPages: data.numpages,
          title: data.info?.Title || null,
          author: data.info?.Author || null,
          subject: data.info?.Subject || null,
          creator: data.info?.Creator || null,
          producer: data.info?.Producer || null,
          creationDate: data.info?.CreationDate || null,
          modificationDate: data.info?.ModDate || null,
          textLength: data.text.length
        }
      };
    } catch (error) {
      logger.error(`PDF processing failed for ${filePath}:`, error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}

module.exports = PDFProcessor;
