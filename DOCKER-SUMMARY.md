# 🐳 DOCKER DEPLOYMENT - Complete

## ✅ Files đã tạo

```
jira-lark-webhook/
├── Dockerfile                   # Docker image definition
├── docker-compose.yml           # Development/staging compose
├── docker-compose.prod.yml      # Production compose (với resource limits)
├── .dockerignore               # Files to exclude from image
├── build-docker.sh             # Build script tự động
├── DOCKER-DEPLOYMENT.md        # Full Docker guide
└── DOCKER-QUICKSTART.md        # Quick start guide
```

---

## 🚀 Deploy trong 3 bước

### Bước 1: Update Config (1 phút)

```bash
# Update team emails
vim src/config/user-mapping.ts

# Check .env
cat .env  # Đảm bảo có WEBHOOK_URL
```

### Bước 2: Build & Deploy (2 phút)

```bash
# Build script tự động
./build-docker.sh

# Start container
docker-compose up -d
```

### Bước 3: Verify (30 giây)

```bash
# Health check
curl http://localhost:3000/health

# Test Lark
curl http://localhost:3000/test

# View logs
docker-compose logs -f
```

**Total time: ~4 phút** ⏱️

---

## 📋 Docker Compose Features

### Development (docker-compose.yml)

```yaml
services:
  jira-lark-webhook:
    restart: unless-stopped
    ports: ["3000:3000"]
    env_file: [".env"]
    volumes:
      - ./.env:/app/.env:ro
      - ./logs:/app/logs
    healthcheck: enabled
    logging: json-file (10MB, 3 files)
```

**Use cases:**
- Local development
- Testing
- Staging environment

### Production (docker-compose.prod.yml)

```yaml
services:
  jira-lark-webhook:
    restart: always
    deploy:
      resources:
        limits: {cpus: '0.5', memory: 256M}
        reservations: {cpus: '0.25', memory: 128M}
    # Same ports, volumes, healthcheck as dev
```

**Additional features:**
- Always restart on failure
- Resource limits (prevent OOM)
- Better for production servers

---

## 🎯 Deployment Methods

### Method 1: Script (Recommended)

```bash
./build-docker.sh
docker-compose up -d
```

**Pros:**
- ✅ Automatic checks
- ✅ Step-by-step output
- ✅ Error handling

### Method 2: NPM Scripts

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
```

**Pros:**
- ✅ Familiar npm commands
- ✅ Easy to remember

### Method 3: Manual

```bash
npm run build
docker-compose build
docker-compose up -d
```

**Pros:**
- ✅ Full control
- ✅ Good for CI/CD

---

## 📊 Resource Usage

### Container Stats

```
CONTAINER          CPU %    MEM USAGE / LIMIT    MEM %
jira-lark-webhook  0.3%     45MB / 256MB        17.5%
```

**Expected usage:**
- **CPU:** 0.1-0.5% (idle-normal)
- **Memory:** 40-80MB
- **Disk:** ~50MB (image size)
- **Network:** Minimal (webhook calls)

### Scaling

```bash
# Scale to 3 replicas (với load balancer)
docker-compose up -d --scale jira-lark-webhook=3
```

---

## 🔄 Update Workflow

### Khi update code hoặc config:

```bash
# 1. Pull changes (nếu dùng git)
git pull

# 2. Update config nếu cần
vim src/config/user-mapping.ts

# 3. Rebuild & redeploy
npm run docker:rebuild

# 4. Verify
docker-compose logs -f
```

**Downtime:** ~5 seconds (container recreation)

### Zero-downtime update (Advanced):

```bash
# Build new image
docker-compose build

# Start new container (different name)
docker-compose -p jira-lark-v2 up -d

# Switch traffic (via load balancer/nginx)
# ...

# Stop old container
docker-compose -p jira-lark-v1 down
```

---

## 🔍 Monitoring & Debugging

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Search logs
docker-compose logs | grep ERROR

# Export logs
docker-compose logs > logs.txt
```

