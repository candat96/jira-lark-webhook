# 🐳 DOCKER QUICK START

## ⚡ TL;DR - 3 Commands

```bash
# 1. Update team emails
vim src/config/user-mapping.ts

# 2. Build & Deploy
./build-docker.sh
docker-compose up -d

# 3. Verify
curl http://localhost:3000/health
```

Done! 🎉

---

## 📝 Chi tiết từng bước

### Bước 1: Update Configuration

```bash
# Update team emails
vim src/config/user-mapping.ts
```

```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'your.email@company.com': true,
  'teammate@company.com': true,
};
```

### Bước 2: Build

```bash
# Dùng script tự động
./build-docker.sh

# Hoặc manual
npm run build
docker-compose build
```

### Bước 3: Deploy

```bash
# Start container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Bước 4: Verify

```bash
# Health check
curl http://localhost:3000/health
# → {"status":"ok"}

# Test Lark
curl http://localhost:3000/test
# → Message trong Lark group
```

---

## 🔧 Useful Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Rebuild
npm run docker:rebuild

# Status
docker-compose ps
```

---

## 📊 NPM Scripts

```bash
# Docker commands via npm
npm run docker:build     # Build image
npm run docker:up        # Start container
npm run docker:down      # Stop container
npm run docker:logs      # View logs
npm run docker:restart   # Restart
npm run docker:rebuild   # Full rebuild
```

---

## 🎯 Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Monitor
docker-compose -f docker-compose.prod.yml logs -f
```

**Production features:**
- Auto-restart on crash
- Resource limits (CPU/Memory)
- Better logging
- Health checks

---

## 🐛 Troubleshooting

### Container không start?

```bash
# Check logs
docker-compose logs jira-lark-webhook

# Common fixes:
docker-compose down
docker-compose up -d
```

### Port already in use?

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Update code?

```bash
# Rebuild everything
npm run build
docker-compose build
docker-compose up -d --force-recreate
```

---

## 📚 Full Documentation

- `DOCKER-DEPLOYMENT.md` - Complete Docker guide
- `QUICK-START.md` - 5-minute setup
- `README-VI.md` - Full documentation

---

## ✅ Checklist

- [ ] Update team emails in `src/config/user-mapping.ts`
- [ ] Check `.env` has WEBHOOK_URL
- [ ] Build: `npm run build`
- [ ] Build Docker: `docker-compose build`
- [ ] Start: `docker-compose up -d`
- [ ] Health check: `curl localhost:3000/health`
- [ ] Test Lark: `curl localhost:3000/test`
- [ ] Configure Jira webhook
- [ ] Test with real issue

---

**Ready! 🚀 Server running in Docker at http://localhost:3000**
