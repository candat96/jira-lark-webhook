# 🔧 Docker Build Error - Quick Fix

## ❌ Lỗi bạn gặp phải:

```
failed to solve: "/dist": not found
```

hoặc

```
Cannot connect to the Docker daemon
```

---

## ✅ Giải pháp

### Fix 1: Build TypeScript trước (BẮT BUỘC)

Docker cần folder `dist` để copy vào image. Folder này được tạo bởi TypeScript compiler.

```bash
# Build TypeScript
npm run build

# Verify dist folder
ls -la dist/

# Sau đó build Docker
docker-compose build
```

---

### Fix 2: Start Docker Desktop (Nếu daemon chưa chạy)

```bash
# Check Docker daemon
docker info

# Nếu lỗi "Cannot connect to Docker daemon":
# → Start Docker Desktop app
# → Wait ~10 seconds
# → Try again: docker info
```

---

## 🚀 Workflow đúng

### Lần đầu build:

```bash
# 1. Build TypeScript (tạo dist folder)
npm run build

# 2. Build Docker image
docker-compose build

# 3. Start container
docker-compose up -d
```

### Khi update code:

```bash
# 1. Rebuild TypeScript
npm run build

# 2. Rebuild Docker
docker-compose build

# 3. Recreate container
docker-compose up -d --force-recreate
```

---

## 📝 Hoặc dùng script tự động

```bash
# Script đã check tất cả
./build-docker.sh

# Nếu thành công:
docker-compose up -d
```

---

## 🔍 Troubleshooting

### "dist not found"

```bash
# Check dist folder có chưa
ls dist/

# Nếu không có → build TypeScript
npm run build

# Verify
ls dist/index.js  # Phải có file này
```

### "Docker daemon not running"

**macOS:**
```bash
# Open Docker Desktop app
open -a Docker

# Wait 10 seconds, then check
docker info
```

**Linux:**
```bash
sudo systemctl start docker
docker info
```

**Windows:**
```bash
# Start Docker Desktop từ Start Menu
# Wait 10 seconds, then check
docker info
```

### "Permission denied"

**Linux only:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
# Or run with sudo
sudo docker-compose build
```

---

## ✅ Checklist

Trước khi build Docker:

- [ ] Docker Desktop đang chạy (`docker info` works)
- [ ] TypeScript đã build (`ls dist/index.js` exists)
- [ ] `.env` file có đủ variables
- [ ] Trong folder `jira-lark-webhook`

Sau đó:

```bash
docker-compose build
docker-compose up -d
```

---

## 🎯 Quick Commands

```bash
# Full rebuild (from scratch)
npm run build && docker-compose build --no-cache

# Start container
docker-compose up -d

# Check logs
docker-compose logs -f

# Health check
curl http://localhost:3000/health
```

---

## 📚 Next Steps

Sau khi Docker build thành công:

1. **Start container:**
   ```bash
   docker-compose up -d
   ```

2. **Verify:**
   ```bash
   docker-compose ps
   curl http://localhost:3000/health
   ```

3. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Configure Jira webhook** theo hướng dẫn trong `READY-TO-DEPLOY.md`

---

**Need help?** Check:
- `DOCKER-QUICKSTART.md` - Quick reference
- `DOCKER-DEPLOYMENT.md` - Full guide
- `READY-TO-DEPLOY.md` - Deploy checklist
