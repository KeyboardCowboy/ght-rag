#!/bin/bash

# External File Ingestion Helper Script
# This script helps you ingest files from outside the project directory

set -e

echo "📁 External File Ingestion Helper"
echo "================================"

# Check if DDEV is running
if ! ddev describe &> /dev/null; then
    echo "❌ DDEV is not running. Please start it first: ddev start"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 <external-file-or-directory> [project-name]"
    echo ""
    echo "Examples:"
    echo "  $0 /path/to/document.pdf my-project"
    echo "  $0 /path/to/documents/ my-project"
    echo "  $0 ~/Documents/reports/ reports"
    echo ""
    echo "The script will:"
    echo "  1. Copy the file(s) to test-documents/"
    echo "  2. Ingest them into the system"
    echo "  3. Show the results"
}

# Check arguments
if [ $# -lt 1 ]; then
    show_usage
    exit 1
fi

EXTERNAL_PATH="$1"
PROJECT_NAME="${2:-external-files}"

# Check if external path exists
if [ ! -e "$EXTERNAL_PATH" ]; then
    echo "❌ External path does not exist: $EXTERNAL_PATH"
    exit 1
fi

echo "📂 External path: $EXTERNAL_PATH"
echo "📁 Project name: $PROJECT_NAME"
echo ""

# Create a temporary directory for this ingestion
TEMP_DIR="test-documents/external-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "📋 Copying files to: $TEMP_DIR"

# Copy files
if [ -f "$EXTERNAL_PATH" ]; then
    # Single file
    cp "$EXTERNAL_PATH" "$TEMP_DIR/"
    echo "✅ Copied file: $(basename "$EXTERNAL_PATH")"
elif [ -d "$EXTERNAL_PATH" ]; then
    # Directory
    cp -r "$EXTERNAL_PATH"/* "$TEMP_DIR/" 2>/dev/null || true
    echo "✅ Copied directory contents from: $(basename "$EXTERNAL_PATH")"
else
    echo "❌ Invalid path type"
    exit 1
fi

# Show what was copied
echo ""
echo "📄 Files ready for ingestion:"
ls -la "$TEMP_DIR"

echo ""
echo "🔄 Starting ingestion..."

# Ingest the files
if ddev exec "npm run ingest:directory $TEMP_DIR --project $PROJECT_NAME --recursive"; then
    echo ""
    echo "✅ Ingestion completed successfully!"
    echo ""
    echo "📊 Summary:"
    echo "   - Project: $PROJECT_NAME"
    echo "   - Files ingested from: $EXTERNAL_PATH"
    echo "   - Temporary directory: $TEMP_DIR"
    echo ""
    echo "💡 To check status of individual files:"
    echo "   ddev exec \"npm run ingest:status $TEMP_DIR/<filename>\""
    echo ""
    echo "🗑️  To clean up temporary files:"
    echo "   rm -rf $TEMP_DIR"
else
    echo "❌ Ingestion failed"
    exit 1
fi
