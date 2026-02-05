#!/bin/bash

set -e

echo "Installing dependencies for TalkBackControl..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    echo "Or on macOS with Homebrew: brew install node"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "Please install npm (comes with Node.js)"
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo "✓ npm $(npm --version) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
# Fix execute permissions on binaries (macOS issue)
chmod -R +x node_modules/.bin 2>/dev/null || true
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
# Fix execute permissions on binaries (macOS issue)
chmod -R +x node_modules/.bin 2>/dev/null || true
cd ..
echo "✓ Frontend dependencies installed"
echo ""

echo "🎉 All dependencies installed successfully!"
echo ""
echo "You can now run:"
echo "  ./start-dev.sh    - Start both backend and frontend in development mode"
echo "  npm run dev       - Inside backend/ or frontend/ directories for individual development"
