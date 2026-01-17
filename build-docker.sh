#!/bin/bash

# Build script cho Docker deployment
# Usage: ./build-docker.sh

set -e

echo "🐳 Building Jira-Lark Webhook Docker Image"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Build TypeScript
echo "📦 Step 1: Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ TypeScript build failed!"
  exit 1
fi

echo "✅ TypeScript build successful"
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
  echo ""
  read -p "Press Enter after updating .env file..."
fi

echo "✅ .env file exists"
echo ""

# Step 3: Build Docker image
echo "🐳 Step 3: Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed!"
  exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Step 4: Show next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Update src/config/user-mapping.ts with team emails"
echo "  2. Rebuild: npm run build && docker-compose build"
echo "  3. Start: docker-compose up -d"
echo "  4. Check logs: docker-compose logs -f"
echo "  5. Health check: curl http://localhost:3000/health"
echo ""
