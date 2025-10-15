#!/bin/bash

# Clean build artifacts and caches

echo "🧹 Cleaning CLI Agent project..."
echo ""

# Remove build output
if [ -d "dist" ]; then
    echo "Removing dist/..."
    rm -rf dist
    echo "✓ Removed dist/"
fi

# Remove coverage
if [ -d "coverage" ]; then
    echo "Removing coverage/..."
    rm -rf coverage
    echo "✓ Removed coverage/"
fi

# Remove node_modules (optional)
if [ "$1" == "--all" ] || [ "$1" == "-a" ]; then
    if [ -d "node_modules" ]; then
        echo "Removing node_modules/..."
        rm -rf node_modules
        echo "✓ Removed node_modules/"
    fi
    
    # Remove package-lock.json
    if [ -f "package-lock.json" ]; then
        echo "Removing package-lock.json..."
        rm package-lock.json
        echo "✓ Removed package-lock.json"
    fi
fi

# Remove TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    echo "Removing tsconfig.tsbuildinfo..."
    rm tsconfig.tsbuildinfo
    echo "✓ Removed tsconfig.tsbuildinfo"
fi

# Remove log files
if ls *.log 1> /dev/null 2>&1; then
    echo "Removing log files..."
    rm -f *.log
    echo "✓ Removed log files"
fi

echo ""
echo "✅ Clean complete!"

if [ "$1" == "--all" ] || [ "$1" == "-a" ]; then
    echo ""
    echo "ℹ️  Run 'npm install' to reinstall dependencies"
fi

