# ✅ SIMPLIFIED SETUP - Không cần Lark Open ID

## 🎉 Tin vui!

Tôi đã **update code** để đơn giản hóa setup:

- ❌ **KHÔNG CẦN** Lark Open ID
- ❌ **KHÔNG CẦN** @mention users
- ✅ **CHỈ CẦN** Jira emails của team members
- ✅ Hiển thị tên người dạng **bold text** thay vì @mention

---

## 📝 Setup đơn giản

### Bước 1: Update `src/config/user-mapping.ts`

```typescript
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // Chỉ cần thêm Jira emails của team members
  'john.doe@company.com': true,
  'jane.smith@company.com': true,
  'bob.wilson@company.com': true,
  'external.user@partner.com': true,  // External users cũng OK
};
```

**Đơn giản thế thôi!** Không cần Lark Open ID nữa.

---

## 📊 Message format mới

### Trước (với @mention):
```
🎫 Ticket mới được tạo
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug

📝 Reporter: @John Doe       ← @mention (cần Open ID)
👤 Assignee: @Jane Smith     ← @mention (cần Open ID)
```

### Sau (text only):
```
🎫 Ticket mới được tạo
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug

📝 Reporter: **John Doe**    ← Bold text (không cần Open ID)
👤 Assignee: **Jane Smith**  ← Bold text (không cần Open ID)
```

---

## 🚀 Deploy ngay

### Bước 1: Update user emails

```bash
# Edit file
vim src/config/user-mapping.ts

# Thêm emails của team members
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  'your.email@company.com': true,
  'teammate@company.com': true,
  // ... thêm tất cả team members
};
```

### Bước 2: Build & Deploy

```bash
# Build
npm run build

# Start server
npm start

# Hoặc dùng PM2
pm2 start dist/index.js --name jira-lark-webhook
pm2 save
```

### Bước 3: Configure Jira Webhook

```
Jira Settings → System → WebHooks → Create

Name: Lark Notifications
URL: http://YOUR_PUBLIC_IP:3000/webhook/jira
Events:
  ✅ Issue → created
  ✅ Issue → updated
  ✅ Comment → created
```

### Bước 4: Test!

```bash
# Tạo issue mới trong Jira
# → Check Lark group nhận message

# Thay đổi status
# → Check Lark group nhận message

# Add comment
# → Check Lark group nhận message
```

---

## 🎯 So sánh Version cũ vs mới

| | Version cũ (với @mention) | Version mới (simplified) |
|---|---------------------------|--------------------------|
| **Cần Lark Open ID?** | ✅ Có (phức tạp) | ❌ Không |
| **Cần Bot Token?** | ⚠️ Optional | ❌ Không |
| **Setup time** | 30-60 phút | 5 phút |
| **User format** | `@John Doe` (mention) | `**John Doe**` (bold) |
| **Notification** | Có ping user | Không ping (chỉ hiển thị) |
| **External users** | Khó lấy Open ID | Dễ (chỉ cần email) |

---

## ✅ Checklist

- [ ] Update `JIRA_TEAM_EMAILS` với emails của team
- [ ] Build: `npm run build`
- [ ] Start server: `npm start` hoặc PM2
- [ ] Configure Jira webhook
- [ ] Test với real issue

---

## ❓ FAQ

**Q: Còn @mention được không?**  
A: Không. Giờ chỉ hiển thị tên dạng bold text. Nếu cần @mention thì phải lấy Lark Open IDs (xem các file guide khác).

**Q: Message có ping users không?**  
A: Không. Messages chỉ hiển thị trong group, không ping/notify users cụ thể.

**Q: External users có work không?**  
A: Có! Chỉ cần thêm Jira email của họ vào `JIRA_TEAM_EMAILS`.

**Q: Có cần setup gì thêm không?**  
A: Không. Chỉ cần:
1. Webhook URL trong `.env` (đã có)
2. Team emails trong `user-mapping.ts`
3. Deploy & config Jira webhook

**Q: Có thể quay lại version có @mention không?**  
A: Có. Check git history hoặc xem các file guide (LARK-BOT-TOKEN-GUIDE.md, etc.) để setup lại.

---

## 🎉 Done!

Setup giờ đơn giản hơn **10 lần**! Chỉ cần 5 phút là có thể deploy.

**Next steps:**
1. Update team emails
2. Deploy
3. Enjoy notifications! 🚀

---

**Questions? Check:**
- `README-VI.md` - Full documentation
- `SETUP-CHECKLIST.md` - Detailed setup guide
- `SUMMARY.md` - Project overview
