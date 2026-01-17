# 🎯 SETUP CHECKLIST - Jira-Lark Webhook

## ✅ Đã hoàn thành

- [x] ✅ Setup project structure với TypeScript
- [x] ✅ Install tất cả dependencies
- [x] ✅ Implement Jira webhook parser với filtering logic
- [x] ✅ Implement Lark message formatter với rich cards
- [x] ✅ Tạo Express server với các endpoints
- [x] ✅ Viết documentation đầy đủ (README.md + README-VI.md)
- [x] ✅ Tạo test payloads và test script
- [x] ✅ Build và test thành công locally

---

## 📝 CẦN LÀM TIẾP THEO

### 1. Cấu hình User Mapping ⚠️ **QUAN TRỌNG**

Hiện tại file `src/config/user-mapping.ts` đang dùng example data. Bạn cần:

**Bước 1:** Lấy Lark Open IDs của tất cả team members

Có 3 cách:

**Cách 1 - Lark Admin Console (Dễ nhất):**
```
1. Vào https://your-company.larksuite.com/admin
2. Chọn Organization → Members
3. Click vào từng user
4. Copy "Open ID" (dạng: ou_xxxxxxxxxxxxx)
```

**Cách 2 - Dùng Lark API:**
```bash
# Nếu có bot token
curl -X GET \
  'https://open.larksuite.com/open-apis/contact/v3/users?emails=user@company.com' \
  -H 'Authorization: Bearer YOUR_BOT_TOKEN'
```

**Cách 3 - Test trong group:**
```
1. Gửi test message với @mention user
2. Check Lark API response để lấy user ID
```

**Bước 2:** Update file `src/config/user-mapping.ts`

```typescript
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {
  'john.doe@company.com': 'ou_xxxxxxxxx',      // ← Thay bằng real Open ID
  'jane.smith@company.com': 'ou_yyyyyyyyy',    // ← Thay bằng real Open ID
  'bob.wilson@company.com': 'ou_zzzzzzzzz',    // ← Thay bằng real Open ID
  // Thêm TẤT CẢ team members vào đây
};
```

**Lưu ý:** Email phải khớp CHÍNH XÁC với email trong Jira!

---

### 2. Deploy Server lên Production

Bạn đã có **public IP**, vậy cần:

**Option A - Chạy trực tiếp với Node.js:**

```bash
# Build production
npm run build

# Start server (sẽ chạy mãi mãi)
nohup npm start > server.log 2>&1 &

# Hoặc dùng screen/tmux
screen -S jira-webhook
npm start
# Ctrl+A, D để detach
```

**Option B - Dùng PM2 (Khuyến nghị):**

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start với PM2
pm2 start dist/index.js --name jira-lark-webhook

# Auto-restart khi server reboot
pm2 save
pm2 startup

# Xem logs
pm2 logs jira-lark-webhook

# Stop/restart
pm2 stop jira-lark-webhook
pm2 restart jira-lark-webhook
```

**Option C - Dùng Docker (Nâng cao):**

Tạo `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY .env .env
CMD ["npm", "start"]
```

```bash
docker build -t jira-lark-webhook .
docker run -d -p 3000:3000 --name jira-webhook jira-lark-webhook
```

**Firewall:**
```bash
# Mở port 3000
sudo ufw allow 3000/tcp
# hoặc
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

### 3. Cấu hình Jira Webhook

**Bước 1:** Vào Jira Settings
```
1. Đăng nhập Jira với quyền Admin
2. Settings (⚙️) → System → WebHooks
3. Click "Create a WebHook"
```

**Bước 2:** Điền thông tin

```yaml
Name: Lark Notifications
Status: Enabled

URL: http://YOUR_PUBLIC_IP:3000/webhook/jira
# VD: http://123.45.67.89:3000/webhook/jira

Events:
  ✅ Issue:
    ✅ created
    ✅ updated
  ✅ Comment:
    ✅ created

JQL Filter (Optional):
  project = YOUR_PROJECT
  # Hoặc để trống để nhận tất cả projects

Exclude body: ❌ (không check)
```

