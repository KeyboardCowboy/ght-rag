#!/usr/bin/env node

/**
 * AI Document System - Auto-Indexing Daemon
 * 
 * This daemon monitors configured directories for file changes and automatically
 * processes new documents for AI-powered search capabilities.
 */

require('dotenv').config();
const logger = require('./src/utils/logger');

// Import services (to be implemented in future steps)
// const FileWatcher = require('./src/services/fileWatcher');
// const QueueManager = require('./src/services/queueManager');
// const VectorStore = require('./src/services/vectorStore');

class AutoIndexingDaemon {
  constructor() {
    this.isRunning = false;
    this.services = {};
  }

  async start() {
    try {
      logger.info('Starting AI Document System Auto-Indexing Daemon...');
      
      // Initialize services (to be implemented)
      // this.services.fileWatcher = new FileWatcher();
      // this.services.queueManager = new QueueManager();
      // this.services.vectorStore = new VectorStore();
      
      // Start services
      // await this.services.fileWatcher.start();
      // await this.services.queueManager.start();
      
      this.isRunning = true;
      logger.info('Auto-Indexing Daemon started successfully');
      
      // Keep the process alive
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start Auto-Indexing Daemon:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      logger.info('Stopping Auto-Indexing Daemon...');
      
      // Stop services gracefully
      // if (this.services.fileWatcher) {
      //   await this.services.fileWatcher.stop();
      // }
      // if (this.services.queueManager) {
      //   await this.services.queueManager.stop();
      // }
      
      this.isRunning = false;
      logger.info('Auto-Indexing Daemon stopped successfully');
      
    } catch (error) {
      logger.error('Error stopping Auto-Indexing Daemon:', error);
    }
  }

  setupGracefulShutdown() {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await this.stop();
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: Object.keys(this.services)
    };
  }
}

// Start the daemon if this file is run directly
if (require.main === module) {
  const daemon = new AutoIndexingDaemon();
  daemon.start().catch((error) => {
    logger.error('Failed to start daemon:', error);
    process.exit(1);
  });
}

module.exports = AutoIndexingDaemon;
