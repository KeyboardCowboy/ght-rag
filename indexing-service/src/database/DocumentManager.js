const dbConnection = require('./connection');
const logger = require('../utils/logger');

class DocumentManager {
  constructor() {
    this.db = dbConnection;
  }

  async createDocument(documentData) {
    const {
      file_path,
      file_name,
      file_type,
      file_size,
      project_folder,
      processing_status = 'pending'
    } = documentData;

    try {
      const query = `
        INSERT INTO documents (file_path, file_name, file_type, file_size, project_folder, processing_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;
      
      const values = [file_path, file_name, file_type, file_size, project_folder, processing_status];
      const result = await this.db.query(query, values);
      
      logger.info(`Document created: ${file_name} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to create document ${file_name}:`, error);
      throw error;
    }
  }

  async updateDocumentStatus(documentId, status, errorMessage = null) {
    try {
      // Ensure status is a valid string and truncate if necessary
      const validStatus = String(status).substring(0, 50);
      
      const query = `
        UPDATE documents 
        SET processing_status = $1::varchar(50), 
            error_message = $2,
            updated_at = CURRENT_TIMESTAMP,
            processed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE processed_at END
        WHERE id = $3
        RETURNING id, processing_status, updated_at
      `;
      
      const values = [validStatus, errorMessage, documentId];
      const result = await this.db.query(query, values);
      
      logger.info(`Document ${documentId} status updated to: ${validStatus}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to update document ${documentId} status:`, error);
      throw error;
    }
  }

  async createDocumentChunks(documentId, chunks) {
    try {
      const client = await this.db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Delete existing chunks for this document
        await client.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
        
        // Insert new chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const query = `
            INSERT INTO document_chunks (document_id, chunk_index, chunk_text, metadata)
            VALUES ($1, $2, $3, $4)
          `;
          
          const values = [
            documentId,
            i,
            chunk.text,
            JSON.stringify(chunk.metadata || {})
          ];
          
          await client.query(query, values);
        }
        
        await client.query('COMMIT');
        logger.info(`Created ${chunks.length} chunks for document ${documentId}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`Failed to create chunks for document ${documentId}:`, error);
      throw error;
    }
  }

  async getDocumentByPath(filePath) {
    try {
      const query = 'SELECT * FROM documents WHERE file_path = $1';
      const result = await this.db.query(query, [filePath]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to get document by path ${filePath}:`, error);
      throw error;
    }
  }

  async getDocumentChunks(documentId) {
    try {
      const query = `
        SELECT * FROM document_chunks 
        WHERE document_id = $1 
        ORDER BY chunk_index
      `;
      const result = await this.db.query(query, [documentId]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to get chunks for document ${documentId}:`, error);
      throw error;
    }
  }

  async getWatchFolders() {
    try {
      const query = 'SELECT * FROM watch_folders WHERE active = true';
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get watch folders:', error);
      throw error;
    }
  }
}

module.exports = DocumentManager;
