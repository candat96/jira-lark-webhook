# ✅ READY TO DEPLOY - Final Setup

## 📝 Configuration đã hoàn tất

Bạn đã có:
- ✅ Docker Compose files
- ✅ Environment variables trong .env
- ✅ JIRA_URL: https://jira.datcv.io.vn
- ✅ Code đã build thành công

---

## 🚀 Deploy ngay - 3 bước

### Bước 1: Update team emails (1 phút)

```bash
vim src/config/user-mapping.ts
```

Thay đổi:
```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // Xóa example emails, thêm REAL emails từ Jira:
  'your.email@company.com': true,
  'teammate1@company.com': true,
  'teammate2@company.com': true,
  // ... tất cả team members
};
```

**Quan trọng:** Email phải CHÍNH XÁC trùng với email trong Jira!

---

### Bước 2: Update SERVER_URL trong .env (30 giây)

```bash
vim .env
```

Thay đổi:
```env
SERVER_URL=http://YOUR_PUBLIC_IP:3000
# VD: SERVER_URL=http://123.45.67.89:3000
```

---

### Bước 3: Deploy với Docker (2 phút)

```bash
# Build TypeScript
npm run build

# Build Docker image
docker-compose build

# Start container
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## ✅ Verify Deployment

### 1. Check container status

```bash
docker-compose ps
# → Should show "Up" status
```

### 2. Health check

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"...","service":"jira-lark-webhook"}
```

### 3. Test Lark integration

```bash
curl http://localhost:3000/test
# → Check Lark group for test message
```

### 4. View logs

```bash
docker-compose logs -f jira-lark-webhook
```

Expected output:
```
[2026-01-17 ...] INFO: 🚀 Jira-Lark Webhook Server Started
[2026-01-17 ...] INFO: 📡 Server running on port 3000
[2026-01-17 ...] INFO: 🔗 Webhook URL: http://localhost:3000/webhook/jira
```

---

## ⚙️ Configure Jira Webhook

### Bước 1: Vào Jira Settings

```
https://jira.datcv.io.vn
→ Settings (⚙️) 
→ System 
→ WebHooks
```

### Bước 2: Create WebHook

```yaml
Name: Lark Notifications

URL: http://YOUR_PUBLIC_IP:3000/webhook/jira

Events:
  Issue:
    ✅ created
    ✅ updated
  Comment:
    ✅ created

JQL Filter (Optional):
  # Để trống hoặc filter theo project
  # VD: project = MYPROJECT
```

### Bước 3: Test

```
1. Click "Test" button
2. Select một issue
3. Click "Test"
4. Check response: 200 OK
5. Check Lark group: Có message
```

---

## 🎯 Current Configuration

### .env file:
```env
PORT=3000
NODE_ENV=production
SERVER_URL=http://your-public-ip:3000  # ← CẦN UPDATE
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/05d00015-413d-444b-8d0d-ef7d509538e5
JIRA_URL=https://jira.datcv.io.vn  # ← ĐÃ CÓ
```

### Docker Compose:
- ✅ Auto-load từ .env
- ✅ Port mapping: 3000:3000
- ✅ Health checks enabled
- ✅ Auto-restart on failure
- ✅ Logs: 10MB x 3 files

---

## 📊 Docker Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs (real-time)
docker-compose logs -f

# Logs (last 100 lines)
docker-compose logs --tail=100

# Container status
docker-compose ps

# Resource usage
docker stats jira-lark-webhook

# Rebuild & restart
npm run build
docker-compose build
docker-compose up -d --force-recreate
```

---

## 🧪 Test với Real Issue

### Test 1: Create new issue

```
1. Vào https://jira.datcv.io.vn
2. Create new issue
3. Assign cho người trong team (có trong user-mapping.ts)
4. Save
5. → Check Lark group: "🎫 Ticket mới được tạo"
```

### Test 2: Change status

```
1. Kéo issue từ To Do → In Progress
2. → Check Lark group: "📊 Trạng thái thay đổi"
```

### Test 3: Add comment

```
1. Add comment vào issue
2. → Check Lark group: "💬 Comment mới"
```

---

## 🔧 Troubleshooting

### Container không start?

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
npm run build
docker-compose build
docker-compose up -d
```

### Không nhận notifications?

```bash
# 1. Check server logs
docker-compose logs -f | grep ERROR

# 2. Verify Jira webhook
# Vào Jira → Settings → WebHooks → Check URL

# 3. Test manual
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json
```

### Port conflict?

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3001
```

---

## 📋 Final Checklist

- [ ] Update team emails trong `src/config/user-mapping.ts`
- [ ] Update SERVER_URL trong `.env` với real IP
- [ ] Build: `npm run build`
- [ ] Build Docker: `docker-compose build`
- [ ] Start: `docker-compose up -d`
- [ ] Health check: `curl localhost:3000/health` ✅
- [ ] Test Lark: `curl localhost:3000/test` ✅
- [ ] Configure Jira webhook
- [ ] Test webhook: Click "Test" button in Jira ✅
- [ ] Create real issue và verify notification ✅

---

## 🎉 Done!

Server đang chạy tại: `http://localhost:3000`

**Jira Webhook URL:**
```
http://YOUR_PUBLIC_IP:3000/webhook/jira
```

**Next steps:**
1. Update SERVER_URL với real IP
2. Update team emails
3. Rebuild & deploy
4. Configure Jira webhook
5. Test!

**Enjoy automated Jira notifications! 🚀**

---

**Files reference:**
- `DOCKER-QUICKSTART.md` - Quick Docker guide
- `DOCKER-DEPLOYMENT.md` - Full Docker docs
- `QUICK-START.md` - 5-minute setup
- `README-VI.md` - Complete documentation
