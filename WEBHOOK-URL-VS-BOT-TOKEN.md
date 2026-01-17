# 🤔 LARK_BOT_TOKEN vs Webhook URL - Sự khác biệt

## ❓ Câu hỏi: LARK_BOT_TOKEN có phải là token của bot trong group không?

**Trả lời: KHÔNG! ❌**

Đây là 2 thứ hoàn toàn khác nhau.

---

## 📊 So sánh chi tiết

| | Webhook URL (Đã có) | Bot Token (Chưa có) |
|---|---------------------|---------------------|
| **Là gì?** | URL để GỬI messages vào group | Token để GỌI Lark API |
| **Format** | `https://open.larksuite.com/open-apis/bot/v2/hook/xxxxx` | `t-g104bj47VFZXQMYNJXQMYNJE...` |
| **Lấy từ đâu?** | Group Settings → Bots → Add bot → Copy URL | Developer Console → Create App → Get credentials |
| **Dùng để làm gì?** | Gửi notifications VÀO group | Đọc user info, chat members, send DMs |
| **Cần setup?** | ❌ Không (đã có trong `.env`) | ✅ Có (phải tạo app mới) |
| **Hết hạn?** | ❌ Không bao giờ | ✅ Sau 2 giờ (phải refresh) |
| **Đủ cho project?** | ✅ ĐỦ để gửi notifications | ❌ Không bắt buộc |

---

## 🔍 Chi tiết từng loại

### 1️⃣ Webhook URL (Bạn ĐÃ CÓ)

**File `.env` hiện tại:**
```env
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/05d00015-413d-444b-8d0d-ef7d509538e5
```

**Cách lấy:**
```
1. Vào Lark group
2. Group Settings (⚙️)
3. Bots → Add custom bot
4. Bot name: "Jira Notifications"
5. Copy Webhook URL
```

**Dùng để:**
```bash
# Gửi message VÀO group
curl -X POST "https://open.larksuite.com/open-apis/bot/v2/hook/xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "msg_type": "text",
    "content": {"text": "Hello from webhook!"}
  }'
```

**Permissions:**
- ✅ Gửi text messages
- ✅ Gửi rich card messages
- ✅ @mention users (nếu biết Open ID)
- ❌ KHÔNG đọc được user info
- ❌ KHÔNG đọc được chat members
- ❌ KHÔNG gửi private messages

---

### 2️⃣ Bot Token (Chưa có - CẦN TẠO MỚI)

**Là gì:**
- Token để authenticate với Lark Open API
- Cần tạo một **Custom App** trong Developer Console
- Token hết hạn sau 2 giờ, phải refresh

**Format:**
```
t-g104bj47VFZXQMYNJXQMYNJE5NDRFNDRF4ODRFODRF...
```

**Cách lấy:**

#### Bước 1: Tạo Custom App
```
1. Vào: https://open.larksuite.com/app
2. Login (cần admin hoặc developer account)
3. Click "Create custom app"
4. App name: "Jira User Fetcher"
5. Description: "Fetch user Open IDs for Jira integration"
6. Click "Create"
```

#### Bước 2: Cấu hình Permissions
```
Tab: Permissions & Scopes

Required:
✅ im:chat (Read chats)
✅ im:chat.member (Read chat members)
✅ contact:user.id:read (Read user IDs)

Optional:
□ contact:user.email:read (Read emails)
□ im:message (Send messages)
```

Click **"Save"** → **"Publish"**

#### Bước 3: Get App Credentials
```
Tab: Credentials & Basic Info

Copy:
- App ID: cli_a1b2c3d4e5f6g7h8
- App Secret: aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

#### Bước 4: Install App to Workspace
```
Tab: Version Management & Release
→ Create version
→ Submit for review (nếu cần)
→ Release
→ Install to workspace
```

#### Bước 5: Add Bot to Group
```
1. Vào Lark group
2. Settings → Bots
3. Add bot (search "Jira User Fetcher")
4. Confirm
```

#### Bước 6: Get Token bằng API
```bash
curl -X POST "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "cli_a1b2c3d4e5f6g7h8",
    "app_secret": "aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
  }'
```

**Response:**
```json
{
  "code": 0,
  "msg": "ok",
  "tenant_access_token": "t-g104bj47VFZXQMYNJXQMYNJE...",
  "expire": 7200
}
```

**Dùng để:**
```bash
# Lấy danh sách members trong chat
curl -X GET "https://open.larksuite.com/open-apis/im/v1/chats/CHAT_ID/members" \
  -H "Authorization: Bearer t-g104bj47VFZXQMYNJXQMYNJE..."

