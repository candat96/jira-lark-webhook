#!/bin/bash

# Build script cho Docker deployment
# Docker sẽ tự động build TypeScript bên trong
# Usage: ./build-docker.sh

set -e

echo "🐳 Building Jira-Lark Webhook Docker Image"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check Docker daemon
echo "🔍 Step 1: Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker daemon is not running!"
  echo ""
  echo "Please start Docker Desktop first:"
  echo "  - macOS: Open Docker Desktop app"
  echo "  - Linux: sudo systemctl start docker"
  echo "  - Windows: Start Docker Desktop"
  echo ""
  exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Step 2: Check .env file
echo "🔍 Step 2: Checking .env file..."
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  echo "Creating from .env.example..."
  cp .env.example .env
  echo ""
  echo "⚠️  Please edit .env file with your configuration:"
  echo "   - WEBHOOK_URL"
  echo "   - SERVER_URL"
  echo "   - JIRA_URL"
  echo ""
  read -p "Press Enter after updating .env file..."
fi

echo "✅ .env file exists"
echo ""

# Step 3: Build Docker image (TypeScript will be built inside Docker)
echo "🐳 Step 3: Building Docker image..."
echo "   (TypeScript will be compiled inside Docker)"
echo ""
docker-compose build

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed!"
  exit 1
fi

echo ""
echo "✅ Docker image built successfully"
echo ""

# Step 4: Show next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Update src/config/user-mapping.ts with team emails"
echo "  2. Update SERVER_URL in .env"
echo "  3. If you made changes, rebuild: docker-compose build"
echo "  4. Start: docker-compose up -d"
echo "  5. Check logs: docker-compose logs -f"
echo "  6. Health check: curl http://localhost:3000/health"
echo ""
