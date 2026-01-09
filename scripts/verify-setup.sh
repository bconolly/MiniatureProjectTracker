#!/bin/bash

echo "🔧 Verifying Miniature Painting Tracker Setup..."

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check Rust backend
echo "🦀 Checking Rust backend..."
cd backend
if cargo check --quiet; then
    echo "✅ Rust backend compiles successfully"
else
    echo "❌ Rust backend compilation failed"
    exit 1
fi
cd ..

# Check React frontend
echo "⚛️  Checking React frontend..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ React frontend builds successfully"
else
    echo "❌ React frontend build failed"
    exit 1
fi

if npm run test > /dev/null 2>&1; then
    echo "✅ React frontend tests pass"
else
    echo "❌ React frontend tests failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd backend && cargo run"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:5173 in your browser"