# Lấy user info từ email
curl -X POST "https://open.larksuite.com/open-apis/contact/v3/users/batch_get_id" \
  -H "Authorization: Bearer t-g104bj47VFZXQMYNJXQMYNJE..." \
  -d '{"emails": ["user@company.com"]}'
```

**Permissions:**
- ✅ Đọc chat members
- ✅ Đọc user info (name, email, Open ID)
- ✅ Send messages (nếu có permission)
- ✅ Send private messages
- ✅ Read messages

---

## 🎯 Cho project Jira-Lark Webhook hiện tại

### Bạn CẦN gì?

#### ✅ ĐÃ CÓ - Webhook URL
```
File: .env
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/05d00015...
```

**Đủ để:**
- ✅ Gửi Jira notifications vào group
- ✅ @mention users (nếu biết Open ID)
- ✅ Rich card messages
- ✅ Buttons, links

**KHÔNG ĐỦ để:**
- ❌ Tự động lấy Open IDs từ group
- ❌ Lấy user info từ emails

---

#### ⚠️ CHƯA CÓ - Bot Token

**CẦN NẾU:**
- Muốn tự động lấy Open IDs của members
- Muốn sync user mapping tự động
- Team lớn, thường xuyên thay đổi members

**KHÔNG CẦN NẾU:**
- Team nhỏ, ít thay đổi
- OK với manual lấy Open IDs
- Admin có thể lấy giúp

---

## 📋 Workflow Recommendations

### Option 1: KHÔNG dùng Bot Token (Đơn giản)

```
1. ✅ Webhook URL đã có trong .env
2. Manual lấy Open IDs:
   - Yêu cầu admin lấy từ Admin Console
   - Hoặc users tự report (nếu có quyền)
3. Update src/config/user-mapping.ts manually
4. Deploy & test
```

**Phù hợp:** Team < 10 người, ít thay đổi

---

### Option 2: Dùng Bot Token (Tự động)

```
1. ✅ Webhook URL đã có (gửi notifications)
2. ✅ Tạo Bot Token mới (lấy user info)
3. Chạy script ./scripts/get-group-members.sh
4. Auto-generate user-mapping.ts
5. Deploy & test
```

**Phù hợp:** Team > 10 người, thường xuyên thay đổi

---

## 🔧 TÓM TẮT

### Webhook URL (trong .env)
- **Là:** URL của bot trong group
- **Format:** `https://open.larksuite.com/.../hook/xxxxx`
- **Dùng:** Gửi messages VÀO group
- **Status:** ✅ ĐÃ CÓ
- **Cần thiết:** ✅ BẮT BUỘC

### Bot Token
- **Là:** Token để gọi Lark API
- **Format:** `t-g104bj47VFZX...`
- **Dùng:** Đọc user info, chat members
- **Status:** ❌ CHƯA CÓ
- **Cần thiết:** ⚠️ TÙY CHỌN (chỉ cần nếu muốn auto-fetch Open IDs)

---

## ❓ Bạn cần làm gì tiếp theo?

### Nếu muốn ĐƠN GIẢN (không cần Bot Token):
```bash
# Bước 1: Yêu cầu admin lấy Open IDs
# (hoặc users tự lấy nếu có quyền)

# Bước 2: Update manual
vim src/config/user-mapping.ts

# Bước 3: Deploy
npm run build
npm start
```

### Nếu muốn TỰ ĐỘNG (cần Bot Token):
```bash
# Bước 1: Tạo Lark App (xem hướng dẫn trên)
# Bước 2: Get Bot Token
# Bước 3: Chạy script
./scripts/get-group-members.sh
# Bước 4: Update mapping tự động
```

---

## 🎯 Khuyến nghị của tôi

**Nếu team của bạn:**
- **< 10 người:** Không cần Bot Token, manual lấy Open IDs
- **10-50 người:** Nên dùng Bot Token, setup 1 lần
- **> 50 người:** BẮT BUỘC dùng Bot Token + automation

**Bạn muốn đi theo hướng nào?**

1. **Đơn giản** - Manual lấy Open IDs (tôi hướng dẫn)
2. **Tự động** - Setup Bot Token (tôi hướng dẫn từng bước)

---

**Questions? Let me know! 😊**
