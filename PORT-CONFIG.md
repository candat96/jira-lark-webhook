# ⚙️ Port Configuration

## 📊 Current Setup

### Port Mapping:
```
VPS External Port: 3096
    ↓
Docker Port Mapping: 3096:3000
    ↓
Container Internal Port: 3000
    ↓
Express App: PORT=3000
```

---

## 🔧 Configuration Files

### 1. docker-compose.yml & docker-compose.prod.yml
```yaml
ports:
  - "3096:3000"  # VPS:Container
```

### 2. .env
```env
PORT=3000                              # App internal port
SERVER_URL=http://194.233.66.68:3096  # External URL
```

---

## 🌐 URLs

### External (public):
```
Health: http://194.233.66.68:3096/health
Test: http://194.233.66.68:3096/test
Webhook: http://194.233.66.68:3096/webhook/jira
```

### Internal (inside container):
```
App runs on: http://localhost:3000
```

---

## 🚀 Deploy Commands

```bash
# Build
docker-compose build

# Start (port 3096 on VPS)
docker-compose up -d

# Verify
curl http://194.233.66.68:3096/health
curl http://localhost:3096/health  # On VPS
```

---

## 🔒 Firewall

Đảm bảo port 3096 được mở:

```bash
# Check if port is open
sudo ufw status | grep 3096

# Open port if needed
sudo ufw allow 3096/tcp
```

---

## 🎯 Jira Webhook Configuration

```
URL: http://194.233.66.68:3096/webhook/jira
```

**Not:** `http://194.233.66.68:3000` (wrong port)

---

## ✅ Summary

- ✅ App runs on port 3000 inside container
- ✅ Docker exposes port 3096 on VPS
- ✅ External access via port 3096
- ✅ Jira webhook uses port 3096
