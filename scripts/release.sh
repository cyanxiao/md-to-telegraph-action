#!/bin/bash

# Release script for md-to-telegraph-action
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh v1.2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version is provided
if [ -z "$1" ]; then
    print_error "Please provide a version number (e.g., v1.2.0)"
    exit 1
fi

VERSION=$1

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Version must be in format vX.Y.Z (e.g., v1.2.0)"
    exit 1
fi

print_status "Starting release process for version $VERSION"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main

# Run tests
print_status "Running tests..."
bun run test

# Build and package
print_status "Building and packaging..."
bun run prepare-release

# Check if dist is up to date
print_status "Checking if dist/ is up to date..."
if [ -n "$(git status --porcelain dist/)" ]; then
    print_status "dist/ folder has changes, committing them..."
    git add dist/
    git commit -m "build: update dist for release $VERSION"
fi

# Update version in package.json
print_status "Updating version in package.json..."
# Extract version number without 'v' prefix
VERSION_NUM=${VERSION#v}
# Use sed to update package.json version
sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION_NUM\"/" package.json
rm -f package.json.bak
git add package.json
git commit -m "chore: bump version to $VERSION"

# Create and push tag
print_status "Creating and pushing tag $VERSION..."
git tag -a $VERSION -m "Release $VERSION"
git push origin main
git push origin $VERSION

print_status "Release $VERSION initiated successfully!"
print_status "The release workflow will now run automatically."
print_status "Check: https://github.com/cyanxiao/md-to-telegraph-action/actions"
