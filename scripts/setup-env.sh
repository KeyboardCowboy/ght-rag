#!/bin/bash

# AI Document System - Environment Setup Script
# This script sets up the development environment

set -e

echo "🔧 Setting up AI Document System environment..."

# Check if DDEV is installed
if ! command -v ddev &> /dev/null; then
    echo "❌ DDEV is not installed. Please install DDEV first."
    echo "   Visit: https://ddev.readthedocs.io/en/stable/users/install/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# AI Document System Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_documents

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info

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
EOF
    echo "✅ Created .env file with default values"
    echo "⚠️  Please update OPENAI_API_KEY in .env file with your actual API key"
else
    echo "ℹ️  .env file already exists"
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

# Start DDEV environment
echo "📦 Starting DDEV environment..."
ddev start

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is running
if ! ddev exec "pg_isready -h postgres -p 5432" &> /dev/null; then
    echo "❌ PostgreSQL is not ready. Please check DDEV status."
    exit 1
fi

echo "✅ PostgreSQL is ready"

# Install dependencies
echo "📦 Installing dependencies..."
ddev exec "npm install"

# Test database connection
echo "🔍 Testing database connection..."
if ddev exec "node -e \"require('./indexing-service/src/database/connection').connect().then(() => console.log('✅ Database connection successful')).catch(e => {console.error('❌ Database connection failed:', e.message); process.exit(1)})\""; then
    echo "✅ Database connection test passed"
else
    echo "❌ Database connection test failed"
    exit 1
fi

echo ""
echo "🎉 Environment setup completed successfully!"
echo ""
echo "📊 System Status:"
echo "   - DDEV Environment: Running"
echo "   - PostgreSQL Database: Ready"
echo "   - Dependencies: Installed"
echo "   - Database Connection: Tested"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update OPENAI_API_KEY in .env file"
echo "   2. Test manual ingestion: ddev exec 'npm run ingest:file test-documents/sample.md --project test'"
echo "   3. Start the system: ./scripts/start-system.sh"
echo ""
echo "📁 Optional: Configure External Document Access"
echo "   If you want to ingest documents from outside the project directory:"
echo "   1. Copy: cp .ddev/docker-compose.override.yaml.example .ddev/docker-compose.override.yaml"
echo "   2. Edit: nano .ddev/docker-compose.override.yaml"
echo "   3. Add your paths (see SETUP.md for examples)"
echo "   4. Restart: ddev restart"
echo ""
echo "📚 Documentation:"
echo "   - Quickstart: QUICKSTART.md"
echo "   - Setup Guide: docs/SETUP.md"
echo "   - Project Plan: docs/project-plan.md"
echo "   - Progress Tracker: docs/project-progress.md"
