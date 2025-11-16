#!/bin/bash

# GitFlow CLI - Quick Install Script
# This script installs GitFlow CLI globally

set -e

echo "🚀 GitFlow CLI - Installation Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.0.0 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to 16.0.0 or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git."
    echo "Visit: https://git-scm.com/"
    exit 1
fi

echo "✅ Git is installed"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Clone repository
echo "📥 Cloning GitFlow CLI repository..."
git clone https://github.com/yourusername/gitflow-cli.git "$TEMP_DIR"

# Navigate to directory
cd "$TEMP_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project
echo "🔨 Building project..."
npm run build

# Install globally
echo "🌍 Installing globally..."
npm install -g .

# Cleanup
echo "🧹 Cleaning up..."
cd /
rm -rf "$TEMP_DIR"

# Verify installation
echo "✅ Verifying installation..."
if command -v gitflow &> /dev/null; then
    echo "🎉 GitFlow CLI installed successfully!"
    echo ""
    echo "Version: $(gitflow --version)"
    echo ""
    echo "🚀 Quick Start:"
    echo "  gitflow config setup    # Run setup wizard"
    echo "  gitflow --help         # Show help"
    echo "  gitflow init            # Initialize repository"
    echo ""
    echo "📚 For more information, visit: https://github.com/yourusername/gitflow-cli"
else
    echo "❌ Installation failed. Please try manual installation."
    echo "Visit: https://github.com/yourusername/gitflow-cli#installation"
    exit 1
fi