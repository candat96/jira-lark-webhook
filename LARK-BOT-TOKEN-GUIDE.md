# 🤖 Hướng dẫn lấy Lark Bot Token

## 📝 Tổng quan

Có 2 loại token trong Lark:
1. **Webhook URL** - Để gửi messages đơn giản (đã có trong `.env`)
2. **Bot Token** - Để gọi Lark API (lấy user info, send advanced messages, etc.)

---

## 🎯 Cách 1: Lấy Bot Token (Recommended)

### Bước 1: Tạo Custom Bot

#### A. Vào Lark Developer Console

1. Truy cập: [https://open.larksuite.com/app](https://open.larksuite.com/app)
2. Đăng nhập với tài khoản Lark admin
3. Click **"Create custom app"** (Tạo ứng dụng tùy chỉnh)

#### B. Điền thông tin App

```yaml
App Name: Jira Notification Bot
Description: Tự động gửi thông báo Jira vào Lark
Icon: Upload logo (optional)
```

Click **"Create"**

### Bước 2: Cấu hình Permissions

#### A. Vào tab "Permissions & Scopes"

Chọn các permissions sau:

**Required permissions:**
```
✅ contact:user.id:read          - Đọc user ID
✅ contact:user.email:read       - Đọc user email
✅ im:message                    - Gửi messages
✅ im:message.group_at_msg       - @mention trong group
```

**Optional (nếu cần advanced features):**
```
□ contact:user.base:readonly     - Đọc user info chi tiết
□ im:chat                        - Quản lý chats
□ im:message.p2p                 - Send private messages
```

Click **"Save"** và **"Submit for review"** (nếu cần)

#### B. Publish & Install

1. Click tab **"Version Management & Release"**
2. Click **"Create version"**
3. Version name: `1.0.0`
4. Click **"Save"** → **"Apply for release"**
5. Sau khi được approve, click **"Install to workspace"**

### Bước 3: Lấy Bot Token

#### A. Lấy App Credentials

1. Vào tab **"Credentials & Basic Info"**
2. Copy 2 giá trị:
   - **App ID**: `cli_xxxxxxxxxxxxx`
   - **App Secret**: `yyyyyyyyyyyyyyy`

#### B. Get Bot Token

Có 2 loại token:

**1. Tenant Access Token (Recommended cho bot):**

```bash
curl -X POST "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "cli_xxxxxxxxxxxxx",
    "app_secret": "yyyyyyyyyyyyyyy"
  }'
```

Response:
```json
{
  "code": 0,
  "msg": "ok",
  "tenant_access_token": "t-g104bj47VFZXQMYNJXQMYNJE5NDRFNDRF...",
  "expire": 7200
}
```

**2. User Access Token (nếu cần user-specific actions):**
- Cần OAuth flow phức tạp hơn
- Không cần cho webhook use case này

### Bước 4: Lưu Token vào .env

```bash
# .env
LARK_APP_ID=cli_xxxxxxxxxxxxx
LARK_APP_SECRET=yyyyyyyyyyyyyyy
LARK_BOT_TOKEN=t-g104bj47VFZXQMYNJXQMYNJE5NDRFNDRF...
```

**Lưu ý:** Tenant access token hết hạn sau 2 giờ, cần refresh!

---

## 🔄 Cách 2: Tự động refresh Bot Token

Vì token hết hạn sau 2 giờ, nên tốt nhất là tự động refresh.

### Update code để auto-refresh token:

#### 1. Tạo Lark Auth Service

```typescript
// src/services/lark-auth.service.ts
import axios from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface TenantAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

class LarkAuthService {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async getTenantAccessToken(): Promise<string> {
    // Check if token is still valid (với 5 phút buffer)
    const now = Date.now() / 1000;
    if (this.token && this.tokenExpiry > now + 300) {
      return this.token;
    }

    // Refresh token
    try {
      const response = await axios.post<TenantAccessTokenResponse>(
        'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
        {
          app_id: config.larkAppId,
          app_secret: config.larkAppSecret,
        }
      );

      if (response.data.code === 0) {
        this.token = response.data.tenant_access_token;
        this.tokenExpiry = Date.now() / 1000 + response.data.expire;
        logger.info('Lark token refreshed successfully');
        return this.token;
      } else {
        throw new Error(`Failed to get token: ${response.data.msg}`);
      }
    } catch (error) {
      logger.error('Failed to refresh Lark token:', error);
      throw error;
    }
  }
}

export const larkAuthService = new LarkAuthService();
```

#### 2. Update config.ts

```typescript
// src/config/config.ts
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
  larkWebhookUrl: process.env.WEBHOOK_URL || '',
  larkAppId: process.env.LARK_APP_ID || '',
  larkAppSecret: process.env.LARK_APP_SECRET || '',
};
```

#### 3. Sử dụng trong API calls

```typescript
// Example: Get user info by email
async function getUserByEmail(email: string) {
  const token = await larkAuthService.getTenantAccessToken();
  
  const response = await axios.get(
    `https://open.larksuite.com/open-apis/contact/v3/users/batch_get_id`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        emails: [email],
      },
    }
  );
  
  return response.data;
}
```

---

## 🎯 Cách 3: Lấy Lark Open ID của Users

Sau khi có Bot Token, có thể lấy Open ID:

### Method 1: Batch Get by Emails

```bash
curl -X POST "https://open.larksuite.com/open-apis/contact/v3/users/batch_get_id?user_id_type=open_id" \
  -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "user1@company.com",
      "user2@company.com"
    ]
  }'
