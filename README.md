# AI Document System

A local AI-powered document intelligence system with auto-indexing file system monitoring and manual ingestion capabilities. Process documents through CLI tools and automated file system monitoring, providing AI-powered search through Claude Desktop or Cursor integration.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd ai-document-system
./scripts/setup-env.sh

# Configure OpenAI API key
nano .env  # Add OPENAI_API_KEY=your_key_here

# Start the system
./scripts/start-system.sh

# Test with sample documents
ddev exec "npm run ingest:directory test-documents --project quickstart-test"
```

**📖 [Complete Setup Guide](docs/SETUP.md)** | **⚡ [Quickstart Guide](QUICKSTART.md)**

## ✨ Features

- **📄 Multi-format Support**: PDF, DOCX, TXT, MD files
- **🔍 AI-Powered Search**: Semantic search with OpenAI embeddings
- **📁 Auto-Indexing**: File system monitoring with automatic processing
- **🛠️ Manual Ingestion**: CLI tools for batch document processing
- **🗄️ Vector Storage**: PostgreSQL with pgvector for efficient search
- **⚙️ Configurable**: Customizable chunk sizes, overlap, and processing parameters
- **🔗 External Access**: Volume mounts for documents outside project directory

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File System   │───▶│  Auto-Indexing  │───▶│  Vector Store   │
│   Monitoring    │    │     Service      │    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Manual CLI     │───▶│  Document        │───▶│  AI Search      │
│  Ingestion      │    │  Processing      │    │  & Query        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Current Status

**✅ Completed:**
- Environment setup (DDEV + PostgreSQL + pgvector)
- Manual document ingestion pipeline
- Multi-format document processing (PDF, DOCX, TXT, MD)
- Database schema and storage
- CLI tools for batch processing
- External document access via volume mounts

**🔄 In Progress:**
- Document processing pipeline optimization
- Background queue management
- Auto-indexing daemon

**📅 Planned:**
- File system watcher implementation
- Vector search and retrieval system
- AI integration and intelligence features
- System orchestration and management tools

See [Project Progress](docs/project-progress.md) for detailed status.

## 🛠️ Usage

### Manual Document Ingestion

```bash
# Single file
ddev exec "npm run ingest:file test-documents/document.pdf --project my-project"

# Directory batch processing
ddev exec "npm run ingest:directory test-documents --project my-project --recursive"

# Custom chunk settings
ddev exec "npm run ingest:directory test-documents --project my-project --chunk-size 1500 --overlap 300"

# Check document status
ddev exec "npm run ingest:status test-documents/document.pdf"
```

### External Document Access

```bash
# Set up volume mounts (one-time setup)
cp .ddev/docker-compose.override.yaml.example .ddev/docker-compose.override.yaml
# Edit the file with your paths, then restart DDEV

# Ingest from external directories
ddev exec "npm run ingest:directory /var/www/html/external-docs --project external"

# Use the external ingestion helper
./scripts/ingest-external.sh /path/to/your/document.pdf my-project
```

### System Management

```bash
# Start all services
./scripts/start-system.sh

# Stop all services  
./scripts/stop-system.sh

# Run comprehensive tests
./scripts/test-ingestion.sh

# Check system status
ddev describe
```

## 📁 Project Structure

```
ai-document-system/
├── .ddev/                          # DDEV configuration
│   ├── docker-compose.override.yaml.example  # Volume mount template
│   └── config.yaml                 # DDEV settings
├── database/init/                  # Database initialization
├── indexing-service/               # Core indexing service
│   ├── src/                        # Source code
│   │   ├── cli/                    # CLI tools
│   │   ├── processors/             # Document processors
│   │   ├── database/               # Database utilities
│   │   └── utils/                  # Utilities
│   └── daemon.js                   # Main daemon
├── scripts/                        # Management scripts
│   ├── start-system.sh             # Start all services
│   ├── stop-system.sh              # Stop all services
│   ├── setup-env.sh                # Environment setup
│   ├── test-ingestion.sh           # Test suite
│   └── ingest-external.sh          # External file helper
├── shared/                         # Shared components
│   ├── api/                        # AI service
│   └── database/                   # Database utilities
├── test-documents/                 # Sample documents
├── docs/                           # Documentation
└── package.json                    # Project configuration
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_documents

# OpenAI (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Processing
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=200
MAX_CONCURRENT_PROCESSING=3

# Vector Search
EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=10
```

### Volume Mounts

To access documents outside the project directory, configure volume mounts:

```yaml
# .ddev/docker-compose.override.yaml
services:
  web:
    volumes:
      - /Users/yourusername/Documents:/var/www/html/external-docs
      - /Users/yourusername/Downloads:/var/www/html/downloads
```

## 🧪 Testing

```bash
# Run the test suite
./scripts/test-ingestion.sh

# Test specific scenarios
ddev exec "npm run ingest:file test-documents/sample.md --project test"
ddev exec "npm run ingest:directory test-documents --project test-batch"

# Test external documents (if volume mounted)
ddev exec "npm run ingest:directory /var/www/html/external-docs --project external-test"
```

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Comprehensive setup instructions
- **[Quickstart Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Project Plan](docs/project-plan.md)** - Complete development roadmap
- **[Project Progress](docs/project-progress.md)** - Current status and progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `./scripts/test-ingestion.sh`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Check the logs in `indexing-service/logs/`
- **Documentation**: See `docs/` directory
- **Troubleshooting**: See [SETUP.md](docs/SETUP.md#troubleshooting)

---

**Built with ❤️ for local AI document intelligence**
