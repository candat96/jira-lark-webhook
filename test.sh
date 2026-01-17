#!/bin/bash

# Jira-Lark Webhook - Quick Test Script
# Usage: ./test.sh

BASE_URL="http://localhost:3000"

echo "🧪 Testing Jira-Lark Webhook Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Health Check
echo "1️⃣  Testing Health Check..."
curl -s $BASE_URL/health | jq .
echo ""

# 2. Test Lark Integration
echo "2️⃣  Testing Lark Integration..."
curl -s $BASE_URL/test | jq .
echo ""

# 3. Test Issue Created
echo "3️⃣  Testing Issue Created Event..."
curl -s -X POST $BASE_URL/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json | jq .
echo ""

# 4. Test Status Changed
echo "4️⃣  Testing Status Changed Event..."
curl -s -X POST $BASE_URL/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/status-changed.json | jq .
echo ""

# 5. Test Assignee Changed
echo "5️⃣  Testing Assignee Changed Event..."
curl -s -X POST $BASE_URL/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/assignee-changed.json | jq .
echo ""

# 6. Test Comment Added
echo "6️⃣  Testing Comment Added Event..."
curl -s -X POST $BASE_URL/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/comment-added.json | jq .
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests completed!"
echo "Check your Lark group for notifications."
