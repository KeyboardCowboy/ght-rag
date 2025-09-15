#!/bin/bash

# Start API Server Script
# Starts the HTTP API server for Claude Desktop/Cursor integration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/../api-server"

# Check if DDEV is running
if ! ddev describe >/dev/null 2>&1; then
    echo "Error: DDEV is not running. Please start DDEV first with 'ddev start'"
    exit 1
fi

# Check if PostgreSQL is accessible
if ! nc -z 127.0.0.1 5432 >/dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL on port 5432"
    echo "Make sure DDEV is running and PostgreSQL is accessible"
    exit 1
fi

# Navigate to API directory
cd "$API_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing API server dependencies..."
    npm install
fi

# Start the API server
echo "🚀 Starting AI Document System API Server..."
echo "📊 API will be available at: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/health"
echo "📚 API docs: http://localhost:3001/api/stats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
