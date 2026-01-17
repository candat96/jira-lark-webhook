# 📋 JIRA-LARK WEBHOOK - KẾ HOẠCH TRIỂN KHAI

## 🎯 MỤC TIÊU Dự ÁN

Xây dựng webhook server để tự động gửi thông báo vào Lark group khi có các sự kiện Jira liên quan đến team:

### Các sự kiện cần notify:
- ✅ Ticket mới được tạo (reporter hoặc assignee trong team)
- ✅ Task thay đổi trạng thái (status changed)
- ✅ Task thay đổi assignee
- ✅ Comment mới được thêm (trừ self-comment)

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────┐         ┌──────────────────┐         ┌──────────┐
│  Jira   │ webhook │  Express Server  │  POST   │   Lark   │
│ System  │────────>│   Node.js/TS     │────────>│  Group   │
└─────────┘         └──────────────────┘         └──────────┘
                            │
                            ├─ Parse Jira payload
                            ├─ Filter theo team
                            ├─ Map Jira → Lark users
                            └─ Format rich card message
```

---

## 💻 TECH STACK

### Dependencies:
- **express**: HTTP server framework
- **dotenv**: Environment variables
- **axios**: HTTP client cho Lark API
- **typescript**: Type safety
- **ts-node**: Development runtime
- **nodemon**: Auto-reload during dev

### Runtime:
- Node.js v22.14.0
- TypeScript 5.3+

---

## 📁 CẤU TRÚC PROJECT

```
jira-lark-webhook/
├── src/
│   ├── index.ts                      # Express server entry point
│   ├── config/
│   │   ├── config.ts                 # Load environment variables
│   │   └── user-mapping.ts           # Jira email → Lark Open ID mapping
│   ├── types/
│   │   ├── jira.types.ts             # Jira webhook payload types
│   │   └── lark.types.ts             # Lark message card types
│   ├── services/
│   │   ├── jira.service.ts           # Parse & filter Jira events
│   │   └── lark.service.ts           # Format & send Lark messages
│   ├── controllers/
│   │   └── webhook.controller.ts     # Express route handlers
│   └── utils/
│       └── logger.ts                 # Simple logging utility
├── test-payloads/                    # Sample Jira payloads for testing
│   ├── issue-created.json
│   ├── status-changed.json
│   ├── assignee-changed.json
│   └── comment-added.json
├── .env                              # Environment config (already exists)
├── .env.example                      # Template for .env
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md                         # English documentation
├── README-VI.md                      # Vietnamese documentation
└── PLAN.md                           # This file
```

---

## 🔧 BUSINESS LOGIC

### 1. Notification Rules

#### Điều kiện để gửi thông báo:
```typescript
if (issue.reporter IN team_mapping OR issue.assignee IN team_mapping) {
  // Process event
  switch (event_type) {
    case 'issue_created':
      notify("🎫 Ticket mới được tạo")
      break
    case 'issue_updated':
      if (changelog.status_changed) {
        notify("📊 Trạng thái thay đổi")
      }
      if (changelog.assignee_changed) {
        notify("👤 Assignee thay đổi")
      }
      if (comment_added AND commenter !== reporter) {
        notify("💬 Comment mới")
      }
      break
  }
}
```

#### Filtering Logic:
- ✅ **Reporter-based**: Nếu reporter trong team mapping → notify tất cả updates
- ✅ **Assignee-based**: Nếu assignee trong team mapping → notify tất cả updates
- ✅ **Comment filtering**: Không notify khi tự comment vào issue của mình
- ✅ **No priority filter**: Notify tất cả priorities (Low → Critical)
- ✅ **No issue type filter**: Notify tất cả types (Bug, Task, Story, Epic, etc.)

### 2. User Mapping Strategy

```typescript
// config/user-mapping.ts
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {
  // Format: 'jira-email@company.com': 'lark-open-id'
  // Example:
  'john.doe@company.com': 'ou_a1b2c3d4e5f6g7h8',
  'jane.smith@company.com': 'ou_x1y2z3a4b5c6d7e8',
  // TODO: Add all team members here
};
```

**Cách lấy Lark Open ID:**
1. Vào Lark Admin Console → Organization → Members
2. Click vào user → Copy "Open ID"
3. Hoặc dùng Lark API: `/open-apis/contact/v3/users`

---

## 📊 JIRA WEBHOOK INTEGRATION

### Jira Event Types:

| Event Type | Webhook Event | Trigger Condition |
|-----------|--------------|-------------------|
| New Issue | `jira:issue_created` | Issue created with team member |
| Status Changed | `jira:issue_updated` | `changelog.items[].field === 'status'` |
| Assignee Changed | `jira:issue_updated` | `changelog.items[].field === 'assignee'` |
| Comment Added | `jira:issue_updated` | `webhookEvent` includes comment |

### Jira Payload Structure:

```typescript
interface JiraWebhookPayload {
  webhookEvent: string;  // 'jira:issue_created', 'jira:issue_updated'
  issue: {
    key: string;         // 'PROJ-123'
    fields: {
      summary: string;
      status: { name: string };
      assignee: { emailAddress: string; displayName: string } | null;
      reporter: { emailAddress: string; displayName: string };
      priority: { name: string };
      issuetype: { name: string };
    };
    self: string;        // URL to issue
  };
  changelog?: {
    items: Array<{
      field: string;     // 'assignee', 'status'
      fromString: string;
      toString: string;
    }>;
  };
  comment?: {
    author: { emailAddress: string; displayName: string };
    body: string;
  };
}
```

---

## 💬 LARK MESSAGE FORMAT

### Message Types:

#### 1. New Issue Created
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

#### 2. Status Changed
```
📊 Trạng thái thay đổi
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
📊 To Do → In Progress

