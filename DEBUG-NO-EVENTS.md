# 🔍 DEBUG: Không nhận được Jira Webhook Events

## ❌ Vấn đề: Webhook không fire

Checklist debug từng bước:

---

## 1️⃣ **Kiểm tra Server đang chạy**

### Trên VPS:

```bash
# Check container running
docker-compose ps

# Expected output:
# NAME                    STATUS
# jira-lark-webhook       Up X minutes

# Nếu không chạy:
docker-compose up -d
```

### Check logs:

```bash
# Xem logs real-time
docker-compose logs -f

# Hoặc last 100 lines
docker-compose logs --tail=100
```

### Test health endpoint:

```bash
# Từ VPS
curl http://localhost:3096/health

# Từ external
curl http://194.233.66.68:3096/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"jira-lark-webhook"}
```

---

## 2️⃣ **Kiểm tra Firewall**

### Check port 3096 có mở không:

```bash
# Check firewall status
sudo ufw status

# Nếu port 3096 chưa mở:
sudo ufw allow 3096/tcp
sudo ufw reload

# Verify
sudo ufw status | grep 3096
```

### Test từ external:

```bash
# Từ máy local (không phải VPS)
curl http://194.233.66.68:3096/health

# Nếu timeout = firewall block
# Nếu connection refused = server không chạy
# Nếu OK = server working
```

---

## 3️⃣ **Kiểm tra Jira Webhook Configuration**

### Vào Jira:

```
https://jira.datcv.io.vn
→ Settings (⚙️)
→ System
→ WebHooks
```

### Check webhook settings:

#### URL phải CHÍNH XÁC:
```
✅ ĐÚNG: http://194.233.66.68:3096/webhook/jira
❌ SAI: http://194.233.66.68:3000/webhook/jira (wrong port)
❌ SAI: http://localhost:3096/webhook/jira (localhost)
❌ SAI: https://194.233.66.68:3096/webhook/jira (https - chưa setup)
```

#### Events phải được chọn:
```
✅ Issue → created
✅ Issue → updated  
✅ Comment → created
```

#### Status:
```
✅ Enabled (phải được bật)
❌ Disabled
```

### Test webhook từ Jira:

```
1. Vào webhook settings
2. Click "Test" button
3. Select một issue bất kỳ
4. Click "Test"
5. Check response
```

**Expected:**
- Status: 200 OK
- Response time: < 5 seconds

**Nếu fail:**
- Check URL
- Check server logs
- Check firewall

---

## 4️⃣ **Kiểm tra User Mapping**

### File: `src/config/user-mapping.ts`

```bash
# Xem current mapping
cat src/config/user-mapping.ts
```

**Expected:**
```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'real.email@company.com': true,
  // NOT empty!
};
```

**Nếu EMPTY:**
```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // Empty = NO notifications!
};
```

→ Webhook sẽ nhận được nhưng bị filter out vì không có team member nào!

### Fix:

```bash
# Edit file
vim src/config/user-mapping.ts

# Add real emails từ Jira
export const JIRA_TEAM_EMAILS: Record<string, string> = {
  'your.email@company.com': true,
  'teammate@company.com': true,
};

# Rebuild
npm run build
docker-compose build
docker-compose up -d --force-recreate
```

---

## 5️⃣ **Test Manual với Mock Payload**

### Từ VPS hoặc local:

```bash
# Test với mock payload
curl -X POST http://194.233.66.68:3096/webhook/jira \
  -H "Content-Type: application/json" \
  -d '{
    "webhookEvent": "jira:issue_created",
    "issue": {
      "key": "TEST-123",
      "self": "https://jira.datcv.io.vn/rest/api/2/issue/123",
      "fields": {
        "summary": "Test issue",
        "status": {"name": "To Do"},
        "reporter": {
          "emailAddress": "your.email@company.com",
          "displayName": "Your Name"
        },
        "assignee": {
          "emailAddress": "teammate@company.com",
          "displayName": "Teammate"
        },
        "priority": {"name": "High"},
        "issuetype": {"name": "Bug"}
      }
    }
  }'
```

**Expected response:**
```json
{"message": "Notification sent"}
```

**Nếu response:**
```json
{"message": "Event ignored"}
```
→ Email trong payload KHÔNG match với user-mapping.ts!

### Check logs sau khi test:

```bash
docker-compose logs --tail=50 | grep -E "(Received|sent|ignored)"
```

---

## 6️⃣ **Check Server Logs**

### View logs real-time:

```bash
docker-compose logs -f jira-lark-webhook
```

### Khi Jira gửi webhook, phải thấy:

