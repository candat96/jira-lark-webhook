# 🔗 Jira Webhook URL Variables

## 📋 Available Variables

Jira cung cấp các biến sau để sử dụng trong Webhook URL:

```
${board.id}
${comment.id}
${issue.id}
${issue.key}
${mergedVersion.id}
${modifiedUser.key}
${modifiedUser.name}
${project.id}
${project.key}
${sprint.id}
${version.id}
```

---

## 🎯 Webhook URL cho Project này

### Basic URL (Recommended):
```
http://194.233.66.68:3096/webhook/jira
```

**Lý do:** 
- Server đã parse tất cả thông tin từ webhook payload
- Không cần truyền variables qua URL
- Đơn giản và dễ maintain

---

## 🔧 Advanced: Sử dụng Variables (Optional)

Nếu muốn filter hoặc debug theo project/issue:

### Filter theo Project:
```
http://194.233.66.68:3096/webhook/jira?project=${project.key}
```

Example khi webhook trigger:
```
http://194.233.66.68:3096/webhook/jira?project=MYPROJ
```

### Include Issue Key:
```
http://194.233.66.68:3096/webhook/jira?issue=${issue.key}
```

Example:
```
http://194.233.66.68:3096/webhook/jira?issue=MYPROJ-123
```

### Multiple Variables:
```
http://194.233.66.68:3096/webhook/jira?project=${project.key}&issue=${issue.key}&user=${modifiedUser.name}
```

Example:
```
http://194.233.66.68:3096/webhook/jira?project=MYPROJ&issue=MYPROJ-123&user=john.doe
```

---

## 📊 Variable Details

| Variable | Mô tả | Example Value |
|----------|-------|---------------|
| `${issue.key}` | Issue key | `PROJ-123` |
| `${issue.id}` | Issue ID (number) | `10001` |
| `${project.key}` | Project key | `PROJ` |
| `${project.id}` | Project ID | `10000` |
| `${modifiedUser.key}` | User account ID | `john.doe` |
| `${modifiedUser.name}` | User display name | `John Doe` |
| `${comment.id}` | Comment ID | `10050` |
| `${board.id}` | Board ID | `1` |
| `${sprint.id}` | Sprint ID | `5` |
| `${version.id}` | Version ID | `10100` |

---

## 💡 Use Cases

### 1. Debug/Logging
```
http://194.233.66.68:3096/webhook/jira?debug=true&issue=${issue.key}
```

Có thể log variables để debug:
```typescript
// In webhook.controller.ts
const issueKey = req.query.issue;
logger.info(`Received webhook for issue: ${issueKey}`);
```

### 2. Project Filtering (Server-side)
```
http://194.233.66.68:3096/webhook/jira?project=${project.key}
```

Filter trong code:
```typescript
// Only process specific projects
const allowedProjects = ['PROJ1', 'PROJ2'];
const projectKey = req.query.project;

if (!allowedProjects.includes(projectKey)) {
  return res.status(200).json({ message: 'Project ignored' });
}
```

### 3. Custom Routing
```
http://194.233.66.68:3096/webhook/jira/${project.key}
```

Sẽ thành:
```
http://194.233.66.68:3096/webhook/jira/MYPROJ
```

---

## ⚠️ Lưu ý

### 1. URL Encoding
Variables sẽ được URL encoded tự động:
```
${modifiedUser.name} = "John Doe" → "John%20Doe"
```

### 2. Empty Values
Nếu variable không có giá trị, Jira sẽ gửi empty string:
```
${comment.id} → "" (nếu không phải comment event)
```

### 3. Payload vẫn đầy đủ
Dù có dùng variables hay không, webhook payload vẫn chứa tất cả thông tin:
```json
{
  "issue": {
    "key": "PROJ-123",
    "id": "10001"
  },
  "project": {
    "key": "PROJ",
    "id": "10000"
  }
}
```

---

## 🎯 Khuyến nghị cho Project này

### Dùng URL đơn giản:
```
http://194.233.66.68:3096/webhook/jira
```

**Vì:**
- ✅ Code đã parse tất cả data từ payload
- ✅ Filtering logic đã có (team members, event types)
- ✅ Đơn giản, không cần maintain URL với variables
- ✅ Dễ debug và test

### Chỉ dùng variables nếu:
- ⚠️ Cần filter cứng theo project (nhưng nên dùng JQL Filter thay vì URL params)
- ⚠️ Cần routing phức tạp
- ⚠️ Có nhiều webhooks endpoints khác nhau

---

## 📝 Jira Webhook Configuration

### Recommended Setup:

```yaml
Name: Lark Notifications

URL: http://194.233.66.68:3096/webhook/jira

Events:
  Issue:
    ✅ created
    ✅ updated
  Comment:
    ✅ created

JQL Filter (Recommended):
  # Filter theo project nếu cần
  project = MYPROJECT
  
  # Hoặc filter theo multiple projects
  project in (PROJ1, PROJ2, PROJ3)
  
  # Hoặc để trống để nhận tất cả

Exclude body: ❌ (KHÔNG check)
```

**JQL Filter tốt hơn URL variables vì:**
- ✅ Jira không gửi webhook nếu không match (tiết kiệm bandwidth)
- ✅ Server không cần xử lý requests không cần thiết
- ✅ Dễ maintain và update

---

## 🔍 Testing với Variables

Nếu muốn test với variables:

### 1. Create webhook với variable:
```
http://194.233.66.68:3096/webhook/jira?test=${issue.key}
```

### 2. Trigger webhook từ Jira (Test button)

### 3. Check server logs:
```bash
docker-compose logs -f | grep "issue.key"
```

### 4. Xem request URL trong logs

---

## 📚 References

- [Jira Webhook Documentation](https://developer.atlassian.com/server/jira/platform/webhooks/)
- [JQL Syntax](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/)

---

## ✅ Summary

**Cho project này:**

```
✅ USE: http://194.233.66.68:3096/webhook/jira
❌ NO NEED: URL variables
✅ USE: JQL Filter trong Jira webhook settings (nếu cần filter)
```

**Simple is better!** 🎯