[Xem chi tiết →]
```

#### 3. Assignee Changed
```
👤 Assignee thay đổi
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 @OldUser → @NewUser
📊 Status: In Progress

[Xem chi tiết →]
```

#### 4. Comment Added
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

### Lark Mention Format:

```markdown
<at user_id="ou_xxx">@DisplayName</at>
```

### Color Coding:

- 🟦 **Blue**: New issue created
- 🟩 **Green**: Status → Done/Resolved
- 🟨 **Yellow**: Assignee changed
- 🟪 **Purple**: Comment added
- 🟧 **Orange**: Status changed (other)

---

## 🔌 API ENDPOINTS

### 1. POST /webhook/jira
- **Purpose**: Receive Jira webhook events
- **Request**: JSON payload from Jira
- **Response**: 200 OK (always, even on error)
- **Logic**:
  1. Validate payload structure
  2. Check if team member involved
  3. Parse event type & changelog
  4. Format Lark message
  5. Send to Lark webhook URL
  6. Log result

### 2. GET /health
- **Purpose**: Health check endpoint
- **Response**: `{ "status": "ok", "timestamp": "..." }`

### 3. GET /test
- **Purpose**: Send test message to Lark
- **Response**: `{ "success": true }`
- **Usage**: Test Lark integration

---

## ⚙️ ENVIRONMENT VARIABLES

```bash
# .env file
PORT=3000
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/05d00015-413d-444b-8d0d-ef7d509538e5
SERVER_URL=http://your-public-ip:3000
NODE_ENV=development
```

---

## 🧪 TESTING STRATEGY

### Local Testing:

```bash
# 1. Start dev server
npm run dev

# 2. Health check
curl http://localhost:3000/health

# 3. Test Lark integration
curl http://localhost:3000/test

# 4. Send mock Jira payload
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json

# 5. Check Lark group for message
```

### Test Payloads:

Create sample JSON files in `test-payloads/`:
- `issue-created.json` - New issue event
- `status-changed.json` - Status update event
- `assignee-changed.json` - Assignee change event
- `comment-added.json` - New comment event

---

## 🚀 DEPLOYMENT

### Jira Webhook Configuration:

1. Go to Jira: **Settings → System → WebHooks**
2. Click **Create a WebHook**
3. Configure:
   - **Name**: Lark Notifications
   - **URL**: `http://your-public-ip:3000/webhook/jira`
   - **Events**: 
     - ✅ Issue → created
     - ✅ Issue → updated
     - ✅ Comment → created