```
[2026-01-17 ...] INFO: POST /webhook/jira
[2026-01-17 ...] INFO: Received Jira webhook: jira:issue_created for issue PROJ-123
[2026-01-17 ...] INFO: Issue created: PROJ-123
[2026-01-17 ...] INFO: Lark message sent successfully
[2026-01-17 ...] INFO: ✅ Đã gửi thông báo Lark cho issue PROJ-123
```

### Nếu thấy:

```
[2026-01-17 ...] INFO: Received Jira webhook: jira:issue_created for issue PROJ-123
[2026-01-17 ...] DEBUG: Issue PROJ-123 không liên quan đến team, bỏ qua
```
→ **Email không match user-mapping.ts!**

### Nếu KHÔNG thấy gì:
→ Webhook không đến server = check network/firewall/Jira config

---

## 7️⃣ **Common Issues & Solutions**

### Issue 1: "Event ignored"

**Nguyên nhân:** Email trong Jira issue không match user-mapping.ts

**Fix:**
```bash
# 1. Check email trong Jira issue
# Vào Jira → Click issue → Xem reporter/assignee email

# 2. Update user-mapping.ts
vim src/config/user-mapping.ts

# 3. Add exact email
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'exact.email@from.jira.com': true,  // ← Phải CHÍNH XÁC
};

# 4. Rebuild
docker-compose build && docker-compose up -d --force-recreate
```

### Issue 2: "Connection timeout"

**Nguyên nhân:** Firewall block hoặc server không accessible

**Fix:**
```bash
# Check firewall
sudo ufw allow 3096/tcp

# Check server từ external
curl -v http://194.233.66.68:3096/health
```

### Issue 3: "404 Not Found"

**Nguyên nhân:** URL sai

**Fix:**
```
Jira webhook URL phải là:
http://194.233.66.68:3096/webhook/jira
                           ^^^^^^^^^^^^^^^^
                           Endpoint chính xác
```

### Issue 4: Webhook đến nhưng không gửi Lark

**Nguyên nhân:** Lark webhook URL sai hoặc expired

**Fix:**
```bash
# Test Lark integration
curl http://194.233.66.68:3096/test

# Check logs
docker-compose logs | grep "Lark"

# Nếu error "Invalid webhook URL" → Update .env
vim .env
# WEBHOOK_URL=... (update với URL mới)

# Restart
docker-compose restart
```

---

## 8️⃣ **Debug Commands**

### Quick debug script:

```bash
#!/bin/bash
echo "=== Jira Webhook Debug ==="

echo "1. Container status:"
docker-compose ps

echo ""
echo "2. Health check:"
curl -s http://localhost:3096/health | jq .

echo ""
echo "3. Recent logs:"
docker-compose logs --tail=20

echo ""
echo "4. User mapping:"
cat src/config/user-mapping.ts | grep -A10 "JIRA_TEAM_EMAILS"

echo ""
echo "5. Environment:"
docker-compose exec jira-lark-webhook env | grep -E "(WEBHOOK_URL|JIRA_URL|PORT)"

echo ""
echo "=== Debug complete ==="
```

---

## 9️⃣ **Step-by-Step Resolution**

### Bước 1: Verify server running

```bash
curl http://194.233.66.68:3096/health
# → Phải return {"status":"ok"}
```

### Bước 2: Test Lark integration

```bash
curl http://194.233.66.68:3096/test
# → Check Lark group nhận message
```

### Bước 3: Test webhook endpoint với mock data

```bash
curl -X POST http://194.233.66.68:3096/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json

# → Check response và logs
```

### Bước 4: Update user-mapping.ts

```bash
vim src/config/user-mapping.ts
# Add REAL emails từ Jira

docker-compose build
docker-compose up -d --force-recreate
```

### Bước 5: Configure Jira webhook

```
URL: http://194.233.66.68:3096/webhook/jira
Events: Issue created, updated, Comment created
Test: Click Test button
```

### Bước 6: Create test issue trong Jira

```
1. Create new issue
2. Assign to someone trong user-mapping
3. Check Lark group
```

---

## 🎯 **Most Common Cause**

**90% cases:** Email trong `user-mapping.ts` KHÔNG MATCH với email trong Jira!

**Quick fix:**
1. Vào Jira issue
2. Xem email của Reporter/Assignee
3. Add CHÍNH XÁC email đó vào `user-mapping.ts`
4. Rebuild Docker

---

## 📞 **Need Help?**

Gửi cho tôi:

```bash
# 1. Health check
curl http://194.233.66.68:3096/health

# 2. Server logs
docker-compose logs --tail=50

# 3. User mapping
cat src/config/user-mapping.ts

# 4. Jira webhook config screenshot
# (URL, Events, Status)

# 5. Test issue details
# (Reporter email, Assignee email)
```

---

**Bắt đầu debug từ bước 1 và làm tuần tự! 🔍**
