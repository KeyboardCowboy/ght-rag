#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const dbConnection = require('../database/connection');
const DocumentManager = require('../database/DocumentManager');
const DocumentProcessor = require('../processors/DocumentProcessor');
const TextChunker = require('../chunking/TextChunker');
const logger = require('../utils/logger');

const program = new Command();

program
  .name('ingest')
  .description('CLI tool for manual document ingestion')
  .version('1.0.0');

program
  .command('file')
  .description('Ingest a single document file')
  .argument('<filepath>', 'Path to the document file')
  .option('-p, --project <name>', 'Project folder name', 'manual')
  .option('-c, --chunk-size <size>', 'Chunk size in characters', '1000')
  .option('-o, --overlap <size>', 'Chunk overlap in characters', '200')
  .action(async (filepath, options) => {
    try {
      await ingestFile(filepath, options);
    } catch (error) {
      logger.error('Ingestion failed:', error);
      process.exit(1);
    }
  });

program
  .command('directory')
  .description('Ingest all supported documents in a directory')
  .argument('<dirpath>', 'Path to the directory')
  .option('-p, --project <name>', 'Project folder name', 'manual')
  .option('-r, --recursive', 'Process subdirectories recursively', false)
  .option('-c, --chunk-size <size>', 'Chunk size in characters', '1000')
  .option('-o, --overlap <size>', 'Chunk overlap in characters', '200')
  .action(async (dirpath, options) => {
    try {
      await ingestDirectory(dirpath, options);
    } catch (error) {
      logger.error('Directory ingestion failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show ingestion status for a document')
  .argument('<filepath>', 'Path to the document file')
  .action(async (filepath) => {
    try {
      await showStatus(filepath);
    } catch (error) {
      logger.error('Status check failed:', error);
      process.exit(1);
    }
  });

async function ingestFile(filePath, options) {
  logger.info(`Starting ingestion of file: ${filePath}`);
  
  // Connect to database
  await dbConnection.connect();
  const documentManager = new DocumentManager();
  const documentProcessor = new DocumentProcessor();
  const textChunker = new TextChunker({
    chunkSize: parseInt(options.chunkSize),
    chunkOverlap: parseInt(options.overlap)
  });

  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Check if document already exists
    const existingDoc = await documentManager.getDocumentByPath(filePath);
    if (existingDoc) {
      logger.info(`Document already exists: ${existingDoc.file_name} (ID: ${existingDoc.id})`);
      console.log(`Document already exists with status: ${existingDoc.processing_status}`);
      return;
    }

    // Process the document
    logger.info('Processing document...');
    const result = await documentProcessor.processDocument(filePath);
    
    if (!result.success) {
      throw new Error(`Document processing failed: ${result.error}`);
    }

    // Create document record
    const fileStats = await fs.stat(filePath);
    const documentData = {
      file_path: filePath,
      file_name: path.basename(filePath),
      file_type: path.extname(filePath).toLowerCase(),
      file_size: fileStats.size,
      project_folder: options.project
    };

    const document = await documentManager.createDocument(documentData);
    
    // Update status to processing
    await documentManager.updateDocumentStatus(document.id, 'processing');

    // Chunk the text
    logger.info('Chunking text...');
    const chunks = textChunker.chunkText(result.text, {
      fileType: documentData.file_type,
      projectFolder: options.project,
      ...result.metadata
    });

    // Store chunks in database
    await documentManager.createDocumentChunks(document.id, chunks);

    // Update status to completed
    await documentManager.updateDocumentStatus(document.id, 'completed');

    logger.info(`Ingestion completed successfully!`);
    console.log(`✅ Document ingested: ${documentData.file_name}`);
    console.log(`📄 Document ID: ${document.id}`);
    console.log(`📝 Text length: ${result.text.length} characters`);
    console.log(`🧩 Chunks created: ${chunks.length}`);

  } catch (error) {
    logger.error('Ingestion error:', error);
    
    // Try to update document status to error if document was created
    try {
      const doc = await documentManager.getDocumentByPath(filePath);
      if (doc) {
        await documentManager.updateDocumentStatus(doc.id, 'error', error.message);
      }
    } catch (updateError) {
      logger.error('Failed to update document status:', updateError);
    }
    
    throw error;
  } finally {
    await dbConnection.disconnect();
  }
}

async function ingestDirectory(dirPath, options) {
  logger.info(`Starting directory ingestion: ${dirPath}`);
  
  const documentProcessor = new DocumentProcessor();
  const supportedExtensions = documentProcessor.getSupportedExtensions();
  
  try {
    const files = await getFilesInDirectory(dirPath, options.recursive);
    const supportedFiles = files.filter(file => 
      documentProcessor.isSupported(path.extname(file))
    );

    logger.info(`Found ${supportedFiles.length} supported files out of ${files.length} total files`);

    for (const filePath of supportedFiles) {
      try {
        await ingestFile(filePath, options);
        console.log(`✅ Processed: ${path.basename(filePath)}`);
      } catch (error) {
        logger.error(`Failed to process ${filePath}:`, error);
        console.log(`❌ Failed: ${path.basename(filePath)} - ${error.message}`);
      }
    }

    console.log(`\n📊 Directory ingestion completed!`);
    console.log(`✅ Successfully processed: ${supportedFiles.length} files`);

  } catch (error) {
    logger.error('Directory ingestion error:', error);
    throw error;
  }
}

async function getFilesInDirectory(dirPath, recursive = false) {
  const files = [];
  
  async function scanDirectory(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDirectory(dirPath);
  return files;
}

async function showStatus(filePath) {
  await dbConnection.connect();
  const documentManager = new DocumentManager();

  try {
    const document = await documentManager.getDocumentByPath(filePath);
    
    if (!document) {
      console.log(`❌ Document not found: ${filePath}`);
      return;
    }

    const chunks = await documentManager.getDocumentChunks(document.id);

    console.log(`📄 Document Status: ${document.file_name}`);
    console.log(`🆔 ID: ${document.id}`);
    console.log(`📁 Project: ${document.project_folder}`);
    console.log(`📊 Status: ${document.processing_status}`);
    console.log(`📝 File Type: ${document.file_type}`);
    console.log(`📏 File Size: ${document.file_size} bytes`);
    console.log(`🧩 Chunks: ${chunks.length}`);
    console.log(`📅 Created: ${document.created_at}`);
    console.log(`📅 Updated: ${document.updated_at}`);
    
    if (document.error_message) {
      console.log(`❌ Error: ${document.error_message}`);
    }

  } catch (error) {
    logger.error('Status check error:', error);
    throw error;
  } finally {
    await dbConnection.disconnect();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse();
