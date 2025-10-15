#!/bin/bash

# Test script with various test modes

set -e

echo "🧪 Running CLI Agent tests..."
echo ""

# Parse arguments
MODE=${1:-all}

case $MODE in
  unit)
    echo "Running unit tests only..."
    npm test -- tests/utils tests/core --coverage
    ;;
  
  integration)
    echo "Running integration tests only..."
    npm test -- tests/commands --coverage
    ;;
  
  watch)
    echo "Running tests in watch mode..."
    npm test -- --watch
    ;;
  
  coverage)
    echo "Running tests with coverage..."
    npm test -- --coverage --coverageReporters=text-lcov --coverageReporters=html
    echo ""
    echo "✓ Coverage report generated in coverage/"
    ;;
  
  ci)
    echo "Running tests in CI mode..."
    npm test -- --ci --coverage --maxWorkers=2
    ;;
  
  all|*)
    echo "Running all tests..."
    npm test
    ;;
esac

echo ""
echo "✅ Tests completed!"

