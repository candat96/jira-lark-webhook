# 🔔 Tích hợp Jira-Lark Webhook

Tự động gửi thông báo vào nhóm Lark khi có issue Jira được tạo mới, cập nhật hoặc có comment từ thành viên trong team.

## ✨ Tính năng

- ✅ **Thông báo Issue mới** - Cảnh báo khi có issue mới được tạo và assign cho thành viên team
- ✅ **Theo dõi thay đổi Status** - Giám sát quá trình chuyển trạng thái (To Do → In Progress → Done)
- ✅ **Cập nhật Assignee** - Nhận thông báo khi issue được assign lại
- ✅ **Thông báo Comment** - Nhận thông báo comment mới (trừ self-comment)
- ✅ **Lọc thông minh** - Chỉ thông báo issues liên quan đến team members (reporter hoặc assignee)
- ✅ **Rich Card Messages** - Tin nhắn dạng card đẹp với @mentions và link trực tiếp
- ✅ **User Mapping** - Map Jira users sang Lark users để @mention chính xác

## 🏗️ Kiến trúc

```
┌─────────┐         ┌──────────────────┐         ┌──────────┐
│  Jira   │ webhook │  Express Server  │  POST   │   Lark   │
│ System  │────────>│   Node.js/TS     │────────>│  Group   │
└─────────┘         └──────────────────┘         └──────────┘
```

## 📋 Yêu cầu

- **Node.js** v18 trở lên
- **Quyền Admin Jira** (để cấu hình webhooks)
- **Lark Bot Webhook URL** (lấy từ settings của Lark group)
- **Public Server hoặc ngrok** (để nhận Jira webhooks)

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt Dependencies

```bash
# Di chuyển vào thư mục project
cd jira-lark-webhook

# Cài đặt dependencies
npm install
```

### 2. Cấu hình

#### a) Environment Variables

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
PORT=3000
WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR-WEBHOOK-ID
SERVER_URL=http://your-public-ip:3000
NODE_ENV=production
```

**Cách lấy Lark Webhook URL:**
1. Vào Lark group → Settings → Bots
2. Thêm Custom Bot mới
3. Copy Webhook URL

#### b) User Mapping

Chỉnh sửa `src/config/user-mapping.ts` để map Jira users sang Lark Open IDs:

```typescript
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {
  'john.doe@company.com': 'ou_a1b2c3d4e5f6g7h8',
  'jane.smith@company.com': 'ou_x1y2z3a4b5c6d7e8',
  // Thêm tất cả thành viên team vào đây
};
```

**Cách lấy Lark Open ID:**

1. **Cách 1: Lark Admin Console**
   - Vào Admin Console → Tổ chức → Thành viên
   - Click vào user → Copy "Open ID"

2. **Cách 2: Dùng Lark API** (nếu có bot token)
   ```bash
   curl -X GET \
     'https://open.larksuite.com/open-apis/contact/v3/users/:user_id' \
     -H 'Authorization: Bearer YOUR_BOT_TOKEN'
   ```

3. **Cách 3: Yêu cầu users gửi tin nhắn**
   - Yêu cầu users gửi tin nhắn trong group
   - Bot có thể extract Open ID từ message events

### 3. Chạy Server

#### Development Mode

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

#### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

#### Sử dụng PM2 (Khuyến nghị cho production)

```bash
# Cài đặt PM2 globally
npm install -g pm2

# Build project
npm run build

# Start với PM2
pm2 start dist/index.js --name jira-lark-webhook

# Lưu cấu hình PM2
pm2 save

# Thiết lập tự động khởi động khi server reboot
pm2 startup
```

### 4. Test tích hợp

#### a) Kiểm tra Health

```bash
curl http://localhost:3000/health
```

Kết quả:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:00:00.000Z",
  "service": "jira-lark-webhook"
}
```

#### b) Test gửi tin nhắn Lark

```bash
curl http://localhost:3000/test
```

Bạn sẽ nhận được test message trong Lark group.

#### c) Test với Mock Jira Payload

```bash
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json
```

**Lưu ý**: Nhớ cập nhật email addresses trong test payloads để match với `user-mapping.ts`.

### 5. Cấu hình Jira Webhook

1. Vào Jira: **Settings → System → WebHooks**
2. Click **Create a WebHook**
3. Cấu hình:
   - **Name**: `Lark Notifications`
   - **URL**: `http://your-public-ip:3000/webhook/jira`
   - **Events**: 
     - ✅ Issue → created
     - ✅ Issue → updated
     - ✅ Comment → created
   - **JQL Filter** (tùy chọn): Thêm filter để giới hạn thông báo
4. Click **Create**
5. Test webhook bằng nút "Test" của Jira

## 📡 API Endpoints

### POST `/webhook/jira`
Nhận Jira webhook events

**Request**: Jira webhook payload (JSON)

**Response**: `200 OK` (luôn luôn, để tránh Jira retry)

### GET `/health`
Health check endpoint

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:00:00.000Z",
  "service": "jira-lark-webhook"
}
```

### GET `/test`
Gửi test message đến Lark

**Response**:
```json
{
  "success": true,
  "message": "Test message sent to Lark successfully"
}
```

## 📊 Ví dụ Thông báo

### 🎫 Issue mới được tạo

```
🎫 Ticket mới được tạo
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
📊 Status: To Do
🔖 Type: Bug
⚡ Priority: High

