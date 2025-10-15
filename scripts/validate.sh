#!/bin/bash

# Validate project before commit/push

set -e

echo "✅ Validating CLI Agent project..."
echo ""

# Lint code
echo "1️⃣  Linting code..."
npm run lint
echo "✓ Lint passed"
echo ""

# Check formatting
echo "2️⃣  Checking code formatting..."
npx prettier --check "src/**/*.ts" "tests/**/*.ts"
echo "✓ Format check passed"
echo ""

# Type check
echo "3️⃣  Type checking..."
npx tsc --noEmit
echo "✓ Type check passed"
echo ""

# Run tests
echo "4️⃣  Running tests..."
npm test -- --passWithNoTests
echo "✓ Tests passed"
echo ""

# Build project
echo "5️⃣  Building project..."
npm run build
echo "✓ Build successful"
echo ""

echo "✅ All validation checks passed!"
echo ""
echo "Project is ready to commit/push! 🚀"

