/**
 * AI Service - Shared API for OpenAI Integration
 * 
 * This service handles all AI-related operations including:
 * - Embedding generation
 * - Chat completions
 * - Document summarization
 */

const OpenAI = require('openai');
const logger = require('../../indexing-service/src/utils/logger');

class AIService {
  constructor() {
    this.openai = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Test the connection
      await this.openai.models.list();
      this.isInitialized = true;
      
      logger.info('AI Service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  async generateEmbedding(text, model = 'text-embedding-3-small') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });

      return response.data[0].embedding;
      
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts, model = 'text-embedding-3-small') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: texts,
      });

      return response.data.map(item => item.embedding);
      
    } catch (error) {
      logger.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  async chatCompletion(messages, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options
      });

      return response.choices[0].message.content;
      
    } catch (error) {
      logger.error('Failed to generate chat completion:', error);
      throw error;
    }
  }

  async summarizeDocument(text, maxLength = 500) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `Summarize the following document in ${maxLength} characters or less. Focus on key points and main ideas.`
        },
        {
          role: 'user',
          content: text
        }
      ];

      return await this.chatCompletion(messages, {
        max_tokens: Math.floor(maxLength / 2), // Rough estimate
        temperature: 0.3
      });
      
    } catch (error) {
      logger.error('Failed to summarize document:', error);
      throw error;
    }
  }

  async answerQuestion(question, context, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful AI assistant that answers questions based on the provided context. Use only the information in the context to answer questions. If the context doesn't contain enough information to answer the question, say so.`
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nQuestion: ${question}`
        }
      ];

      return await this.chatCompletion(messages, {
        temperature: options.temperature || 0.3,
        max_tokens: options.max_tokens || 500
      });
      
    } catch (error) {
      logger.error('Failed to answer question:', error);
      throw error;
    }
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