[Xem chi tiết →]
```

### 📊 Status thay đổi

```
📊 Trạng thái thay đổi
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
📊 To Do → In Progress

[Xem chi tiết →]
```

### 💬 Comment mới

```
💬 Comment mới
━━━━━━━━━━━━━━━━━━━━━
[PROJ-123] Fix login bug on mobile

📝 Reporter: @John Doe
👤 Assignee: @Jane Smith
💬 @Bob Wilson commented:
"Tôi đã tìm ra nguyên nhân, sẽ fix trong hôm nay"

[Xem chi tiết →]
```

## 🔧 Logic Thông báo

### Khi nào gửi thông báo?

Thông báo được gửi khi:

1. **Issue liên quan đến team member** (reporter HOẶC assignee có trong user mapping)
2. **VÀ** một trong các events sau xảy ra:
   - Issue mới được tạo
   - Status thay đổi
   - Assignee thay đổi
   - Comment mới được thêm (trừ self-comment)

### Quy tắc lọc

- ✅ **Team-based**: Chỉ notify nếu reporter HOẶC assignee có trong `user-mapping.ts`
- ✅ **Self-comment filter**: Không notify khi user tự comment vào issue của mình
- ✅ **Không filter priority**: Tất cả priorities (Low → Critical)
- ✅ **Không filter issue type**: Tất cả types (Bug, Task, Story, Epic, etc.)

## 🧪 Test với Mock Payloads

Sample payloads có sẵn trong thư mục `test-payloads/`:

```bash
# Test issue created
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/issue-created.json

# Test status changed
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/status-changed.json

# Test assignee changed
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/assignee-changed.json

# Test comment added
curl -X POST http://localhost:3000/webhook/jira \
  -H "Content-Type: application/json" \
  -d @test-payloads/comment-added.json
```

## 🛠️ Xử lý sự cố

### Vấn đề: Không nhận được thông báo

**Giải pháp:**
1. Kiểm tra cấu hình Jira webhook (Settings → System → WebHooks)
2. Xác nhận server đang chạy: `curl http://your-server:3000/health`
3. Kiểm tra server logs để tìm lỗi
4. Test với mock payload để tách biệt vấn đề
5. Xác nhận email trong `user-mapping.ts` khớp với Jira emails

### Vấn đề: Users không được @mention

**Giải pháp:**
1. Xác nhận Lark Open IDs trong `user-mapping.ts`
2. Kiểm tra Jira email addresses khớp chính xác
3. Test Lark integration: `curl http://your-server:3000/test`
4. Kiểm tra Lark bot có quyền mention users

### Vấn đề: Server crash hoặc lỗi

**Giải pháp:**
1. Kiểm tra Node.js version: `node --version` (phải v18+)
2. Xác nhận file `.env` tồn tại và chứa `WEBHOOK_URL`
3. Kiểm tra port 3000 available: `lsof -i :3000`
4. Xem server logs: `pm2 logs jira-lark-webhook` (nếu dùng PM2)

### Vấn đề: Jira webhook trả về lỗi

**Giải pháp:**
1. Đảm bảo server URL public accessible
2. Kiểm tra firewall cho phép incoming connections trên port 3000
3. Nếu test local, dùng ngrok: `ngrok http 3000`
4. Xác nhận webhook endpoint: `POST /webhook/jira`

## 📁 Cấu trúc Project

```
jira-lark-webhook/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── config/
│   │   ├── config.ts               # Environment configuration
│   │   └── user-mapping.ts         # Jira → Lark user mapping
│   ├── types/
│   │   ├── jira.types.ts           # Jira webhook types
│   │   └── lark.types.ts           # Lark message types
│   ├── services/
│   │   ├── jira.service.ts         # Jira event parser
│   │   └── lark.service.ts         # Lark message formatter
│   ├── controllers/
│   │   └── webhook.controller.ts   # Route handlers
│   └── utils/
│       └── logger.ts               # Logging utility
├── test-payloads/                  # Sample Jira webhooks
├── .env                            # Environment variables (không commit)
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README-VI.md                    # File này
```

## 🔒 Bảo mật

1. **Không commit file `.env`** - Chứa sensitive webhook URLs
2. **Dùng HTTPS trong production** - Mã hóa data
3. **Implement webhook signature verification** (tính năng tương lai)
4. **Rate limiting** - Ngăn chặn abuse (tính năng tương lai)
5. **Input validation** - Luôn validate Jira payloads
6. **Logging** - Giám sát hoạt động đáng ngờ

## 📚 Tài liệu tham khảo

- [Jira Webhooks Documentation](https://developer.atlassian.com/server/jira/platform/webhooks/)
- [Lark Bot Webhooks](https://open.larksuite.com/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)
- [Lark Message Card Format](https://open.larksuite.com/document/ukTMukTMukTM/uczM3QjL3MzN04yNzcDN)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🚀 Tính năng tương lai

- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] Database cho audit logs
- [ ] Retry queue cho failed Lark messages
- [ ] Web UI cho configuration
- [ ] Hỗ trợ nhiều Lark groups
- [ ] Custom message templates
- [ ] Jira project filtering
- [ ] Time-based notification rules

## 📄 License

ISC

---

**Version**: 1.0.0  
**Cập nhật lần cuối**: 2024-01-17
