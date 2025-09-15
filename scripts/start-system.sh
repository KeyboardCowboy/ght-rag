#!/bin/bash

# AI Document System - Start Script
# This script starts all components of the AI Document System

set -e

echo "🚀 Starting AI Document System..."

# Check if DDEV is installed
if ! command -v ddev &> /dev/null; then
    echo "❌ DDEV is not installed. Please install DDEV first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Start DDEV environment
echo "📦 Starting DDEV environment..."
ddev start

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is running
if ! ddev exec "pg_isready -h postgres -p 5432" &> /dev/null; then
    echo "❌ PostgreSQL is not ready. Please check DDEV status."
    exit 1
fi

echo "✅ PostgreSQL is ready"

# Install dependencies if needed
echo "📦 Checking dependencies..."
ddev exec "npm install"
ddev exec "cd indexing-service && npm install"

# Start the auto-indexing daemon
echo "🔄 Starting auto-indexing daemon..."
ddev exec "cd indexing-service && npm start" &

# Store the PID for later cleanup
echo $! > .daemon.pid

echo "✅ AI Document System started successfully!"
echo ""
echo "📊 System Status:"
echo "   - DDEV Environment: Running"
echo "   - PostgreSQL Database: Ready"
echo "   - Auto-Indexing Daemon: Running (PID: $(cat .daemon.pid))"
echo ""
echo "🔧 Available Commands:"
echo "   - Test ingestion: ddev exec 'cd indexing-service && npm run ingest file <path> --project <name>'"
echo "   - Check status: ddev exec 'cd indexing-service && npm run ingest status <path>'"
echo "   - Stop system: ./scripts/stop-system.sh"
echo ""
echo "📝 Logs are available in:"
echo "   - indexing-service/logs/"
echo "   - logs/"
