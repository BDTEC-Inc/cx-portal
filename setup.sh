#!/bin/bash

# AI Compute Exchange - Development Setup Script
# This script helps set up the development environment

set -e

echo "🚀 AI Compute Exchange - Development Setup"
echo "==========================================="
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Please install Python 3."
    exit 1
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js found"
    NODE_AVAILABLE=true
else
    echo "⚠️  Node.js not found (optional, for alternative server)"
    NODE_AVAILABLE=false
fi

# Create config.js from example if it doesn't exist
if [ ! -f "config.js" ]; then
    echo ""
    echo "📝 Creating config.js from config.example.js..."
    cp config.example.js config.js
    echo "✅ config.js created. Please edit it with your edge endpoints."
else
    echo "✅ config.js already exists"
fi

# Check for CNAME configuration
if grep -q "^bdtec.ai$" CNAME 2>/dev/null; then
    echo "✅ Custom domain configured: bdtec.ai"
else
    echo "⚠️  Custom domain not configured. Edit CNAME file to set your domain."
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "🌐 Development Server Options"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Choose a server to start:"
echo ""
echo "1) Python HTTP Server (Port 8000)"
echo "2) PHP Built-in Server (Port 8000)"
echo "3) Node.js http-server (Port 8080) [requires npm]"
echo "4) Skip server setup"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting Python HTTP Server on http://localhost:8000"
        echo "   Press Ctrl+C to stop"
        echo ""
        $PYTHON_CMD -m http.server 8000
        ;;
    2)
        if command -v php &> /dev/null; then
            echo ""
            echo "🚀 Starting PHP Built-in Server on http://localhost:8000"
            echo "   Press Ctrl+C to stop"
            echo ""
            php -S localhost:8000
        else
            echo "❌ PHP not found. Please install PHP or choose another option."
        fi
        ;;
    3)
        if [ "$NODE_AVAILABLE" = true ]; then
            if command -v npx &> /dev/null; then
                echo ""
                echo "🚀 Starting http-server on http://localhost:8080"
                echo "   Press Ctrl+C to stop"
                echo ""
                npx -y http-server -p 8080
            else
                echo "⚠️  npx not found. Installing http-server globally..."
                npm install -g http-server
                echo ""
                echo "🚀 Starting http-server on http://localhost:8080"
                echo "   Press Ctrl+C to stop"
                echo ""
                http-server -p 8080
            fi
        else
            echo "❌ Node.js not found. Please install Node.js or choose another option."
        fi
        ;;
    4)
        echo ""
        echo "⏭️  Skipping server setup"
        echo ""
        echo "To start a server manually, run:"
        echo ""
        echo "  Python:   python3 -m http.server 8000"
        echo "  PHP:      php -S localhost:8000"
        echo "  Node.js:  npx http-server -p 8080"
        echo ""
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac
