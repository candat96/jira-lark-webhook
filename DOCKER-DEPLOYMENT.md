# 🐳 Docker Deployment Guide

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Port 3000 available

## 🚀 Quick Start

### Bước 1: Update Configuration

#### 1.1. Update team emails

```bash
vim src/config/user-mapping.ts
```

```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'your.email@company.com': true,
  'teammate@company.com': true,
  // ... thêm tất cả team members
};
```

#### 1.2. Check .env file

```bash
cat .env
```

Đảm bảo có:
```env
PORT=3000
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR-WEBHOOK-ID
SERVER_URL=http://YOUR_PUBLIC_IP:3000
NODE_ENV=production
```

---

### Bước 2: Build & Deploy

#### Option A: Dùng script tự động (Recommended)

```bash
./build-docker.sh
```

Script sẽ:
1. Build TypeScript → JavaScript
2. Check .env file
3. Build Docker image
4. Show next steps

#### Option B: Manual

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

### Bước 3: Verify

```bash
# Check container status
docker-compose ps

# Health check
curl http://localhost:3000/health
# → {"status":"ok",...}

# Test Lark integration
curl http://localhost:3000/test
# → Test message trong Lark group

# View logs
docker-compose logs -f jira-lark-webhook
```

---

## 📁 Files Structure

```
jira-lark-webhook/
├── Dockerfile                   # Docker image definition
├── docker-compose.yml           # Development/staging
├── docker-compose.prod.yml      # Production với resource limits
├── build-docker.sh              # Build script
├── .env                         # Environment variables
├── .dockerignore                # Files to ignore
└── logs/                        # Container logs (mounted)
```

---

## 🔧 Docker Commands

### Start/Stop

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# Stop and remove everything
docker-compose down -v
```

### Logs

```bash
# View logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs for specific service
docker-compose logs -f jira-lark-webhook
```

### Health & Status

```bash
# Container status
docker-compose ps

# Health check
docker inspect --format='{{json .State.Health}}' jira-lark-webhook | jq

# Resource usage
docker stats jira-lark-webhook
```

### Update & Rebuild

```bash
# Update code
git pull  # nếu dùng git

# Rebuild TypeScript
npm run build

# Rebuild image
docker-compose build

# Recreate container
docker-compose up -d --force-recreate
```

---

## 🏭 Production Deployment

### Dùng docker-compose.prod.yml

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d

# Logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Differences:**
- `restart: always` (auto-restart)
- Resource limits (CPU: 0.5, Memory: 256MB)
- Better logging configuration

---

## 🔄 Update Workflow

### Khi update code hoặc config:

```bash
# 1. Update code/config
vim src/config/user-mapping.ts
# hoặc
vim .env

# 2. Rebuild TypeScript
npm run build

# 3. Rebuild Docker image
docker-compose build

# 4. Recreate container (zero downtime)
docker-compose up -d --force-recreate

# 5. Verify
docker-compose logs -f
curl http://localhost:3000/health
```

---

## 🐛 Troubleshooting

### Container không start

```bash
# Check logs
docker-compose logs jira-lark-webhook

# Common issues:
# - Port 3000 already in use
# - Missing .env file
# - Invalid WEBHOOK_URL
```

**Fix:**
```bash
# Check port
lsof -i :3000

# Recreate .env
cp .env.example .env
vim .env
```

### Health check failed

```bash
# Check container
docker-compose ps

# Enter container
docker-compose exec jira-lark-webhook sh

# Manual health check
wget -O- http://localhost:3000/health
```

### Container crashes/restarts

```bash
# View crash logs
docker-compose logs --tail=200 jira-lark-webhook

# Check resource usage
docker stats jira-lark-webhook

# Increase memory limit (if needed)
# Edit docker-compose.yml:
#   memory: 512M  # increase from 256M
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats jira-lark-webhook

# Output:
# CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT
# abc123         jira-lark-webhook    0.5%      45MB / 256MB
```

### Logs

```bash
# Container logs
docker-compose logs -f --tail=100

# Host logs (if mounted)
tail -f logs/app.log
```

### Health Checks

```bash
# Auto health check (every 30s)
docker inspect jira-lark-webhook | jq '.[0].State.Health'

# Manual check
curl http://localhost:3000/health
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

```bash
# NEVER commit .env to git
echo ".env" >> .gitignore

# Use secrets for production
docker secret create webhook_url ./webhook_url.txt
```

### 2. Network Isolation

```yaml
# docker-compose.yml already uses custom network
networks:
  jira-lark-network:
    driver: bridge
```

### 3. Read-only Filesystem

```yaml
# Add to docker-compose.yml for extra security
volumes:
  - ./.env:/app/.env:ro  # Read-only
```

### 4. Non-root User

```dockerfile
# Add to Dockerfile
USER node
```

---

## 📈 Scaling (Advanced)

### Multiple Replicas

```bash
# Scale to 3 instances
docker-compose up -d --scale jira-lark-webhook=3

# Behind nginx/traefik load balancer
```

### Docker Swarm

```bash
# Init swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml jira-lark
```

---

## 🎯 Complete Deployment Checklist

- [ ] Update `src/config/user-mapping.ts` với real emails
- [ ] Update `.env` với real WEBHOOK_URL và SERVER_URL
- [ ] Build TypeScript: `npm run build`
- [ ] Build Docker: `docker-compose build`
- [ ] Start container: `docker-compose up -d`
- [ ] Check health: `curl http://localhost:3000/health`
- [ ] Test Lark: `curl http://localhost:3000/test`
- [ ] Configure Jira webhook
- [ ] Test with real Jira issue
- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Setup auto-restart: Use `docker-compose.prod.yml`

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `WEBHOOK_URL` | Yes | - | Lark webhook URL |
| `SERVER_URL` | Yes | - | Public server URL |
| `NODE_ENV` | No | `development` | Environment |

---

## 🆘 Quick Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Health
curl http://localhost:3000/health

# Update
npm run build && docker-compose build && docker-compose up -d --force-recreate

# Clean
docker-compose down -v
docker system prune -a
```

---

## 🎉 Done!

Server đang chạy trong Docker container! 🐳

**Next steps:**
1. Configure Jira webhook: `http://YOUR_PUBLIC_IP:3000/webhook/jira`
2. Test với real issue
3. Monitor logs: `docker-compose logs -f`

**Questions? Check:**
- `QUICK-START.md` - Quick start guide
- `README-VI.md` - Full documentation
- `TROUBLESHOOTING.md` - Common issues

**Enjoy! 🚀**