### Health Checks

```bash
# Auto health check (every 30s)
docker inspect jira-lark-webhook | jq '.[0].State.Health'

# Manual health check
curl http://localhost:3000/health

# Inside container
docker-compose exec jira-lark-webhook wget -O- http://localhost:3000/health
```

### Resource Monitoring

```bash
# Real-time stats
docker stats jira-lark-webhook

# Disk usage
docker system df

# Image size
docker images jira-lark-webhook
```

### Debugging

```bash
# Enter container
docker-compose exec jira-lark-webhook sh

# Check files
ls -la /app

# Check env vars
env | grep WEBHOOK

# Test endpoint
wget -O- http://localhost:3000/health
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

```bash
# NEVER commit .env
echo ".env" >> .gitignore

# Use .env.example as template
cp .env.example .env
```

### 2. Read-only Mounts

```yaml
volumes:
  - ./.env:/app/.env:ro  # Read-only
```

### 3. Network Isolation

```yaml
networks:
  jira-lark-network:
    driver: bridge
```

### 4. Resource Limits

```yaml
deploy:
  resources:
    limits: {memory: 256M, cpus: '0.5'}
```

### 5. Non-root User (Optional)

```dockerfile
# Add to Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

---

## 🎯 Production Checklist

- [ ] Update `src/config/user-mapping.ts`
- [ ] Set real WEBHOOK_URL in `.env`
- [ ] Set real SERVER_URL in `.env`
- [ ] Build TypeScript: `npm run build`
- [ ] Build Docker: `docker-compose build`
- [ ] Use production compose: `docker-compose.prod.yml`
- [ ] Start container: `docker-compose up -d`
- [ ] Health check: Pass ✅
- [ ] Test Lark integration: Pass ✅
- [ ] Configure Jira webhook
- [ ] Test with real issue: Pass ✅
- [ ] Setup monitoring (logs, alerts)
- [ ] Document server IP/URL
- [ ] Setup auto-restart (systemd or docker restart policy)

---

## 📈 Performance Tips

### 1. Use Alpine Base Image

```dockerfile
FROM node:18-alpine  # ✅ 50MB
# vs
FROM node:18         # ❌ 900MB
```

### 2. Multi-stage Build (Optional)

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 3. Layer Caching

```dockerfile
# Copy package.json first (cached if not changed)
COPY package*.json ./
RUN npm ci

# Copy code last (changes frequently)
COPY dist ./dist
```

---

## 🆘 Common Issues & Solutions

### Issue: "Port already in use"

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port
# Edit .env: PORT=3001
```

### Issue: "Container keeps restarting"

```bash
# Check logs
docker-compose logs --tail=100

# Common causes:
# - Missing .env file
# - Invalid WEBHOOK_URL
# - Port conflict
```

### Issue: "Cannot connect to Lark"

```bash
# Check WEBHOOK_URL
docker-compose exec jira-lark-webhook env | grep WEBHOOK_URL

# Test from container
docker-compose exec jira-lark-webhook wget -O- $WEBHOOK_URL
```

### Issue: "Out of memory"

```bash
# Increase limit in docker-compose.prod.yml
memory: 512M  # increase from 256M

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 🎉 Done!

Bạn đã có:

✅ Docker image ready to deploy  
✅ Docker Compose configuration  
✅ Build scripts  
✅ Production-ready setup  
✅ Complete documentation  

**Deploy command:**
```bash
./build-docker.sh && docker-compose up -d
```

**Verify:**
```bash
curl http://localhost:3000/health
```

**Configure Jira:**
```
URL: http://YOUR_PUBLIC_IP:3000/webhook/jira
```

**Enjoy! 🚀🐳**

---

**Questions?**
- `DOCKER-QUICKSTART.md` - Quick reference
- `DOCKER-DEPLOYMENT.md` - Full guide
- `README-VI.md` - Complete docs
