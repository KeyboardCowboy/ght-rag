-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    project_folder VARCHAR(255),
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_embedding TEXT, -- OpenAI embeddings dimension (will be converted to vector later)
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create processing_queue table
CREATE TABLE IF NOT EXISTS processing_queue (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'queued',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create watch_folders table
CREATE TABLE IF NOT EXISTS watch_folders (
    id SERIAL PRIMARY KEY,
    folder_path VARCHAR(500) NOT NULL UNIQUE,
    recursive BOOLEAN DEFAULT true,
    file_types TEXT[],
    priority VARCHAR(20) DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_file_path ON documents(file_path);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_project_folder ON documents(project_folder);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (chunk_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON processing_queue(priority);
CREATE INDEX IF NOT EXISTS idx_watch_folders_active ON watch_folders(active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_folders_updated_at BEFORE UPDATE ON watch_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default watch folders
INSERT INTO watch_folders (folder_path, recursive, file_types, priority) VALUES
    ('/var/www/html/documents/project-alpha', true, ARRAY['.pdf', '.docx', '.txt', '.md'], 'high'),
    ('/var/www/html/documents/project-beta', true, ARRAY['.pdf', '.docx', '.txt', '.md'], 'high'),
    ('/var/www/html/documents/meeting-transcripts', false, ARRAY['.txt', '.md'], 'normal'),
    ('/var/www/html/documents/client-communications', true, ARRAY['.pdf', '.docx', '.txt', '.md'], 'normal')
ON CONFLICT (folder_path) DO NOTHING;
