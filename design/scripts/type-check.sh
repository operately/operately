#!/bin/bash

# Script to run TypeScript type checking on the codebase
# Used in pre-commit hooks and CI/CD pipelines

echo "Running TypeScript type check..."

# Run TypeScript compiler without emitting files
npx tsc --noEmit

# Store the exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ TypeScript check passed!"
  exit 0
else
  echo "❌ TypeScript check failed! Please fix the type errors before committing."
  exit 1
fi
