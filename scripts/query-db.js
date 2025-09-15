#!/usr/bin/env node

/**
 * Database Query CLI Tool
 * 
 * Non-interactive command-line tool for querying the database
 * Can be run from outside DDEV for Claude Desktop/Cursor integration
 */

const { Pool } = require('pg');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: '127.0.0.1', // Localhost since we're outside DDEV
  port: 5432,
  database: 'ai_documents',
  user: 'postgres',
  password: 'postgres'
};

class DatabaseQueryTool {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }

  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.pool.end();
  }

  // Predefined query methods
  async getDocuments(limit = 10) {
    return await this.query(`
      SELECT id, file_name, file_type, file_size, processing_status, created_at
      FROM documents 
      ORDER BY created_at DESC 
      LIMIT $1
    `, [limit]);
  }

  async getDocumentChunks(documentId = null, limit = 10) {
    if (documentId) {
      return await this.query(`
        SELECT dc.id, dc.document_id, dc.chunk_index, 
               LEFT(dc.chunk_text, 200) as content_preview,
               d.file_name
        FROM document_chunks dc 
        JOIN documents d ON dc.document_id = d.id 
        WHERE dc.document_id = $1
        ORDER BY dc.chunk_index
        LIMIT $2
      `, [documentId, limit]);
    } else {
      return await this.query(`
        SELECT dc.id, dc.document_id, dc.chunk_index, 
               LEFT(dc.chunk_text, 200) as content_preview,
               d.file_name
        FROM document_chunks dc 
        JOIN documents d ON dc.document_id = d.id 
        ORDER BY dc.document_id, dc.chunk_index
        LIMIT $1
      `, [limit]);
    }
  }

  async searchChunks(searchTerm, limit = 10) {
    return await this.query(`
      SELECT dc.id, dc.document_id, dc.chunk_index, 
             dc.chunk_text, d.file_name, d.file_type
      FROM document_chunks dc 
      JOIN documents d ON dc.document_id = d.id 
      WHERE dc.chunk_text ILIKE $1
      ORDER BY dc.created_at DESC
      LIMIT $2
    `, [`%${searchTerm}%`, limit]);
  }

  async getStats() {
    const stats = await this.query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as total_documents,
        (SELECT COUNT(*) FROM document_chunks) as total_chunks,
        (SELECT COUNT(*) FROM documents WHERE processing_status = 'completed') as completed_documents,
        (SELECT COUNT(*) FROM document_chunks WHERE chunk_embedding IS NOT NULL) as chunks_with_embeddings
    `);
    return stats[0];
  }

  async testVectorSearch() {
    // Test if we have any vectors stored
    const vectorTest = await this.query(`
      SELECT COUNT(*) as vector_count 
      FROM document_chunks 
      WHERE chunk_embedding IS NOT NULL
    `);
    
    if (vectorTest[0].vector_count > 0) {
      // Test similarity search with a sample vector
      const sampleVector = Array(1536).fill(0.1).join(',');
      return await this.query(`
        SELECT dc.chunk_index, LEFT(dc.chunk_text, 100) as content_preview,
               dc.chunk_embedding <-> '[${sampleVector}]'::vector as distance,
               d.file_name
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.chunk_embedding IS NOT NULL
        ORDER BY distance
        LIMIT 5
      `);
    } else {
      return { message: 'No vectors found in database' };
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  const db = new DatabaseQueryTool();
  
  try {
    const connected = await db.connect();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'documents':
        const limit = param ? parseInt(param) : 10;
        const documents = await db.getDocuments(limit);
        console.log(JSON.stringify(documents, null, 2));
        break;

      case 'chunks':
        const docId = param ? parseInt(param) : null;
        const chunks = await db.getDocumentChunks(docId, 10);
        console.log(JSON.stringify(chunks, null, 2));
        break;

      case 'search':
        if (!param) {
          console.error('Search term required. Usage: node query-db.js search "search term"');
          process.exit(1);
        }
        const results = await db.searchChunks(param, 10);
        console.log(JSON.stringify(results, null, 2));
        break;

      case 'stats':
        const stats = await db.getStats();
        console.log(JSON.stringify(stats, null, 2));
        break;

      case 'vector-test':
        const vectorResults = await db.testVectorSearch();
        console.log(JSON.stringify(vectorResults, null, 2));
        break;

      case 'custom':
        if (!param) {
          console.error('SQL query required. Usage: node query-db.js custom "SELECT * FROM documents"');
          process.exit(1);
        }
        const customResults = await db.query(param);
        console.log(JSON.stringify(customResults, null, 2));
        break;

      default:
        console.log(`
Database Query Tool Usage:

  node query-db.js documents [limit]           - List documents (default: 10)
  node query-db.js chunks [document_id]        - List chunks (optionally for specific document)
  node query-db.js search "term"               - Search chunks by content
  node query-db.js stats                       - Get database statistics
  node query-db.js vector-test                 - Test vector similarity search
  node query-db.js custom "SQL query"         - Run custom SQL query

Examples:
  node query-db.js documents 5
  node query-db.js chunks 1
  node query-db.js search "golden"
  node query-db.js custom "SELECT file_name FROM documents WHERE file_type = 'pdf'"
        `);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseQueryTool;