**Bước 3:** Test webhook

```
1. Click "Test" trong Jira webhook settings
2. Chọn một issue bất kỳ
3. Click "Test"
4. Kiểm tra:
   - Response: 200 OK
   - Lark group: Có nhận được message
   - Server logs: Có log "Received Jira webhook"
```

**Debug nếu test fail:**
```bash
# Kiểm tra server đang chạy
curl http://YOUR_PUBLIC_IP:3000/health

# Kiểm tra có firewall block không
telnet YOUR_PUBLIC_IP 3000

# Xem server logs
pm2 logs jira-lark-webhook
# hoặc
tail -f server.log
```

---

### 4. Test End-to-End

**Test 1: Tạo issue mới trong Jira**
```
1. Tạo issue mới trong Jira
2. Assign cho một user trong team mapping
3. Kiểm tra Lark group → Phải có thông báo "🎫 Ticket mới được tạo"
```

**Test 2: Thay đổi status**
```
1. Kéo issue từ To Do → In Progress
2. Kiểm tra Lark group → Phải có thông báo "📊 Trạng thái thay đổi"
```

**Test 3: Thay đổi assignee**
```
1. Reassign issue cho user khác
2. Kiểm tra Lark group → Phải có thông báo "👤 Assignee thay đổi"
```

**Test 4: Comment**
```
1. Thêm comment vào issue
2. Kiểm tra Lark group → Phải có thông báo "💬 Comment mới"
```

**Test 5: Self-comment filter**
```
1. Reporter tự comment vào issue của mình
2. Kiểm tra Lark group → KHÔNG có thông báo (đúng!)
```

---

### 5. Monitoring & Maintenance

**Xem logs:**
```bash
# PM2
pm2 logs jira-lark-webhook

# Hoặc nếu chạy trực tiếp
tail -f server.log
```

**Restart server:**
```bash
pm2 restart jira-lark-webhook
```

**Update code:**
```bash
# Pull code mới
git pull

# Rebuild
npm run build

# Restart
pm2 restart jira-lark-webhook
```

**Backup:**
```bash
# Backup .env và user-mapping.ts
cp .env .env.backup
cp src/config/user-mapping.ts src/config/user-mapping.ts.backup
```

---

## 🔧 Troubleshooting

### ❌ Không nhận được thông báo

**Checklist:**
- [ ] Server đang chạy: `curl http://YOUR_IP:3000/health`
- [ ] Jira webhook đã config đúng URL
- [ ] User email trong `user-mapping.ts` khớp với Jira
- [ ] Firewall không block port 3000
- [ ] Check server logs có error không

### ❌ Users không được @mention

**Checklist:**
- [ ] Lark Open IDs đúng format (ou_xxxxx)
- [ ] Email trong mapping khớp với Jira
- [ ] Bot có quyền mention users trong group

### ❌ Server crash

**Checklist:**
- [ ] Check logs: `pm2 logs jira-lark-webhook`
- [ ] Node.js version >= 18: `node --version`
- [ ] File `.env` tồn tại và có WEBHOOK_URL
- [ ] Port 3000 available: `lsof -i :3000`

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check logs:** `pm2 logs jira-lark-webhook`
2. **Test endpoints:**
   ```bash
   curl http://YOUR_IP:3000/health
   curl http://YOUR_IP:3000/test
   ```
3. **Test với mock payload:**
   ```bash
   ./test.sh
   ```

---

## 🎉 DONE!

Sau khi hoàn thành tất cả các bước trên, bạn sẽ có:

✅ Server chạy 24/7 trên public IP
✅ Jira tự động gửi webhooks đến server
✅ Server parse & filter events
✅ Lark group nhận thông báo real-time với @mentions
✅ Team members được notify đúng lúc, đúng người

**Enjoy your automated Jira-Lark notifications! 🚀**
