#!/bin/bash

# AI Document System - Stop Script
# This script stops all components of the AI Document System

set -e

echo "🛑 Stopping AI Document System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Stop the auto-indexing daemon if running
if [ -f ".daemon.pid" ]; then
    DAEMON_PID=$(cat .daemon.pid)
    if ps -p $DAEMON_PID > /dev/null 2>&1; then
        echo "🔄 Stopping auto-indexing daemon (PID: $DAEMON_PID)..."
        kill $DAEMON_PID
        sleep 2
        
        # Force kill if still running
        if ps -p $DAEMON_PID > /dev/null 2>&1; then
            echo "⚠️  Force stopping daemon..."
            kill -9 $DAEMON_PID
        fi
        
        echo "✅ Auto-indexing daemon stopped"
    else
        echo "ℹ️  Auto-indexing daemon was not running"
    fi
    rm -f .daemon.pid
else
    echo "ℹ️  No daemon PID file found"
fi

# Stop DDEV environment
echo "📦 Stopping DDEV environment..."
ddev stop

echo "✅ AI Document System stopped successfully!"
echo ""
echo "📊 System Status:"
echo "   - DDEV Environment: Stopped"
echo "   - PostgreSQL Database: Stopped"
echo "   - Auto-Indexing Daemon: Stopped"
echo ""
echo "💡 To start the system again, run: ./scripts/start-system.sh"
