/**
 * Shared Database Client
 * 
 * This module provides a shared database connection client
 * that can be used across different services.
 */

const { Pool } = require('pg');
const logger = require('../../indexing-service/src/utils/logger');

class SharedDatabaseClient {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/ai_documents';
      
      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      logger.info('Shared database client connected successfully');
      
      return this.pool;
    } catch (error) {
      logger.error('Failed to connect shared database client:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Shared database client disconnected');
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW()');
      return {
        status: 'healthy',
        timestamp: result.rows[0].now,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: this.isConnected
      };
    }
  }
}

// Singleton instance
const sharedDbClient = new SharedDatabaseClient();

module.exports = sharedDbClient;
