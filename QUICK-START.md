# 🚀 QUICK START - 5 phút setup

## ✅ Đã có sẵn

Bạn đã có:
- ✅ Code hoàn chỉnh và tested
- ✅ Lark Webhook URL trong `.env`
- ✅ Build thành công

## 📝 Chỉ cần 3 bước

### Bước 1: Thêm team emails (1 phút)

```bash
vim src/config/user-mapping.ts
```

Thay đổi:
```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // TODO: Thêm email Jira của team members tại đây
  // Example (for testing):
  'john.doe@company.com': true,        // ← Xóa dòng này
  'jane.smith@company.com': true,      // ← Xóa dòng này
  'bob.wilson@company.com': true,      // ← Xóa dòng này
};
```

Thành:
```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // Thêm email THẬT của team members
  'your.real.email@company.com': true,
  'teammate1@company.com': true,
  'teammate2@company.com': true,
  'external.partner@client.com': true,  // External cũng OK
  // ... thêm tất cả team members
};
```

**Lưu ý:** Email phải CHÍNH XÁC trùng với email trong Jira!

---

### Bước 2: Deploy (2 phút)

```bash
# Build
npm run build

# Start với PM2 (recommended)
pm2 start dist/index.js --name jira-lark-webhook
pm2 save
pm2 startup  # Auto-start khi server reboot

# Hoặc chạy trực tiếp
npm start

# Hoặc background
nohup npm start > server.log 2>&1 &
```

**Verify server running:**
```bash
curl http://localhost:3000/health
# → {"status":"ok",...}

curl http://localhost:3000/test
# → Test message trong Lark group
```

---

### Bước 3: Configure Jira Webhook (2 phút)

#### 3.1. Vào Jira Settings

```
1. Đăng nhập Jira (cần admin quyền)
2. Click Settings (⚙️) → System
3. Sidebar: WebHooks
4. Click "Create a WebHook"
```

#### 3.2. Điền form

```yaml
Name: Lark Notifications

Status: ✅ Enabled

URL: http://YOUR_PUBLIC_IP:3000/webhook/jira
# VD: http://123.45.67.89:3000/webhook/jira

Description: Send Jira events to Lark group

Events to send:
  Issue:
    ✅ created
    ✅ updated
    ❌ deleted (không cần)
  
  Comment:
    ✅ created
    ❌ updated (không cần)
    ❌ deleted (không cần)

JQL Filter (Optional):
  # Để trống để nhận TẤT CẢ issues
  # Hoặc filter theo project:
  project = YOUR_PROJECT_KEY

Exclude body: ❌ (KHÔNG check)
```

#### 3.3. Save & Test

```
1. Click "Create"
2. Click "Test" button
3. Select một issue bất kỳ
4. Click "Test"
5. Check response: "200 OK"
6. Check Lark group: Có message mới
```

---

## ✅ Done! Kiểm tra

### Test 1: Tạo issue mới

```
1. Vào Jira
2. Create issue mới
3. Assign cho một người trong team (có trong JIRA_TEAM_EMAILS)
4. Save
5. → Check Lark group: "🎫 Ticket mới được tạo"
```

### Test 2: Thay đổi status

```
1. Kéo issue từ To Do → In Progress
2. → Check Lark group: "📊 Trạng thái thay đổi"
```

### Test 3: Comment

```
1. Add comment vào issue
2. → Check Lark group: "💬 Comment mới"
```

### Test 4: Reassign

```
1. Change assignee
2. → Check Lark group: "👤 Assignee thay đổi"
```

---

## 🎯 Message format

Messages sẽ hiển thị như này:

```
🎫 Ticket mới được tạo
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: **John Doe**
👤 Assignee: **Jane Smith**
📊 Status: To Do
🔖 Type: Bug
⚡ Priority: High

[Xem chi tiết →]
```

**Lưu ý:**
- Tên người hiển thị dạng **bold text** (không @mention)
- Không ping/notify users
- Chỉ hiển thị thông tin trong group

---

## 🛠️ Troubleshooting

### ❌ Không nhận được notification

**Check:**
```bash
# 1. Server có chạy không?
curl http://YOUR_IP:3000/health

# 2. Jira webhook đã config đúng URL chưa?
# 3. Team emails trong user-mapping.ts có đúng không?
# 4. Check server logs
pm2 logs jira-lark-webhook
# hoặc
tail -f server.log
```

### ❌ Event ignored

**Nguyên nhân:** Issue không liên quan team members

**Fix:**
```typescript
// Kiểm tra reporter hoặc assignee có trong list này không
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'reporter.email@company.com': true,  // ← Phải có
  'assignee.email@company.com': true,  // ← Phải có
};
```

### ❌ Firewall block

```bash
# Mở port 3000
sudo ufw allow 3000/tcp

# Hoặc
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## 📋 Checklist

- [ ] Update `src/config/user-mapping.ts` với real emails
- [ ] Build: `npm run build`
- [ ] Start server: `pm2 start dist/index.js --name jira-lark-webhook`
- [ ] Verify: `curl localhost:3000/health`
- [ ] Configure Jira webhook với correct URL
- [ ] Test Jira webhook (click Test button)
- [ ] Create real issue và check Lark
- [ ] Thay đổi status và check Lark
- [ ] Add comment và check Lark

---

## 🔧 Useful Commands

```bash
# Check server status
pm2 status

# View logs
pm2 logs jira-lark-webhook

# Restart server
pm2 restart jira-lark-webhook

# Stop server
pm2 stop jira-lark-webhook

# Remove from PM2
pm2 delete jira-lark-webhook

# Manual test
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json
```

---

## 🎉 All Done!

Setup hoàn tất trong **5 phút**!

Giờ mỗi khi có Jira event, team sẽ tự động nhận notification trong Lark group 🚀

**Questions?**
- Check `SIMPLIFIED-SETUP.md`
- Check `README-VI.md`
- Check `TROUBLESHOOTING.md` (nếu có lỗi)

**Enjoy! 🎊**
