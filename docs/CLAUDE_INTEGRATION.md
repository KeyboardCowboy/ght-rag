# Claude Desktop & Cursor Integration Guide

## Overview

This guide explains how to integrate the AI Document System with Claude Desktop and Cursor for intelligent document search and analysis.

## Integration Methods

### Method 1: HTTP API Server (Recommended)

The API server provides REST endpoints that Claude Desktop and Cursor can call directly.

#### Starting the API Server

```bash
# From the project directory
./scripts/start-api.sh

# Or manually
cd api-server
npm install
node server.js
```

The API server will be available at `http://localhost:3001`

#### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/stats` | System statistics |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get document details |
| GET | `/api/documents/:id/chunks` | Get document chunks |
| GET | `/api/search?q=term` | Search documents |
| POST | `/api/search/similar` | Vector similarity search |
| POST | `/api/ai/query` | AI-powered query with context |
| GET | `/api/watch-folders` | List watch folders |

#### Example API Usage

**Search for documents:**
```bash
curl "http://localhost:3001/api/search?q=golden&limit=5"
```

**Get system statistics:**
```bash
curl "http://localhost:3001/api/stats"
```

**AI-powered query:**
```bash
curl -X POST "http://localhost:3001/api/ai/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the history of Golden, Colorado?", "context_limit": 5}'
```

### Method 2: CLI Tool Integration

Use the existing CLI tools for simple queries:

```bash
# Search content
node scripts/query-db.js search "golden"

# Get statistics
node scripts/query-db.js stats

# Test vector similarity
node scripts/query-db.js vector-test
```

## Claude Desktop Integration

### Option 1: HTTP API Integration

Claude Desktop can make HTTP requests to our API server:

```javascript
// Example Claude Desktop integration
const response = await fetch('http://localhost:3001/api/search?q=golden');
const results = await response.json();
console.log(results);
```

### Option 2: CLI Integration

Claude Desktop can execute our CLI tools:

```bash
# In Claude Desktop, you can run:
node /path/to/ai-document-system/scripts/query-db.js search "golden"
```

## Cursor Integration

### Option 1: HTTP API Integration

Cursor can integrate with our API server:

```typescript
// Example Cursor integration
interface DocumentSearchResult {
  id: number;
  document_id: number;
  chunk_index: number;
  chunk_text: string;
  file_name: string;
  file_type: string;
  project_folder: string;
  rank: number;
}

async function searchDocuments(query: string): Promise<DocumentSearchResult[]> {
  const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
  return await response.json();
}
```

### Option 2: CLI Integration

Cursor can execute our CLI tools in the terminal:

```bash
# In Cursor terminal:
node scripts/query-db.js search "golden"
node scripts/query-db.js stats
```

## Advanced Integration Examples

### Document Analysis Workflow

```bash
# 1. Get system overview
curl "http://localhost:3001/api/stats"

# 2. Search for relevant documents
curl "http://localhost:3001/api/search?q=golden history"

# 3. Get detailed chunks from a specific document
curl "http://localhost:3001/api/documents/1/chunks"

# 4. AI-powered analysis
curl -X POST "http://localhost:3001/api/ai/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "Summarize the key historical events in Golden, Colorado"}'
```

### Vector Similarity Search

```bash
# Test vector similarity search
curl -X POST "http://localhost:3001/api/search/similar" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3, ...], 
    "limit": 5
  }'
```

## Configuration

### Environment Variables

```bash
# API Server Configuration
export PORT=3001
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ai_documents"
```

### DDEV Integration

The API server automatically connects to the DDEV PostgreSQL instance on port 5432.

## Testing

### Test API Endpoints

```bash
# Run API tests
cd api-server
node test-api.js
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test search
curl "http://localhost:3001/api/search?q=test"

# Test AI query
curl -X POST "http://localhost:3001/api/ai/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "test query"}'
```

## Troubleshooting

### Common Issues

1. **API Server Won't Start**
   - Ensure DDEV is running: `ddev start`
   - Check PostgreSQL connection: `nc -z 127.0.0.1 5432`

2. **Database Connection Errors**
   - Verify database is accessible
   - Check connection string in server.js

3. **No Search Results**
   - Ensure documents are processed: `node scripts/query-db.js stats`
   - Check if documents have chunks: `node scripts/query-db.js chunks`

### Debug Mode

```bash
# Start API server with debug logging
DEBUG=* node api-server/server.js
```

## Security Considerations

- The API server runs on localhost only
- No authentication required for local development
- For production, add authentication and HTTPS

## Next Steps

1. **Start the API server**: `./scripts/start-api.sh`
2. **Test endpoints**: `cd api-server && node test-api.js`
3. **Integrate with Claude Desktop/Cursor** using the examples above
4. **Process documents** to have data to search: `node indexing-service/src/cli/ingest.js /path/to/documents`

## Support

- Check logs in `api-server/` directory
- Verify database connection with `node scripts/query-db.js stats`
- Test individual endpoints with curl or the test script
