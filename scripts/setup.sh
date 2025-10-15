#!/bin/bash

# Setup script for CLI Agent development environment

set -e

echo "🚀 Setting up CLI Agent development environment..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "   Current version: $(node -v)"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔑 Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please edit .env and add your API keys"
    echo ""
fi

# Build the project
echo "🔨 Building project..."
npm run build
echo "✓ Project built"
echo ""

# Create config directory
echo "📁 Creating config directory..."
CONFIG_DIR="$HOME/.cli-agent"
if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    echo "✓ Config directory created at $CONFIG_DIR"
else
    echo "✓ Config directory already exists"
fi
echo ""

# Link globally (optional)
read -p "🔗 Link CLI globally? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm link
    echo "✓ CLI linked globally"
    echo "✓ You can now run 'cli-agent' from anywhere"
else
    echo "ℹ️  Skipped global linking"
    echo "ℹ️  Use 'npm start' or 'npm run dev' to run commands"
fi
echo ""

# Run tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests
echo "✓ Tests passed"
echo ""

# Summary
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run: cli-agent init (or npm start -- init)"
echo "  3. Try: cli-agent --help"
echo ""
echo "Development commands:"
echo "  npm run dev -- <command>   # Run without building"
echo "  npm run watch              # Watch for changes"
echo "  npm test                   # Run tests"
echo "  npm run lint               # Lint code"
echo ""
echo "Documentation:"
echo "  README.md           # Main documentation"
echo "  QUICK_START.md      # Quick start guide"
echo "  ARCHITECTURE.md     # Architecture details"
echo "  CONTRIBUTING.md     # Contributing guidelines"
echo ""
echo "Happy coding! 🎉"

