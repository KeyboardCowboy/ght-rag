# AI Document System - Setup Guide

This guide will help you set up the AI Document System on your local machine for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **DDEV** (v1.24.0 or later) - [Installation Guide](https://ddev.readthedocs.io/en/stable/users/install/)
- **Docker** with **Colima** (macOS) or **Docker Desktop** (Windows/Linux)
- **Node.js** (v18 or later)
- **Git**

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd ai-document-system

# Run the setup script
./scripts/setup-env.sh
```

### 2. Configure External Document Access (Optional)

If you want to ingest documents from outside the project directory:

```bash
# Copy the template
cp .ddev/docker-compose.override.yaml.example .ddev/docker-compose.override.yaml

# Edit the file with your paths
nano .ddev/docker-compose.override.yaml
```

Example configuration:
```yaml
services:
  web:
    volumes:
      - /Users/yourusername/Documents:/var/www/html/external-docs
      - /Users/yourusername/Downloads:/var/www/html/downloads
```

### 3. Configure OpenAI API Key

```bash
# Edit the environment file
nano .env

# Add your OpenAI API key
OPENAI_API_KEY=your_actual_api_key_here
```

### 4. Start the System

```bash
# Start all services
./scripts/start-system.sh

# Or manually
ddev start
```

## Detailed Setup

### Environment Configuration

The system uses a `.env` file for configuration. Copy the example and customize:

```bash
cp .env.example .env
```

Key configuration options:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_documents

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Processing Configuration
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=200
MAX_CONCURRENT_PROCESSING=3

# File Watching Configuration
WATCH_DEPTH_LIMIT=5
DEBOUNCE_DELAY=1000

# Vector Search Configuration
EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=10
```

### Volume Mounts for External Documents

To access documents outside the project directory, create a `docker-compose.override.yaml` file:

```bash
# Copy the template
cp .ddev/docker-compose.override.yaml.example .ddev/docker-compose.override.yaml

# Edit with your paths
nano .ddev/docker-compose.override.yaml
```

**Example configurations:**

**macOS:**
```yaml
services:
  web:
    volumes:
      - /Users/yourusername/Documents:/var/www/html/external-docs
      - /Users/yourusername/Downloads:/var/www/html/downloads
```

**Linux:**
```yaml
services:
  web:
    volumes:
      - /home/yourusername/Documents:/var/www/html/external-docs
      - /home/yourusername/Downloads:/var/www/html/downloads
```

**Windows (WSL2):**
```yaml
services:
  web:
    volumes:
      - /mnt/c/Users/yourusername/Documents:/var/www/html/external-docs
      - /mnt/c/Users/yourusername/Downloads:/var/www/html/downloads
```

## Testing the Setup

### 1. Test Basic Functionality

```bash
# Test with sample documents
ddev exec "npm run ingest:directory test-documents --project test-setup"

# Check document status
ddev exec "npm run ingest:status test-documents/sample.md"
```

### 2. Test External Document Access

If you configured volume mounts:

```bash
# List available external documents
ddev exec "ls -la /var/www/html/external-docs/"

# Ingest from external directory
ddev exec "npm run ingest:directory /var/www/html/external-docs --project external-test"
```

### 3. Run Test Suite

```bash
# Run the comprehensive test script
./scripts/test-ingestion.sh
```

## Usage Examples

### Manual Document Ingestion

```bash
# Single file
ddev exec "npm run ingest:file test-documents/document.pdf --project my-project"

# Directory with custom settings
ddev exec "npm run ingest:directory test-documents --project my-project --chunk-size 1500 --overlap 300"

# External files (if volume mounted)
ddev exec "npm run ingest:file /var/www/html/external-docs/document.pdf --project external"
```

### Using the External Ingestion Helper

```bash
# Ingest files from anywhere on your system
./scripts/ingest-external.sh /path/to/your/document.pdf my-project
./scripts/ingest-external.sh /path/to/your/documents/ my-project
```

## Troubleshooting

### Common Issues

**1. DDEV won't start:**
```bash
# Check Docker is running
docker ps

# Restart DDEV
ddev restart
```

**2. Database connection fails:**
```bash
# Check PostgreSQL is running
ddev exec "pg_isready -h postgres -p 5432"

# Restart DDEV
ddev restart
```

**3. OpenAI API errors:**
- Verify your API key is correct in `.env`
- Check you have credits in your OpenAI account
- Ensure the API key has the correct permissions

**4. Volume mount not working:**
- Verify the path exists on your host system
- Check file permissions
- Restart DDEV after changing volume mounts

**5. File encoding errors:**
- Some PDFs may contain non-UTF8 characters
- The system will log warnings but continue processing
- Consider using different PDF processing libraries for problematic files

### Getting Help

- Check the logs: `ddev exec "tail -f indexing-service/logs/combined.log"`
- Review the project documentation in `docs/`
- Check the project progress tracker: `docs/project-progress.md`

## Development Workflow

### Daily Development

```bash
# Start the system
./scripts/start-system.sh

# Make changes to code
# Test your changes
ddev exec "npm run ingest:file test-documents/sample.md --project dev-test"

# Stop when done
./scripts/stop-system.sh
```

### Adding New Features

1. Make your code changes
2. Test with the test suite: `./scripts/test-ingestion.sh`
3. Test with external documents if applicable
4. Update documentation as needed

## Production Considerations

This setup is designed for development and testing. For production deployment:

- Use a production PostgreSQL database
- Implement proper security measures
- Use environment-specific configuration
- Set up monitoring and logging
- Consider using a container orchestration platform

## Next Steps

Once setup is complete:

1. **Test the manual ingestion system** (Step 2.1) ✅
2. **Move to Step 2.2**: Document Processing Pipeline
3. **Implement auto-indexing**: File system monitoring
4. **Add AI features**: Embedding generation and search
5. **Build the interface**: Query and search capabilities

See `docs/project-plan.md` for the complete development roadmap.
