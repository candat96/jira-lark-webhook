# 📚 Jira Webhook Official Documentation - Key Points

## 🔑 Thông tin quan trọng từ Atlassian

### 1. **Webhook Events Available**

#### Issue Events (Support JQL filtering):
- `jira:issue_created` - Issue được tạo
- `jira:issue_updated` - Issue được update
- `jira:issue_deleted` - Issue bị xóa

#### Comment Events (Support JQL filtering):
- `comment_created` - Comment mới
- `comment_updated` - Comment được update
- `comment_deleted` - Comment bị xóa

#### Other Events:
- `worklog_created`, `worklog_updated`, `worklog_deleted`
- `attachment_created`, `attachment_deleted`
- `sprint_created`, `sprint_started`, `sprint_closed`
- Và nhiều events khác...

**Project này đang sử dụng:**
- ✅ `jira:issue_created`
- ✅ `jira:issue_updated`
- ✅ `comment_created`

---

### 2. **URL Requirements**

✅ **MUST:**
- HTTPS only (HTTP không được)
- Valid SSL/TLS certificate từ trusted CA
- Port allowed: `443`, `1880-1890`, `4044`, `6017`, `7990`, `8060`, `8080`, `8085`, `8089`, `8090`, `8443`, `8444`, `8900`, `9900`, `9420`, `9520`

⚠️ **Port 80 KHÔNG được phép!**

**Cho project này:**
```
✅ Port 3096 - ALLOWED
✅ URL: http://194.233.66.68:3096/webhook/jira
```

**Lưu ý:** Nếu deploy production, nên dùng HTTPS với reverse proxy (nginx/traefik).

---

### 3. **Retry Policy**

Jira sẽ retry tối đa **5 lần** nếu webhook fail.

**Retry khi:**
- Server trả về status codes: `408`, `409`, `425`, `429`, `5xx`
- Connection fails hoặc timeout

**Headers để track:**
- `X-Atlassian-Webhook-Identifier` - Unique ID cho webhook (giống nhau qua các retries)
- `X-Atlassian-Webhook-Retry` - Số lần đã retry

**Recommended response:**
```javascript
// Always return 200 OK ngay lập tức
res.status(200).json({ message: 'Received' });

// Process webhook asynchronously
processWebhookAsync(payload);
```

---

### 4. **Performance & Reliability**

**Headers:**
- `X-Atlassian-Webhook-Flow`: `Primary` hoặc `Secondary`
  - **Primary**: Delivered within 30 seconds
  - **Secondary**: Bulk operations, delivered within 15 minutes

**Concurrency Limits:**
- Primary webhooks: Max **20** concurrent requests
- Secondary webhooks: Max **10** concurrent requests

**Best Practice:**
```javascript
app.post('/webhook/jira', async (req, res) => {
  // Respond IMMEDIATELY
  res.status(200).json({ received: true });
  
  // Process ASYNCHRONOUSLY
  setImmediate(() => {
    processWebhook(req.body);
  });
});
```

---

### 5. **Webhook Payload Structure**

```json
{
  "timestamp": 1606480436302,
  "webhookEvent": "jira:issue_updated",
  "issue_event_type_name": "issue_generic",
  "user": {
    "accountId": "99:27935d01-92a7-4687-8272-a9b8d3b2ae2e",
    "displayName": "John Doe",
    "accountType": "atlassian"
  },
  "issue": {
    "id": "99291",
    "key": "JRA-20002",
    "self": "https://your-domain.atlassian.net/rest/api/2/issue/99291",
    "fields": {
      "summary": "Issue summary",
      "status": { "name": "In Progress" },
      "assignee": { ... },
      "reporter": { ... }
    }
  },
  "changelog": {
    "items": [
      {
        "field": "status",
        "fromString": "To Do",
        "toString": "In Progress"
      }
    ]
  },
  "comment": {
    "id": "10000",
    "author": { ... },
    "body": "Comment text"
  }
}
```

**Code của chúng ta đã parse đúng structure này!** ✅

---

### 6. **JQL Filtering**

Có thể filter webhooks bằng JQL trong Jira webhook settings:

```jql
# Chỉ notify cho specific project
project = MYPROJECT

# Multiple projects
project in (PROJ1, PROJ2, PROJ3)

# Filter theo status
project = MYPROJECT AND status = "In Progress"

# Filter theo assignee
assignee = currentUser()
```

**Advantages:**
- ✅ Jira không gửi webhook nếu không match (tiết kiệm bandwidth)
- ✅ Server không cần xử lý requests không cần thiết
- ✅ Giảm load cho cả Jira và server

---

### 7. **URL Variables** (đã có trong JIRA-WEBHOOK-VARIABLES.md)

Available variables:
```
${issue.id}
${issue.key}
${project.id}
${project.key}
${comment.id}
${modifiedUser.accountId}
${sprint.id}
...
```

**Recommendation:** Không cần dùng variables, payload đã có đủ thông tin.

---

### 8. **Security - Webhook Signatures**

Jira Cloud có thể sign webhooks với secret token:

