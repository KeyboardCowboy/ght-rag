const logger = require('../utils/logger');

class TextChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.minChunkSize = options.minChunkSize || 100;
  }

  /**
   * Split text into chunks with overlap
   * @param {string} text - The text to chunk
   * @param {Object} metadata - Additional metadata for chunks
   * @returns {Array} Array of chunk objects
   */
  chunkText(text, metadata = {}) {
    if (!text || text.trim().length === 0) {
      logger.warn('Empty text provided for chunking');
      return [];
    }

    const chunks = [];
    const sentences = this.splitIntoSentences(text);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      // If adding this sentence would exceed chunk size, finalize current chunk
      if (potentialChunk.length > this.chunkSize && currentChunk.length >= this.minChunkSize) {
        chunks.push(this.createChunkObject(currentChunk, chunkIndex, metadata));
        chunkIndex++;
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapChunk(currentChunk) + sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add the final chunk if it has content
    if (currentChunk.trim().length >= this.minChunkSize) {
      chunks.push(this.createChunkObject(currentChunk, chunkIndex, metadata));
    }

    logger.info(`Text chunked into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Split text into sentences using simple heuristics
   * @param {string} text - The text to split
   * @returns {Array} Array of sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting - can be enhanced with NLP libraries
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }

  /**
   * Create overlap for the next chunk
   * @param {string} chunk - The current chunk
   * @returns {string} Overlap text
   */
  createOverlapChunk(chunk) {
    if (chunk.length <= this.chunkOverlap) {
      return chunk;
    }

    // Take the last part of the chunk for overlap
    const overlap = chunk.slice(-this.chunkOverlap);
    
    // Try to break at word boundary
    const lastSpaceIndex = overlap.lastIndexOf(' ');
    if (lastSpaceIndex > this.chunkOverlap * 0.5) {
      return overlap.slice(lastSpaceIndex + 1);
    }
    
    return overlap;
  }

  /**
   * Create a chunk object with metadata
   * @param {string} text - The chunk text
   * @param {number} index - The chunk index
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Chunk object
   */
  createChunkObject(text, index, metadata) {
    return {
      text: text.trim(),
      metadata: {
        ...metadata,
        chunkIndex: index,
        chunkSize: text.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Chunk text by paragraphs (for structured documents)
   * @param {string} text - The text to chunk
   * @param {Object} metadata - Additional metadata
   * @returns {Array} Array of chunk objects
   */
  chunkByParagraphs(text, metadata = {}) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const chunks = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

      if (potentialChunk.length > this.chunkSize && currentChunk.length >= this.minChunkSize) {
        chunks.push(this.createChunkObject(currentChunk, chunkIndex, metadata));
        chunkIndex++;
        currentChunk = paragraph;
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk.trim().length >= this.minChunkSize) {
      chunks.push(this.createChunkObject(currentChunk, chunkIndex, metadata));
    }

    logger.info(`Text chunked by paragraphs into ${chunks.length} chunks`);
    return chunks;
  }
}

module.exports = TextChunker;
