# AI Document System - Quickstart Guide

Get up and running with the AI Document System in 5 minutes!

## Prerequisites

- DDEV installed ([Install Guide](https://ddev.readthedocs.io/en/stable/users/install/))
- Docker running (Colima on macOS, Docker Desktop on Windows/Linux)
- OpenAI API key

## 1. Setup (2 minutes)

```bash
# Clone and setup
git clone <repository-url>
cd ai-document-system
./scripts/setup-env.sh
```

## 2. Configure OpenAI (1 minute)

```bash
# Edit .env file
nano .env

# Add your API key
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## 3. Start System (1 minute)

```bash
# Start everything
./scripts/start-system.sh
```

## 4. Test Ingestion (1 minute)

```bash
# Test with sample documents
ddev exec "npm run ingest:directory test-documents --project quickstart-test"

# Check results
ddev exec "npm run ingest:status test-documents/sample.md"
```

## 🎉 You're Done!

The system is now running and ready to ingest documents. 

### Next Steps:

**Test with your own documents:**
```bash
# Copy your files to test-documents/
cp /path/to/your/document.pdf test-documents/

# Ingest them
ddev exec "npm run ingest:directory test-documents --project my-documents"
```

**Access external documents:**
```bash
# Set up volume mounts (see SETUP.md for details)
cp .ddev/docker-compose.override.yaml.example .ddev/docker-compose.override.yaml
# Edit the file with your paths, then restart DDEV
```

**Run comprehensive tests:**
```bash
./scripts/test-ingestion.sh
```

## Need Help?

- **Detailed Setup**: See `docs/SETUP.md`
- **Project Plan**: See `docs/project-plan.md`
- **Troubleshooting**: Check the logs in `indexing-service/logs/`

## Commands Reference

```bash
# System management
./scripts/start-system.sh    # Start all services
./scripts/stop-system.sh     # Stop all services
./scripts/setup-env.sh       # Initial setup

# Document ingestion
ddev exec "npm run ingest:file <path> --project <name>"
ddev exec "npm run ingest:directory <path> --project <name>"
ddev exec "npm run ingest:status <path>"

# External file helper
./scripts/ingest-external.sh /path/to/file.pdf project-name

# Testing
./scripts/test-ingestion.sh
```

Happy document processing! 🚀
