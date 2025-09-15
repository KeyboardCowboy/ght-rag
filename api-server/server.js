#!/usr/bin/env node

/**
 * AI Document System API Server
 * 
 * HTTP API server for Claude Desktop and Cursor integration
 * Provides REST endpoints for document search, AI responses, and system status
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// Database configuration
const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'ai_documents',
  user: 'postgres',
  password: 'postgres'
};

class AIDocumentAPI {
  constructor() {
    this.app = express();
    this.pool = new Pool(dbConfig);
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const result = await this.pool.query('SELECT NOW()');
        res.json({
          status: 'healthy',
          timestamp: result.rows[0].now,
          service: 'ai-document-system'
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Get system statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM documents) as total_documents,
            (SELECT COUNT(*) FROM document_chunks) as total_chunks,
            (SELECT COUNT(*) FROM documents WHERE processing_status = 'completed') as completed_documents,
            (SELECT COUNT(*) FROM document_chunks WHERE chunk_embedding IS NOT NULL) as chunks_with_embeddings
        `);
        res.json(stats.rows[0]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List documents
    this.app.get('/api/documents', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        
        const documents = await this.pool.query(`
          SELECT id, file_name, file_type, file_size, processing_status, 
                 project_folder, created_at, updated_at
          FROM documents 
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        res.json(documents.rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get document details
    this.app.get('/api/documents/:id', async (req, res) => {
      try {
        const documentId = parseInt(req.params.id);
        
        const document = await this.pool.query(`
          SELECT * FROM documents WHERE id = $1
        `, [documentId]);
        
        if (document.rows.length === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(document.rows[0]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get document chunks
    this.app.get('/api/documents/:id/chunks', async (req, res) => {
      try {
        const documentId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 50;
        
        const chunks = await this.pool.query(`
          SELECT dc.id, dc.chunk_index, dc.chunk_text, dc.metadata, dc.created_at
          FROM document_chunks dc 
          WHERE dc.document_id = $1
          ORDER BY dc.chunk_index
          LIMIT $2
        `, [documentId, limit]);
        
        res.json(chunks.rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Search documents by content
    this.app.get('/api/search', async (req, res) => {
      try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query) {
          return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        const results = await this.pool.query(`
          SELECT dc.id, dc.document_id, dc.chunk_index, 
                 dc.chunk_text, d.file_name, d.file_type, d.project_folder,
                 ts_rank(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', $1)) as rank
          FROM document_chunks dc 
          JOIN documents d ON dc.document_id = d.id 
          WHERE to_tsvector('english', dc.chunk_text) @@ plainto_tsquery('english', $1)
          ORDER BY rank DESC
          LIMIT $2
        `, [query, limit]);
        
        res.json(results.rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Vector similarity search
    this.app.post('/api/search/similar', async (req, res) => {
      try {
        const { vector, limit = 10 } = req.body;
        
        if (!vector || !Array.isArray(vector)) {
          return res.status(400).json({ error: 'Vector array is required' });
        }
        
        if (vector.length !== 1536) {
          return res.status(400).json({ error: 'Vector must have 1536 dimensions' });
        }
        
        const vectorString = vector.join(',');
        
        const results = await this.pool.query(`
          SELECT dc.id, dc.document_id, dc.chunk_index, 
                 dc.chunk_text, d.file_name, d.file_type, d.project_folder,
                 dc.chunk_embedding <-> '[${vectorString}]'::vector as distance
          FROM document_chunks dc
          JOIN documents d ON dc.document_id = d.id
          WHERE dc.chunk_embedding IS NOT NULL
          ORDER BY distance
          LIMIT $1
        `, [limit]);
        
        res.json(results.rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // AI-powered query endpoint
    this.app.post('/api/ai/query', async (req, res) => {
      try {
        const { query, context_limit = 5 } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }
        
        // First, search for relevant content
        const searchResults = await this.pool.query(`
          SELECT dc.chunk_text, d.file_name, d.file_type, d.project_folder,
                 ts_rank(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', $1)) as rank
          FROM document_chunks dc 
          JOIN documents d ON dc.document_id = d.id 
          WHERE to_tsvector('english', dc.chunk_text) @@ plainto_tsquery('english', $1)
          ORDER BY rank DESC
          LIMIT $2
        `, [query, context_limit]);
        
        // Format context for AI
        const context = searchResults.rows.map(row => ({
          content: row.chunk_text,
          source: `${row.file_name} (${row.file_type})`,
          project: row.project_folder,
          relevance: row.rank
        }));
        
        res.json({
          query,
          context,
          suggestions: [
            "What else can you tell me about this topic?",
            "Are there related documents?",
            "Can you summarize the key points?"
          ]
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get watch folders
    this.app.get('/api/watch-folders', async (req, res) => {
      try {
        const folders = await this.pool.query(`
          SELECT * FROM watch_folders WHERE active = true ORDER BY priority DESC
        `);
        res.json(folders.rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  async start() {
    try {
      // Test database connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 AI Document System API Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API docs: http://localhost:${this.port}/api/stats`);
        console.log(`🔍 Search: http://localhost:${this.port}/api/search?q=golden`);
      });
    } catch (error) {
      console.error('Failed to start API server:', error);
      process.exit(1);
    }
  }

  async stop() {
    await this.pool.end();
    process.exit(0);
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AIDocumentAPI();
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down API server...');
    server.stop();
  });
}

module.exports = AIDocumentAPI;