4. Save and test

### Server Deployment:

```bash
# Build for production
npm run build

# Run with PM2 (recommended)
pm2 start dist/index.js --name jira-lark-webhook
pm2 save
pm2 startup

# Or run directly
npm start
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Setup ✅
- [ ] Install dependencies
- [ ] Configure TypeScript
- [ ] Setup folder structure
- [ ] Create .gitignore

### Phase 2: Core Types ✅
- [ ] Define Jira webhook types
- [ ] Define Lark message types
- [ ] Create config interfaces

### Phase 3: Services ✅
- [ ] Implement config loader
- [ ] Implement Jira service (parser & filter)
- [ ] Implement Lark service (formatter & sender)
- [ ] Add logger utility

### Phase 4: Server ✅
- [ ] Create webhook controller
- [ ] Setup Express app
- [ ] Add error handling middleware
- [ ] Implement routes (webhook, health, test)

### Phase 5: Testing ✅
- [ ] Create test payloads
- [ ] Test local server
- [ ] Test Lark integration
- [ ] Verify message formatting

### Phase 6: Documentation ✅
- [ ] Write README.md (English)
- [ ] Write README-VI.md (Vietnamese)
- [ ] Add inline code comments
- [ ] Create .env.example

### Phase 7: Deployment ✅
- [ ] Build production bundle
- [ ] Configure Jira webhook
- [ ] Deploy to server
- [ ] Monitor logs

---

## 🔒 SECURITY CONSIDERATIONS

### Current Implementation:
- ✅ Environment variables for secrets
- ✅ No sensitive data logging
- ✅ Always return 200 to Jira (prevent retry storms)

### Future Enhancements:
- [ ] Webhook signature verification (Jira signs payloads)
- [ ] Rate limiting
- [ ] Request validation middleware
- [ ] HTTPS enforcement

---

## 📈 FUTURE IMPROVEMENTS

### v1.1 (Optional):
- [ ] Database for audit logs
- [ ] Retry queue for failed Lark messages
- [ ] Web UI for configuration
- [ ] Multiple Lark groups support
- [ ] Custom message templates
- [ ] Jira project filtering
- [ ] Time-based notification rules (working hours only)

### v2.0 (Advanced):
- [ ] Two-way integration (Lark → Jira)
- [ ] Lark bot commands (query issues, update status)
- [ ] Analytics dashboard
- [ ] Multi-tenant support

---

## 🎯 SUCCESS CRITERIA

✅ **Must Have:**
- Server nhận được Jira webhooks
- Filter đúng issues của team
- Tag đúng users trong Lark
- Messages format đẹp, dễ đọc
- Không miss notifications quan trọng

✅ **Nice to Have:**
- Logs chi tiết để debug
- Test payloads đầy đủ
- Documentation rõ ràng
- Easy to deploy & maintain

---

## 📞 SUPPORT & MAINTENANCE

### Troubleshooting:

**Problem**: Không nhận được notifications
- Check Jira webhook configuration
- Verify server is running (`GET /health`)
- Check server logs
- Test with mock payload

**Problem**: Users không được tag
- Verify Lark Open IDs in user-mapping.ts
- Check Jira email addresses match
- Test with `/test` endpoint

**Problem**: Server crashes
- Check Node.js version (v18+)
- Verify .env file exists
- Check port 3000 is available
- Review error logs

### Logs Location:
```bash
# Development
console output

# Production (PM2)
pm2 logs jira-lark-webhook
```

---

## 📚 REFERENCES

- [Jira Webhooks Documentation](https://developer.atlassian.com/server/jira/platform/webhooks/)
- [Lark Bot Webhooks](https://open.larksuite.com/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)
- [Lark Message Card Format](https://open.larksuite.com/document/ukTMukTMukTM/uczM3QjL3MzN04yNzcDN)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-17  
**Author**: AI Assistant  
**Status**: Ready for Implementation ✅
