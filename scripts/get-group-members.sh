#!/bin/bash

# Script để lấy tất cả Open IDs của members trong Lark group
# Usage: ./get-group-members.sh

echo "🔍 Lark Group Members Open ID Fetcher"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Bot Token is provided
if [ -z "$LARK_BOT_TOKEN" ]; then
  echo "❌ Error: LARK_BOT_TOKEN environment variable not set"
  echo ""
  echo "How to get Bot Token:"
  echo "1. Go to: https://open.larksuite.com/app"
  echo "2. Create custom app or use existing"
  echo "3. Get App ID & App Secret"
  echo "4. Run this command first:"
  echo ""
  echo "   export LARK_BOT_TOKEN=\$(curl -s -X POST 'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal' \\"
  echo "     -H 'Content-Type: application/json' \\"
  echo "     -d '{\"app_id\":\"YOUR_APP_ID\",\"app_secret\":\"YOUR_APP_SECRET\"}' \\"
  echo "     | jq -r '.tenant_access_token')"
  echo ""
  exit 1
fi

echo "✅ Bot Token found"
echo ""

# Step 1: Get all chats
echo "📋 Step 1: Fetching all chats..."
CHATS=$(curl -s -X GET "https://open.larksuite.com/open-apis/im/v1/chats?user_id_type=open_id&page_size=50" \
  -H "Authorization: Bearer $LARK_BOT_TOKEN")

# Check if successful
if [ $(echo "$CHATS" | jq -r '.code') != "0" ]; then
  echo "❌ Error fetching chats:"
  echo "$CHATS" | jq '.'
  exit 1
fi

# Display chats
echo ""
echo "Available chats:"
echo "$CHATS" | jq -r '.data.items[] | "\(.chat_id) - \(.name)"'
echo ""

# Ask user to select chat
read -p "Enter Chat ID: " CHAT_ID

if [ -z "$CHAT_ID" ]; then
  echo "❌ Chat ID required"
  exit 1
fi

echo ""
echo "📋 Step 2: Fetching members in chat: $CHAT_ID"
echo ""

# Step 2: Get members
MEMBERS=$(curl -s -X GET "https://open.larksuite.com/open-apis/im/v1/chats/$CHAT_ID/members?user_id_type=open_id&member_id_type=open_id&page_size=100" \
  -H "Authorization: Bearer $LARK_BOT_TOKEN")

# Check if successful
if [ $(echo "$MEMBERS" | jq -r '.code') != "0" ]; then
  echo "❌ Error fetching members:"
  echo "$MEMBERS" | jq '.'
  exit 1
fi

# Display results
echo "✅ Members found:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "%-30s | %-25s\n" "Name" "Open ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "$MEMBERS" | jq -r '.data.items[] | "\(.name)|\(.member_id)"' | while IFS='|' read -r name member_id; do
  printf "%-30s | %-25s\n" "$name" "$member_id"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Export to CSV
OUTPUT_FILE="lark-members-$(date +%Y%m%d-%H%M%S).csv"
echo "Name,Open ID" > "$OUTPUT_FILE"
echo "$MEMBERS" | jq -r '.data.items[] | "\(.name),\(.member_id)"' >> "$OUTPUT_FILE"

echo "💾 Exported to: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Match names với Jira emails"
echo "2. Update src/config/user-mapping.ts"
echo "3. Test mentions"