```

Response:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "email_users": {
      "user1@company.com": [{
        "user_id": "ou_a1b2c3d4e5f6g7h8"
      }],
      "user2@company.com": [{
        "user_id": "ou_x1y2z3a4b5c6d7e8"
      }]
    }
  }
}
```

### Method 2: List All Users

```bash
curl -X GET "https://open.larksuite.com/open-apis/contact/v3/users?user_id_type=open_id&page_size=50" \
  -H "Authorization: Bearer YOUR_BOT_TOKEN"
```

### Method 3: Search by Email

```bash
curl -X GET "https://open.larksuite.com/open-apis/contact/v3/users/batch_get_id?emails=user@company.com" \
  -H "Authorization: Bearer YOUR_BOT_TOKEN"
```

---

## 🔧 Tool: Auto-generate User Mapping

Tôi có thể tạo một script để tự động generate user mapping từ danh sách emails:

```bash
# Usage:
node scripts/generate-user-mapping.js emails.txt
```

Input file `emails.txt`:
```
john.doe@company.com
jane.smith@company.com
bob.wilson@company.com
```

Output: Tự động update `src/config/user-mapping.ts`

**Bạn có muốn tôi tạo script này không?**

---

## 📚 So sánh Webhook URL vs Bot Token

| Feature | Webhook URL | Bot Token |
|---------|-------------|-----------|
| Gửi messages cơ bản | ✅ Yes | ✅ Yes |
| @mention users | ✅ Yes | ✅ Yes |
| Rich card messages | ✅ Yes | ✅ Yes |
| Lấy user info | ❌ No | ✅ Yes |
| Send private messages | ❌ No | ✅ Yes |
| Read messages | ❌ No | ✅ Yes |
| Manage chats | ❌ No | ✅ Yes |
| Setup complexity | 🟢 Easy | 🟡 Medium |
| Token expiry | ❌ Never | ⚠️ 2 hours |

**Kết luận:**
- **Webhook URL**: Đủ cho use case hiện tại (gửi notifications)
- **Bot Token**: Cần nếu muốn lấy user info tự động hoặc advanced features

---

## 🎯 Khuyến nghị cho project này

### Option 1: Chỉ dùng Webhook URL (Hiện tại) ✅

**Pros:**
- ✅ Đơn giản, không cần setup phức tạp
- ✅ Không hết hạn token
- ✅ Đủ cho gửi notifications với @mentions

**Cons:**
- ❌ Phải manual lấy Lark Open IDs
- ❌ Không thể auto-sync user mapping

**Phù hợp nếu:** Team size nhỏ, ít thay đổi members

### Option 2: Thêm Bot Token (Advanced) 🚀

**Pros:**
- ✅ Auto-fetch Lark Open IDs từ emails
- ✅ Tự động sync user mapping
- ✅ Advanced features trong tương lai

**Cons:**
- ❌ Phức tạp hơn setup
- ❌ Cần handle token refresh
- ❌ Cần approval từ Lark admin

**Phù hợp nếu:** Team size lớn, thường xuyên thay đổi members

---

## 🔨 Bạn muốn làm gì?

1. **Giữ nguyên Webhook URL** - Đơn giản, manual lấy Open IDs
2. **Thêm Bot Token** - Tôi sẽ implement auto-fetch user IDs
3. **Tạo script generate mapping** - Tool để auto-generate từ email list

**Bạn chọn option nào?** 🤔
