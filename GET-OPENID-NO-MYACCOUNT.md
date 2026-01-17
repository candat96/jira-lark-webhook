# 🚀 Hướng dẫn lấy Open ID khi KHÔNG thấy trong My Account

## ❌ Vấn đề

Trong **My Account** của Lark, bạn chỉ thấy:
- Name
- Email  
- Phone
- Department

Nhưng **KHÔNG có User ID / Open ID**

---

## 💡 Nguyên nhân

1. Bạn là **External user** (không thuộc organization)
2. Admin đã **ẩn User ID** trong organization settings
3. Quyền hạn của bạn bị giới hạn

→ **Đây là bình thường!** Có cách khác để lấy.

---

## ✅ Giải pháp 1: Yêu cầu Admin lấy (Dễ nhất)

### Bước 1: Gửi message cho Lark Admin

```
Hi Admin,

Tôi đang setup Jira notifications và cần Lark Open ID.
Bạn có thể help lấy Open ID cho tôi được không?

My info:
- Name: [Your Name]
- Email: [Your Email]

Thank you!
```

### Bước 2: Admin làm

```
Admin Console 
→ Organization 
→ Members 
→ Search your name
→ Click vào
→ Copy "Open ID" (ou_xxxxxxxxxxxxx)
→ Gửi cho bạn
```

**Time:** ~2 phút  
**Pros:** Đơn giản, chính xác  
**Cons:** Phải đợi admin

---

## ✅ Giải pháp 2: Dùng Bot API Script (Tự động)

Tôi đã tạo script `scripts/get-group-members.sh` để lấy **TẤT CẢ** Open IDs trong group!

### Bước 1: Lấy Bot Token

#### 1.1. Tạo Lark App

```
1. Vào: https://open.larksuite.com/app
2. Login với Lark admin account
3. Click "Create custom app"
4. App name: "User ID Fetcher"
5. Click "Create"
```

#### 1.2. Add Permissions

```
Permissions & Scopes:
✅ im:chat (Read chats)
✅ im:chat.member (Read chat members)
```

Click **"Save"** → **"Publish"**

#### 1.3. Get Credentials

```
Tab: Credentials & Basic Info
→ Copy:
  - App ID: cli_xxxxxxxxxxxxx
  - App Secret: yyyyyyyyyyyyyyy
```

#### 1.4. Add Bot to Group

```
1. Vào Lark group
2. Settings → Bots
3. Add bot (search by app name)
4. Confirm
```

#### 1.5. Get Bot Token

```bash
# Thay YOUR_APP_ID và YOUR_APP_SECRET
export LARK_BOT_TOKEN=$(curl -s -X POST \
  'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_id": "cli_xxxxxxxxxxxxx",
    "app_secret": "yyyyyyyyyyyyyyy"
  }' | jq -r '.tenant_access_token')

# Verify
echo $LARK_BOT_TOKEN
```

### Bước 2: Chạy Script

```bash
cd /Users/candat/jira-lark-webhook

# Run script
./scripts/get-group-members.sh
```

**Output:**
```
🔍 Lark Group Members Open ID Fetcher
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Bot Token found

📋 Step 1: Fetching all chats...

Available chats:
oc_abc123 - Jira Notifications
oc_def456 - Team Chat

Enter Chat ID: oc_abc123

📋 Step 2: Fetching members in chat: oc_abc123

✅ Members found:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                          | Open ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
John Doe (Internal)           | ou_a1b2c3d4e5f6g7h8
Jane Smith (External)         | ou_x1y2z3a4b5c6d7e8
Bob Wilson                    | ou_z9y8x7w6v5u4t3s2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Exported to: lark-members-20260117-105530.csv
```

### Bước 3: Match với Jira Emails

Mở file CSV vừa export:

```csv
Name,Open ID
John Doe,ou_a1b2c3d4e5f6g7h8
Jane Smith,ou_x1y2z3a4b5c6d7e8
Bob Wilson,ou_z9y8x7w6v5u4t3s2
```

Thêm cột Email (từ Jira):

