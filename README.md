# 🔔 Jira-Lark Webhook Integration

Automatically send notifications to Lark group when Jira issues are created, updated, or commented by your team members.

## ✨ Features

- ✅ **New Issue Notifications** - Alert when new issues are created and assigned to team members
- ✅ **Status Change Tracking** - Monitor issue status transitions (To Do → In Progress → Done)
- ✅ **Assignee Updates** - Get notified when issues are reassigned
- ✅ **Comment Alerts** - Receive new comment notifications (excludes self-comments)
- ✅ **Smart Filtering** - Only notify for issues involving team members (reporter or assignee)
- ✅ **Rich Card Messages** - Beautiful Lark card format with @mentions and direct links
- ✅ **User Mapping** - Map Jira users to Lark users for proper @mentions

## 🏗️ Architecture

```
┌─────────┐         ┌──────────────────┐         ┌──────────┐
│  Jira   │ webhook │  Express Server  │  POST   │   Lark   │
│ System  │────────>│   Node.js/TS     │────────>│  Group   │
└─────────┘         └──────────────────┘         └──────────┘
```

## 📋 Prerequisites

- **Node.js** v18 or higher
- **Jira Admin Access** (to configure webhooks)
- **Lark Bot Webhook URL** (from Lark group settings)
- **Public Server or ngrok** (for receiving Jira webhooks)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or navigate to project directory
cd jira-lark-webhook

# Install dependencies
npm install
```

### 2. Configuration

#### a) Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR-WEBHOOK-ID
SERVER_URL=http://your-public-ip:3000
NODE_ENV=production
```

#### b) User Mapping

Edit `src/config/user-mapping.ts` to map Jira users to Lark Open IDs:

```typescript
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {
  'john.doe@company.com': 'ou_a1b2c3d4e5f6g7h8',
  'jane.smith@company.com': 'ou_x1y2z3a4b5c6d7e8',
  // Add all team members here
};
```

**How to get Lark Open ID:**

1. **Method 1: Lark Admin Console**
   - Go to Admin Console → Organization → Members
   - Click on user → Copy "Open ID"

2. **Method 2: Lark API** (if you have bot token)
   ```bash
   curl -X GET \
     'https://open.larksuite.com/open-apis/contact/v3/users/:user_id' \
     -H 'Authorization: Bearer YOUR_BOT_TOKEN'
   ```

3. **Method 3: Ask users to send message**
   - Ask users to send a message in the group
   - Bot can extract Open ID from message events

### 3. Running the Server

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

#### Using PM2 (Recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Build project
npm run build

# Start with PM2
pm2 start dist/index.js --name jira-lark-webhook

# Save PM2 configuration
pm2 save

# Setup auto-restart on system reboot
pm2 startup
```

### 4. Test the Integration

#### a) Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:00:00.000Z",
  "service": "jira-lark-webhook"
}
```

#### b) Test Lark Message

```bash
curl http://localhost:3000/test
```

You should receive a test message in your Lark group.

#### c) Test with Mock Jira Payload

```bash
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json
```

### 5. Configure Jira Webhook

1. Go to Jira: **Settings → System → WebHooks**
2. Click **Create a WebHook**
3. Configure:
   - **Name**: `Lark Notifications`
   - **URL**: `http://your-public-ip:3000/webhook/jira`
   - **Events**: 
     - ✅ Issue → created
     - ✅ Issue → updated
     - ✅ Comment → created
   - **JQL Filter** (optional): Add filter to limit notifications
4. Click **Create**
5. Test the webhook using Jira's "Test" button

## 📡 API Endpoints

### POST `/webhook/jira`
Receive Jira webhook events

**Request**: Jira webhook payload (JSON)

**Response**: `200 OK` (always, to prevent Jira retries)

### GET `/health`
Health check endpoint

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:00:00.000Z",
  "service": "jira-lark-webhook"
}
```

### GET `/test`
Send test message to Lark

**Response**:
```json
{
  "success": true,
  "message": "Test message sent to Lark successfully"
}
```

## 📊 Notification Examples

### 🎫 New Issue Created

```
🎫 Ticket mới được tạo
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
📊 Status: To Do
🔖 Type: Bug
⚡ Priority: High