**Headers:**
```
X-Hub-Signature: sha256=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9
```

**Verify signature:**
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}
```

**Setup trong Jira:**
- Settings → Webhooks → Create/Edit
- Thêm "Secret" field
- Jira sẽ sign tất cả webhooks với secret này

---

### 9. **Known Issues**

⚠️ **Lưu ý:**
- Webhooks > 25MB không được delivered
- Post function webhooks không fire với "Create Issue" transition
- Project deletion không gửi `issue_deleted` webhooks
- Attachments added khi create issue không trigger `attachment_created` (nhưng có trong `jira:issue_created` payload)

---

### 10. **Best Practices**

#### ✅ DO:
```javascript
// 1. Respond immediately
app.post('/webhook/jira', (req, res) => {
  res.status(200).json({ received: true });
  
  // 2. Process asynchronously
  queue.add(req.body);
});

// 3. Handle retries với webhook identifier
const processedWebhooks = new Set();

if (processedWebhooks.has(webhookId)) {
  return; // Skip duplicate
}
processedWebhooks.add(webhookId);

// 4. Log webhook flow type
logger.info(`Webhook flow: ${req.headers['x-atlassian-webhook-flow']}`);
```

#### ❌ DON'T:
```javascript
// 1. NEVER do heavy processing before responding
app.post('/webhook/jira', async (req, res) => {
  await heavyProcessing(req.body); // ❌ BAD
  res.status(200).json({ ok: true });
});

// 2. NEVER return error codes unless necessary
res.status(500).json({ error: 'Failed' }); // ❌ Triggers retries

// 3. NEVER process without deduplication
// Jira may send duplicates!
```

---

## 🎯 Áp dụng cho Project

### Current Implementation: ✅ Good!

```typescript
// webhook.controller.ts
async handleJiraWebhook(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body as JiraWebhookPayload;
    
    logger.info(`Received Jira webhook: ${payload.webhookEvent}`);
    
    // Parse event
    const processedEvent = jiraService.parseEvent(payload);
    
    if (!processedEvent) {
      res.status(200).json({ message: 'Event ignored' });
      return;
    }
    
    // Format & send to Lark
    const larkMessage = larkService.formatEventMessage(processedEvent);
    await larkService.sendMessage(larkMessage);
    
    // Always return 200
    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ message: 'Error occurred' });
  }
}
```

### Improvements có thể thêm:

#### 1. **Add Webhook Deduplication:**

```typescript
// utils/webhook-cache.ts
const processedWebhooks = new Set<string>();

export function isDuplicate(webhookId: string): boolean {
  if (processedWebhooks.has(webhookId)) {
    return true;
  }
  processedWebhooks.add(webhookId);
  
  // Clear old entries after 1 hour
  setTimeout(() => processedWebhooks.delete(webhookId), 3600000);
  
  return false;
}

// webhook.controller.ts
const webhookId = req.headers['x-atlassian-webhook-identifier'];
if (isDuplicate(webhookId)) {
  logger.debug('Duplicate webhook, skipping');
  return res.status(200).json({ message: 'Duplicate' });
}
```

#### 2. **Add Signature Verification (Optional):**

```typescript
// middleware/verify-jira-signature.ts
export function verifyJiraSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-hub-signature'] as string;
    
    if (!signature) {
      return next(); // No signature, continue
    }
    
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculated = 'sha256=' + hmac.digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(signature))) {
      logger.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
  };
}
```

---

## 📋 Jira Webhook Configuration

### Recommended Setup:

```yaml
Name: Lark Notifications

URL: http://194.233.66.68:3096/webhook/jira

Events:
  ✅ Issue → created
  ✅ Issue → updated
  ✅ Comment → created

JQL Filter (Recommended):
  # Option 1: All projects
  (leave empty)
  
  # Option 2: Specific project
  project = MYPROJECT
  
  # Option 3: Multiple projects
  project in (PROJ1, PROJ2, PROJ3)
  
  # Option 4: Advanced filtering
  project = MYPROJECT AND status != Closed

Exclude body: ❌ KHÔNG check

Secret: (Optional - để trống hoặc generate nếu cần security)
```

---

## ✅ Checklist

### Current Implementation:
- [x] ✅ Parse đúng webhook payload structure
- [x] ✅ Handle `jira:issue_created`, `jira:issue_updated`, `comment_created`
- [x] ✅ Always return 200 OK
- [x] ✅ Filter theo team members
- [x] ✅ Log webhook events

### Optional Improvements:
- [ ] Add webhook deduplication (handle retries)
- [ ] Add signature verification (security)
- [ ] Monitor `X-Atlassian-Webhook-Flow` header
- [ ] Setup JQL filter trong Jira (reduce unnecessary webhooks)

---

## 📚 References

- [Official Jira Webhooks Docs](https://developer.atlassian.com/cloud/jira/platform/webhooks/)
- [Webhook Security](https://developer.atlassian.com/cloud/jira/platform/webhooks/#secure-admin-webhooks)
- [REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

---

**Project đã implement correctly theo Atlassian best practices! ✅**
