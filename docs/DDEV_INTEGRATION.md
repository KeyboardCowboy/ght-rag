# DDEV Integration Guide

## Overview

This guide explains how the AI Document System integrates with DDEV and the different ways to run the API server.

## DDEV Architecture

### Current Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Host Machine  │    │   DDEV Web      │    │   DDEV Postgres │
│                 │    │   Container     │    │   Container     │
│                 │    │                 │    │                 │
│ API Server      │◄──►│ Node.js Apps    │◄──►│ PostgreSQL      │
│ (Optional)      │    │ CLI Tools       │    │ pgvector        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Port Mapping
- **PostgreSQL**: `127.0.0.1:5432` → `postgres:5432`
- **API Server**: `127.0.0.1:3001` → `web:3001` (when running in DDEV)
- **Web Server**: `127.0.0.1:80` → `web:80`

## Integration Methods

### Method 1: API Server Inside DDEV (Recommended)

**Advantages:**
- ✅ Uses DDEV's internal networking
- ✅ Access to all DDEV environment variables
- ✅ Consistent with other services
- ✅ Easy to manage with DDEV commands

**How to use:**
```bash
# Start DDEV
ddev start

# Start API server inside DDEV
ddev api-server

# Or manually inside DDEV
ddev ssh
cd api-server
node server-ddev.js
```

**Access from outside:**
- API: `http://localhost:3001`
- Health: `http://localhost:3001/health`

### Method 2: API Server Outside DDEV

**Advantages:**
- ✅ Runs independently of DDEV
- ✅ Easier debugging from host machine
- ✅ Can run even if DDEV is stopped

**How to use:**
```bash
# Start DDEV
ddev start

# Start API server on host machine
./scripts/start-api.sh

# Or manually
cd api-server
npm install
node server.js
```

**Access:**
- API: `http://localhost:3001`
- Health: `http://localhost:3001/health`

## DDEV Configuration

### Port Exposure
```yaml
# .ddev/config.yaml
additional_exposed_ports:
  - name: postgres
    container_port: 5432
    http_port: 5432
    https_port: 5433
  - name: api-server
    container_port: 3001
    http_port: 3001
    https_port: 3002
```

### Environment Variables
```yaml
# .ddev/config.yaml
web_environment:
  - NODE_ENV=development
  - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_documents
  - OPENAI_API_KEY=${OPENAI_API_KEY}
```

### DDEV Commands
```bash
# Custom DDEV command to start API server
ddev api-server

# Standard DDEV commands
ddev start          # Start all services
ddev stop           # Stop all services
ddev ssh            # Enter web container
ddev describe       # Show service status
```

## Database Connection

### Inside DDEV
```javascript
// Uses DDEV environment variables
const dbConfig = {
  connectionString: process.env.DATABASE_URL
  // DATABASE_URL = postgresql://postgres:postgres@postgres:5432/ai_documents
};
```

### Outside DDEV
```javascript
// Connects to exposed PostgreSQL port
const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'ai_documents',
  user: 'postgres',
  password: 'postgres'
};
```

## File System Access

### Volume Mounts
```yaml
# .ddev/docker-compose.override.yaml
services:
  web:
    volumes:
      - /Users/chris/www/ght-rag/project/docs:/var/www/html/external-docs
```

### Accessing External Documents
```bash
# Inside DDEV
/var/www/html/external-docs/source-files/

# Outside DDEV
/Users/chris/www/ght-rag/project/docs/source-files/
```

## Development Workflow

### 1. Start DDEV Environment
```bash
ddev start
```

### 2. Process Documents
```bash
# Inside DDEV
ddev ssh
node indexing-service/src/cli/ingest.js /var/www/html/external-docs/source-files/

# Outside DDEV
node indexing-service/src/cli/ingest.js /Users/chris/www/ght-rag/project/docs/source-files/
```

### 3. Start API Server
```bash
# Option A: Inside DDEV
ddev api-server

# Option B: Outside DDEV
./scripts/start-api.sh
```

### 4. Test Integration
```bash
# Test API
curl http://localhost:3001/health
curl "http://localhost:3001/api/search?q=golden"

# Test CLI tools
node scripts/query-db.js stats
node scripts/query-db.js search "golden"
```

## Troubleshooting

### Common Issues

1. **API Server Won't Start**
   ```bash
   # Check DDEV status
   ddev describe
   
   # Check PostgreSQL
   ddev ssh
   psql -U postgres -d ai_documents -c "SELECT NOW();"
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Kill process if needed
   kill -9 <PID>
   ```

3. **Database Connection Issues**
   ```bash
   # Test connection from host
   nc -z 127.0.0.1 5432
   
   # Test connection from DDEV
   ddev ssh
   nc -z postgres 5432
   ```

### Debug Mode

```bash
# Start API server with debug logging
DEBUG=* node api-server/server-ddev.js

# Or outside DDEV
DEBUG=* node api-server/server.js
```

## Best Practices

### Development
1. **Use DDEV for consistency** - Run API server inside DDEV
2. **Use environment variables** - Let DDEV manage configuration
3. **Test both methods** - Ensure both inside/outside DDEV work

### Production
1. **Use external API server** - More control and monitoring
2. **Add authentication** - Secure the API endpoints
3. **Use HTTPS** - Encrypt API communications

## Integration with Claude Desktop/Cursor

### Claude Desktop
```bash
# Claude Desktop can call the API
curl "http://localhost:3001/api/search?q=golden"

# Or execute CLI tools
node /path/to/ai-document-system/scripts/query-db.js search "golden"
```

### Cursor
```typescript
// Cursor can integrate with the API
const response = await fetch('http://localhost:3001/api/search?q=golden');
const results = await response.json();
```

## Summary

The AI Document System integrates seamlessly with DDEV through:

- ✅ **Port exposure** for external access
- ✅ **Environment variables** for configuration
- ✅ **Volume mounts** for file access
- ✅ **Custom commands** for easy management
- ✅ **Flexible deployment** (inside or outside DDEV)

Choose the method that best fits your workflow:
- **Inside DDEV**: For development consistency
- **Outside DDEV**: For external tool integration
