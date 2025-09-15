/**
 * Shared Database Queries
 * 
 * This module contains commonly used database queries
 * that can be shared across different services.
 */

const queries = {
  // Document queries
  documents: {
    create: `
      INSERT INTO documents (file_path, file_name, file_type, file_size, project_folder, processing_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    
    getById: `
      SELECT * FROM documents WHERE id = $1
    `,
    
    getByPath: `
      SELECT * FROM documents WHERE file_path = $1
    `,
    
    updateStatus: `
      UPDATE documents 
      SET processing_status = $2, error_message = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    
    listByProject: `
      SELECT * FROM documents 
      WHERE project_folder = $1 
      ORDER BY created_at DESC
    `,
    
    listAll: `
      SELECT * FROM documents 
      ORDER BY created_at DESC
    `,
    
    delete: `
      DELETE FROM documents WHERE id = $1
    `
  },

  // Document chunks queries
  chunks: {
    create: `
      INSERT INTO document_chunks (document_id, chunk_index, content, metadata, embedding)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    
    getByDocumentId: `
      SELECT * FROM document_chunks 
      WHERE document_id = $1 
      ORDER BY chunk_index
    `,
    
    deleteByDocumentId: `
      DELETE FROM document_chunks WHERE document_id = $1
    `,
    
    searchSimilar: `
      SELECT dc.*, d.file_name, d.project_folder
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL
      ORDER BY dc.embedding <-> $1
      LIMIT $2
    `,
    
    searchByContent: `
      SELECT dc.*, d.file_name, d.project_folder
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.content ILIKE $1
      ORDER BY dc.created_at DESC
      LIMIT $2
    `
  },

  // Processing queue queries
  queue: {
    add: `
      INSERT INTO processing_queue (file_path, priority, status, created_at)
      VALUES ($1, $2, 'pending', NOW())
      RETURNING *
    `,
    
    getNext: `
      SELECT * FROM processing_queue 
      WHERE status = 'pending' 
      ORDER BY priority DESC, created_at ASC 
      LIMIT 1
    `,
    
    updateStatus: `
      UPDATE processing_queue 
      SET status = $2, error_message = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    
    clear: `
      DELETE FROM processing_queue WHERE status = 'completed'
    `
  },

  // Watch folders queries
  watchFolders: {
    list: `
      SELECT * FROM watch_folders WHERE active = true
    `,
    
    add: `
      INSERT INTO watch_folders (folder_path, recursive, file_types, priority, active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `,
    
    update: `
      UPDATE watch_folders 
      SET folder_path = $2, recursive = $3, file_types = $4, priority = $5, active = $6
      WHERE id = $1
      RETURNING *
    `,
    
    delete: `
      DELETE FROM watch_folders WHERE id = $1
    `
  },

  // Statistics queries
  stats: {
    documentCount: `
      SELECT COUNT(*) as count FROM documents
    `,
    
    chunkCount: `
      SELECT COUNT(*) as count FROM document_chunks
    `,
    
    documentsByStatus: `
      SELECT processing_status, COUNT(*) as count 
      FROM documents 
      GROUP BY processing_status
    `,
    
    documentsByProject: `
      SELECT project_folder, COUNT(*) as count 
      FROM documents 
      GROUP BY project_folder
    `,
    
    documentsByType: `
      SELECT file_type, COUNT(*) as count 
      FROM documents 
      GROUP BY file_type
    `,
    
    recentActivity: `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as documents_added
      FROM documents 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
  },

  // System maintenance queries
  maintenance: {
    cleanupOldLogs: `
      DELETE FROM processing_queue 
      WHERE status = 'completed' 
      AND updated_at < NOW() - INTERVAL '7 days'
    `,
    
    optimizeTables: `
      VACUUM ANALYZE documents, document_chunks, processing_queue, watch_folders;
    `,
    
    checkDatabaseSize: `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `
  }
};

module.exports = queries;
