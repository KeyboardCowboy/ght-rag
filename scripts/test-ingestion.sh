#!/bin/bash

# Test Script for Manual Document Ingestion
# This script demonstrates various ingestion scenarios

set -e

echo "🧪 AI Document System - Ingestion Testing"
echo "========================================"

# Check if DDEV is running
if ! ddev describe &> /dev/null; then
    echo "❌ DDEV is not running. Please start it first: ddev start"
    exit 1
fi

echo "✅ DDEV is running"

# Test 1: Single file ingestion
echo ""
echo "📄 Test 1: Single File Ingestion"
echo "--------------------------------"
ddev exec "npm run ingest:file test-documents/sample.md --project test-single"

# Test 2: Directory ingestion
echo ""
echo "📁 Test 2: Directory Ingestion"
echo "------------------------------"
ddev exec "npm run ingest:directory test-documents --project test-directory"

# Test 3: Custom chunk settings
echo ""
echo "🔧 Test 3: Custom Chunk Settings"
echo "--------------------------------"
ddev exec "npm run ingest:directory test-documents --project test-chunks --chunk-size 1500 --overlap 300"

# Test 4: Check document status
echo ""
echo "📊 Test 4: Document Status Check"
echo "--------------------------------"
ddev exec "npm run ingest:status test-documents/project-report.md"

echo ""
echo "🎉 All ingestion tests completed!"
echo ""
echo "💡 To test with your own files:"
echo "   1. Copy your files to test-documents/"
echo "   2. Run: ddev exec 'npm run ingest:directory test-documents --project my-project'"
echo "   3. Check status: ddev exec 'npm run ingest:status <file-path>'"
