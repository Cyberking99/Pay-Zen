#!/bin/bash

# Clean installation script for the stablecoin payment platform

echo "🧹 Cleaning existing installation..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .next

echo "📦 Installing fresh dependencies..."
npm install

echo "🔍 Running type check..."
npm run type-check

echo "✅ Installation complete! Run 'npm run dev' to start the development server."