```csv
Name,Open ID,Jira Email
John Doe,ou_a1b2c3d4e5f6g7h8,john.doe@company.com
Jane Smith,ou_x1y2z3a4b5c6d7e8,jane.smith@partner.com
Bob Wilson,ou_z9y8x7w6v5u4t3s2,bob.wilson@company.com
```

### Bước 4: Update user-mapping.ts

```typescript
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {
  'john.doe@company.com': 'ou_a1b2c3d4e5f6g7h8',
  'jane.smith@partner.com': 'ou_x1y2z3a4b5c6d7e8',
  'bob.wilson@company.com': 'ou_z9y8x7w6v5u4t3s2',
};
```

**Time:** ~10 phút (lần đầu setup)  
**Pros:** Lấy được cả internal & external, tự động  
**Cons:** Cần setup Bot Token

---

## ✅ Giải pháp 3: Test Mention Method

Nếu KHÔNG có Bot Token, có thể thử đoán/test Open IDs:

### Bước 1: Yêu cầu users send message

Post trong group:
```
📢 Hi team,

Please type anything in this chat so I can get your user info.
Just say "hi" or "👋"

Thank you!
```

### Bước 2: Admin extract IDs từ messages

Nếu có quyền admin, có thể xem message metadata để lấy sender's Open ID.

**Cons:** Phức tạp, không reliable

---

## 📊 So sánh các giải pháp

| Method | Internal | External | Cần Admin | Cần Bot Token | Time |
|--------|----------|----------|-----------|---------------|------|
| **Admin lấy giúp** | ✅ | ✅ | ✅ | ❌ | 2 phút |
| **Bot API Script** | ✅ | ✅ | ❌ | ✅ | 10 phút |
| **Test Mention** | ✅ | ✅ | ❌ | ❌ | 30 phút |

---

## 🎯 KHUYẾN NGHỊ

### Nếu bạn là **Admin** hoặc có quyền cao:
→ Dùng **Bot API Script** (Giải pháp 2)

### Nếu bạn là **User thường**:
→ Dùng **Yêu cầu Admin** (Giải pháp 1)

### Nếu team **nhỏ (< 5 người)**:
→ Yêu cầu admin lấy từng người (nhanh nhất)

### Nếu team **lớn (> 10 người)**:
→ Setup Bot API một lần, tự động lấy tất cả

---

## 🔧 Quick Start - Bot API Method

```bash
# 1. Get Bot Token
export LARK_BOT_TOKEN=$(curl -s -X POST \
  'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal' \
  -H 'Content-Type: application/json' \
  -d '{"app_id":"YOUR_APP_ID","app_secret":"YOUR_SECRET"}' \
  | jq -r '.tenant_access_token')

# 2. Run script
cd /Users/candat/jira-lark-webhook
./scripts/get-group-members.sh

# 3. Mở CSV file
open lark-members-*.csv

# 4. Match với Jira emails và update user-mapping.ts
```

---

## ❓ FAQ

**Q: Script báo lỗi "code": 99991663?**  
A: Bot chưa được add vào group. Add bot vào group rồi thử lại.

**Q: Bot Token hết hạn?**  
A: Token hết hạn sau 2 giờ. Chạy lại lệnh get token.

**Q: Không thấy chat ID trong list?**  
A: Bot phải được add vào group trước. Check lại group settings.

**Q: CSV file không có external users?**  
A: Có thể external users không có permission. Yêu cầu admin check.

**Q: Tôi không có quyền tạo Bot?**  
A: Yêu cầu admin tạo giúp hoặc dùng Giải pháp 1 (admin lấy manual).

---

## ✅ Next Steps

1. Chọn giải pháp phù hợp
2. Lấy tất cả Open IDs
3. Match với Jira emails  
4. Update `src/config/user-mapping.ts`
5. Test với `curl` hoặc `./test.sh`
6. Deploy!

---

**Need help? Check:**
- `LARK-BOT-TOKEN-GUIDE.md` - Chi tiết về Bot Token
- `SETUP-CHECKLIST.md` - Full setup guide
- `README-VI.md` - Vietnamese docs

**Good luck! 🚀**
