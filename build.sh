#!/bin/bash

echo "Building Fastmail Electron App..."

# Generate icons if they don't exist
if [ ! -f "assets/icon.png" ]; then
    echo "Generating icons..."
    ./scripts/generate-icons.sh
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Build for Linux
echo "Building Linux packages..."
npm run build:linux

echo "Build complete! Check the dist/ directory for packages."
echo ""
echo "Available packages:"
ls -la dist/ 2>/dev/null || echo "No packages found. Check for build errors above."