[Xem chi tiết →]
```

### 📊 Status Changed

```
📊 Trạng thái thay đổi
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
📊 To Do → In Progress

[Xem chi tiết →]
```

### 💬 New Comment

```
💬 Comment mới
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
💬 @Bob Wilson commented:
"I found the root cause, will fix today"

[Xem chi tiết →]
```

## 🔧 Notification Logic

### When to Notify?

Notifications are sent when:

1. **Issue involves team member** (reporter OR assignee in user mapping)
2. **AND** one of these events occurs:
   - New issue created
   - Status changed
   - Assignee changed
   - New comment added (excluding self-comments)

### Filtering Rules

- ✅ **Team-based**: Only notify if reporter OR assignee is in `user-mapping.ts`
- ✅ **Self-comment filter**: Don't notify when user comments on their own issue
- ✅ **No priority filter**: All priorities (Low → Critical)
- ✅ **No issue type filter**: All types (Bug, Task, Story, Epic, etc.)

## 🧪 Testing with Mock Payloads

Sample payloads are provided in `test-payloads/`:

```bash
# Test issue created
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json

# Test status changed
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/status-changed.json

# Test assignee changed
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/assignee-changed.json

# Test comment added
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/comment-added.json
```

**Note**: Update the email addresses in test payloads to match your `user-mapping.ts` configuration.

## 🛠️ Troubleshooting

### Issue: Not receiving notifications

**Solutions:**
1. Check Jira webhook configuration (Settings → System → WebHooks)
2. Verify server is running: `curl http://your-server:3000/health`
3. Check server logs for errors
4. Test with mock payload to isolate the issue
5. Verify user emails in `user-mapping.ts` match Jira emails

### Issue: Users not being @mentioned

**Solutions:**
1. Verify Lark Open IDs in `user-mapping.ts`
2. Check that Jira email addresses match exactly
3. Test Lark integration: `curl http://your-server:3000/test`
4. Check Lark bot has permission to mention users

### Issue: Server crashes or errors

**Solutions:**
1. Check Node.js version: `node --version` (should be v18+)
2. Verify `.env` file exists and contains `WEBHOOK_URL`
3. Check port 3000 is available: `lsof -i :3000`
4. Review server logs: `pm2 logs jira-lark-webhook` (if using PM2)

### Issue: Jira webhook returns errors

**Solutions:**
1. Ensure server URL is publicly accessible
2. Check firewall settings allow incoming connections on port 3000
3. If testing locally, use ngrok: `ngrok http 3000`
4. Verify webhook endpoint: `POST /webhook/jira`

## 📁 Project Structure

```
jira-lark-webhook/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── config/
│   │   ├── config.ts               # Environment configuration
│   │   └── user-mapping.ts         # Jira → Lark user mapping
│   ├── types/
│   │   ├── jira.types.ts           # Jira webhook types
│   │   └── lark.types.ts           # Lark message types
│   ├── services/
│   │   ├── jira.service.ts         # Jira event parser
│   │   └── lark.service.ts         # Lark message formatter
│   ├── controllers/
│   │   └── webhook.controller.ts   # Route handlers
│   └── utils/
│       └── logger.ts               # Logging utility
├── test-payloads/                  # Sample Jira webhooks
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive webhook URLs
2. **Use HTTPS in production** - Encrypt data in transit
3. **Implement webhook signature verification** (future enhancement)
4. **Rate limiting** - Prevent abuse (future enhancement)
5. **Input validation** - Always validate Jira payloads
6. **Logging** - Monitor for suspicious activity

## 📚 Resources

- [Jira Webhooks Documentation](https://developer.atlassian.com/server/jira/platform/webhooks/)
- [Lark Bot Webhooks](https://open.larksuite.com/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)
- [Lark Message Card Format](https://open.larksuite.com/document/ukTMukTMukTM/uczM3QjL3MzN04yNzcDN)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🚀 Future Enhancements

- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] Database for audit logs
- [ ] Retry queue for failed Lark messages
- [ ] Web UI for configuration
- [ ] Multiple Lark groups support
- [ ] Custom message templates
- [ ] Jira project filtering
- [ ] Time-based notification rules

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-17
