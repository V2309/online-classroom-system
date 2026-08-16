# 🎓 Online Classroom System

> Nền tảng lớp học trực tuyến toàn diện — tích hợp video hội nghị, AI hỗ trợ học tập, quản lý bài tập, tài liệu và nhiều tính năng khác.

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tính năng chính](#-tính-năng-chính)
- [Tech Stack](#-tech-stack)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Biến môi trường](#-biến-môi-trường)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Luồng xác thực](#-luồng-xác-thực)

---

## 🔍 Tổng quan

**Online Classroom System** là một hệ thống quản lý lớp học trực tuyến đầy đủ chức năng, được xây dựng theo kiến trúc **monorepo** gồm 3 dịch vụ chính:

| Service | Mô tả | Port |
|---|---|---|
| `online-classroom-ui` | Frontend Next.js | `3000` |
| `online-classroom-backend` | REST API NestJS | `8081` |
| `rag-api` | AI / RAG Service FastAPI | `8000` |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                   Next.js 14 (App Router)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP / WebSocket
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
  ┌───────────────┐ ┌────────────┐ ┌──────────────────┐
  │  NestJS REST  │ │  Pusher    │ │   Stream.io       │
  │  API (:8081)  │ │ (Realtime) │ │  (Video Call)     │
  └───────┬───────┘ └────────────┘ └──────────────────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌──────────┐  ┌──────────────────┐
│PostgreSQL│  │  FastAPI RAG API │
│ (Prisma) │  │     (:8000)      │
└──────────┘  │  LangChain+FAISS │
              │  OpenAI / Gemini │
              └──────────────────┘
                      │
               ┌──────┴──────┐
               │             │
               ▼             ▼
          ┌────────┐   ┌──────────┐
          │ImageKit│   │Cloudflare│
          │(Images)│   │R2 (Files)│
          └────────┘   └──────────┘
```

---

## ✨ Tính năng chính

### 👨‍🏫 Quản lý Lớp học
- Tạo / tham gia lớp học qua mã mời hoặc yêu cầu tham gia
- Quản lý thành viên (học sinh, giáo viên)
- Bảng tin lớp học (newsfeed) — đăng bài, like, bình luận
- Quản lý nhóm trong lớp (group chat, bài tập nhóm)
- Lịch học & thời khóa biểu trực quan

### 📹 Video Hội nghị (Stream.io)
- Tổ chức buổi học / hội nghị trực tuyến thời gian thực
- Chia sẻ màn hình, bật/tắt mic và camera
- Phòng hội nghị riêng trong từng lớp

### 📝 Quản lý Bài tập
- Giáo viên tạo bài tập với hạn nộp, điểm số
- Học sinh nộp bài (tệp đính kèm)
- Chấm điểm và phản hồi trực tiếp
- Bảng điểm tổng hợp (export Excel)

### 📚 Khóa học & Tài liệu
- Tạo khóa học với nhiều bài giảng (video, PDF)
- Theo dõi tiến độ học tập
- Xem PDF/Word trực tiếp trong trình duyệt
- Upload tài liệu lên Cloudflare R2 / ImageKit

### 🎨 Bảng Vẽ Trực tuyến (Whiteboard)
- Bảng vẽ cộng tác thời gian thực (tldraw)
- Lưu và chia sẻ bản vẽ trong lớp học

### 💬 Chat Thời gian thực
- Chat riêng giữa các thành viên
- Chat nhóm trong lớp
- Thông báo đẩy qua Pusher

### 🤖 AI Tích hợp (RAG API)
- **Q&A thông minh**: Hỏi đáp dựa trên tài liệu đã tải lên (RAG)
- **Tạo Quiz tự động**: AI tự sinh câu hỏi trắc nghiệm từ nội dung bài học
- **Podcast Generator**: Chuyển đổi tài liệu thành audio podcast
- **Hybrid Search**: Kết hợp tìm kiếm vector (FAISS) + BM25
- **Hỗ trợ LLM**: OpenAI GPT, Google Gemini, Tavily Web Search

### 🔔 Thông báo
- Thông báo thời gian thực cho các hoạt động trong lớp
- Hệ thống email thông báo (Resend)

### 👑 Admin Dashboard
- Quản lý toàn bộ người dùng hệ thống
- Theo dõi thống kê, báo cáo
- Khóa / mở khóa tài khoản

---

## 🛠️ Tech Stack

### Frontend (`online-classroom-ui`)
| Công nghệ | Mục đích |
|---|---|
| **Next.js 14** (App Router) | Framework React |
| **TypeScript** | Type safety |
| **TailwindCSS v4** | Styling |
| **TanStack Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form validation |
| **Stream.io Video SDK** | Video hội nghị |
| **Pusher JS** | Realtime events |
| **tldraw** | Whiteboard |
| **Framer Motion** | Animations |
| **Recharts** | Charts & analytics |
| **React Big Calendar** | Lịch học |
| **Prisma Client** | Database access |
| **jose / JWT** | Token handling |

### Backend (`online-classroom-backend`)
| Công nghệ | Mục đích |
|---|---|
| **NestJS 11** | Node.js framework |
| **TypeScript** | Type safety |
| **Prisma 7** | ORM + Migration |
| **PostgreSQL** | Cơ sở dữ liệu |
| **Passport.js + JWT** | Xác thực |
| **Pusher** | Realtime notifications |
| **Stream.io Node SDK** | Video call tokens |
| **AWS SDK / Cloudflare R2** | File storage |
| **ImageKit** | Image optimization & CDN |
| **Resend** | Email transactional |
| **ExcelJS** | Export Excel |
| **bcryptjs** | Password hashing |

### AI Service (`rag-api`)
| Công nghệ | Mục đích |
|---|---|
| **FastAPI** | Python web framework |
| **LangChain** | LLM orchestration |
| **FAISS** | Vector store |
| **OpenAI** | LLM & embeddings |
| **Google Gemini** | Alternative LLM |
| **Tavily** | Web search |
| **PyMuPDF / python-docx** | Document parsing |
| **pydub** | Audio processing |
| **BM25** | Keyword search |

---

## 📁 Cấu trúc thư mục

```
online-classroom-system/
├── online-classroom-ui/          # Frontend Next.js
│   └── src/
│       ├── app/
│       │   ├── (auth)/           # Trang đăng nhập / đăng ký
│       │   │   ├── sign-in/
│       │   │   └── sign-up/
│       │   ├── (page)/           # Trang chính (yêu cầu đăng nhập)
│       │   │   ├── overview/     # Dashboard người dùng
│       │   │   ├── class/        # Danh sách & chi tiết lớp học
│       │   │   │   └── [id]/
│       │   │   │       ├── newsfeed/    # Bảng tin lớp
│       │   │   │       ├── homework/    # Bài tập
│       │   │   │       ├── documents/   # Tài liệu
│       │   │   │       ├── schedule/    # Lịch học
│       │   │   │       ├── member/      # Thành viên
│       │   │   │       ├── groups/      # Nhóm
│       │   │   │       ├── groupchat/   # Chat nhóm
│       │   │   │       ├── scoretable/  # Bảng điểm
│       │   │   │       ├── video/       # Video buổi học
│       │   │   │       └── (whiteboardpage)/ # Whiteboard
│       │   │   ├── chat/         # Chat cá nhân
│       │   │   ├── schedule/     # Lịch cá nhân
│       │   │   └── profile/      # Hồ sơ người dùng
│       │   ├── (fullpage)/       # Trang toàn màn hình (hội nghị)
│       │   └── (admin)/
│       │       └── dashboard/    # Admin dashboard
│       ├── components/           # UI Components dùng chung
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utilities, helpers
│       ├── providers/            # Context providers
│       ├── services/             # API service calls
│       ├── stores/               # Zustand stores
│       └── types/                # TypeScript types
│
├── online-classroom-backend/     # Backend NestJS
│   └── src/
│       ├── common/               # Decorators, Guards, Interceptors
│       ├── lib/
│       │   ├── database/         # Prisma module
│       │   ├── pusher/           # Pusher module
│       │   └── r2/               # Cloudflare R2 module
│       └── module/
│           ├── auth/             # Đăng nhập, đăng ký, JWT
│           ├── user/             # Quản lý người dùng
│           ├── class/            # Quản lý lớp học
│           ├── post/             # Bài đăng & bình luận
│           ├── homework/         # Bài tập
│           ├── course/           # Khóa học & bài giảng
│           ├── document/         # Tài liệu
│           ├── chat/             # Chat
│           ├── group/            # Nhóm
│           ├── notification/     # Thông báo
│           ├── schedule/         # Lịch học
│           ├── whiteboard/       # Bảng vẽ
│           ├── upload/           # Upload file
│           ├── realtime/         # WebSocket / Stream token
│           ├── mail/             # Email
│           └── ai/               # AI gateway (proxy to RAG API)
│
└── rag-api/                      # AI / RAG Service Python
    ├── pipelines/                # Luồng ingest & QA
    ├── ingestion/                # Đọc & làm sạch tài liệu
    ├── indexing/                 # Embedding & vector store
    ├── retrieval/                # Tìm kiếm, query transform
    ├── post_processing/          # Rerank & context compress
    ├── generation/               # LLM factory & prompts
    ├── quiz/                     # Tạo quiz tự động
    ├── index.py                  # FastAPI entry point
    └── config.py                 # Cấu hình RAG
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Python** >= 3.10
- **PostgreSQL** >= 15

### 1. Clone repository

```bash
git clone <repository-url>
cd online-classroom-system
```

---

### 2. Backend (NestJS)

```bash
cd online-classroom-backend

# Cài đặt dependencies
npm install

# Tạo file .env (xem phần Biến môi trường)
cp .env.example .env

# Chạy Prisma migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Khởi động development server
npm run start:dev
```

> Backend sẽ chạy tại: **http://localhost:8081**

---

### 3. Frontend (Next.js)

```bash
cd online-classroom-ui

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Khởi động development server
npm run dev
```

> Frontend sẽ chạy tại: **http://localhost:3000**

---

### 4. RAG API (FastAPI)

```bash
cd rag-api

# Tạo virtual environment
python -m venv venv

# Kích hoạt venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env

# Khởi động server
uvicorn index:app --reload --port 8000
```

> RAG API sẽ chạy tại: **http://localhost:8000**

---

## 🔐 Biến môi trường

### `online-classroom-backend/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/classroom_db"

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Stream.io (Video Call)
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Pusher (Realtime)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# ImageKit (Image CDN)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Cloudflare R2 (File Storage)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_account.r2.cloudflarestorage.com

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Port
PORT=8081
```

### `online-classroom-ui/.env`

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8081/api
NEXT_PUBLIC_RAG_API_URL=http://localhost:8000

# JWT (phải giống Backend)
JWT_SECRET_KEY=your_jwt_secret_key

# Stream.io
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key

# Pusher
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

### `rag-api/.env`

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Gemini
GOOGLE_API_KEY=your_google_api_key

# Tavily Web Search
TAVILY_API_KEY=your_tavily_api_key
```

---

## 📡 API Overview

Tất cả API backend có prefix `/api/`. Backend chạy tại port `8081`.

| Module | Method | Endpoint | Mô tả |
|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | Đăng ký tài khoản |
| | POST | `/api/auth/login` | Đăng nhập |
| | POST | `/api/auth/logout` | Đăng xuất |
| | POST | `/api/auth/refresh` | Làm mới token |
| **User** | GET | `/api/user/me` | Thông tin bản thân |
| | PATCH | `/api/user/:id` | Cập nhật thông tin |
| **Class** | GET | `/api/class` | Danh sách lớp học |
| | POST | `/api/class` | Tạo lớp học mới |
| | GET | `/api/class/:id` | Chi tiết lớp học |
| | POST | `/api/class/:id/join` | Tham gia lớp học |
| **Post** | GET | `/api/post/:classId` | Bài đăng trong lớp |
| | POST | `/api/post` | Tạo bài đăng mới |
| **Homework** | GET | `/api/homework/:classId` | Danh sách bài tập |
| | POST | `/api/homework` | Tạo bài tập |
| | POST | `/api/homework/:id/submit` | Nộp bài |
| **Course** | GET | `/api/course` | Danh sách khóa học |
| | POST | `/api/course` | Tạo khóa học |
| **Document** | GET | `/api/document/:classId` | Tài liệu lớp học |
| | POST | `/api/document` | Upload tài liệu |
| **Chat** | GET | `/api/chat` | Danh sách cuộc trò chuyện |
| | POST | `/api/chat/message` | Gửi tin nhắn |
| **Schedule** | GET | `/api/schedule/:classId` | Lịch học |
| | POST | `/api/schedule` | Tạo sự kiện lịch |
| **Notification** | GET | `/api/notification` | Thông báo của user |
| **Whiteboard** | GET | `/api/whiteboard/:classId` | Dữ liệu bảng vẽ |
| | PUT | `/api/whiteboard/:id` | Cập nhật bảng vẽ |
| **Upload** | POST | `/api/upload/image` | Upload ảnh (ImageKit) |
| | POST | `/api/upload/file` | Upload file (R2) |
| **Realtime** | GET | `/api/realtime/token` | Lấy Stream.io token |
| **AI** | POST | `/api/ai/ask` | Hỏi đáp AI (RAG) |
| | POST | `/api/ai/quiz` | Tạo quiz tự động |

---

## 🗄️ Database Schema

Hệ thống sử dụng **PostgreSQL** với **Prisma ORM**. Các entity chính:

```
User
 ├── Student (1-1)
 │    ├── Class[] (many-many)
 │    ├── Attendance[]
 │    ├── Result[]
 │    ├── HomeworkSubmission[]
 │    └── ClassGroupMember[]
 │
 └── Teacher (1-1)
      ├── Class[] (many-many)
      ├── Subject[]
      ├── Lesson[]
      ├── Homework[]
      └── File[]

Class
 ├── Post[]
 ├── Homework[]
 ├── Lesson[]
 ├── Schedule[]
 ├── Whiteboard[]
 ├── ClassGroup[]
 ├── Document[]
 └── ClassJoinRequest[]

Course
 ├── Section[]
 │    └── Video[]
 └── CourseView[]

Chat / Message
Notification
```

> Xem chi tiết schema tại [`online-classroom-backend/prisma/schema.prisma`](./online-classroom-backend/prisma/schema.prisma)

---

## 🔒 Luồng xác thực

Hệ thống sử dụng **JWT** lưu trong **HttpOnly Cookie**:

```
1. User POST /api/auth/login (email + password)
2. Backend xác thực → tạo Access Token (15m) + Refresh Token (7d)
3. Token được lưu trong HttpOnly Cookie ("session")
4. Next.js Middleware kiểm tra cookie tại mỗi request
5. Nếu token hết hạn → tự động gọi POST /api/auth/refresh
6. Nếu không refresh được → redirect về /sign-in
```

**Phân quyền:**
| Role | Mô tả |
|---|---|
| `student` | Học sinh — tham gia lớp, nộp bài, xem tài liệu |
| `teacher` | Giáo viên — tạo lớp, ra bài tập, chấm điểm |
| `admin` | Quản trị viên — truy cập `/dashboard`, quản lý hệ thống |

---

## 📦 Scripts hữu ích

### Backend
```bash
npm run start:dev      # Development (hot-reload)
npm run build          # Build production
npm run start:prod     # Chạy production
npm run db:migrate     # Chạy database migration
npm run db:studio      # Mở Prisma Studio (GUI)
npm run db:generate    # Generate Prisma client
npm run test           # Unit tests
npm run test:e2e       # E2E tests
```

### Frontend
```bash
npm run dev            # Development
npm run build          # Build production
npm run lint           # Lint code
npm run test           # Unit tests
```

### RAG API
```bash
uvicorn index:app --reload --port 8000   # Development
uvicorn index:app --port 8000            # Production
```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mô tả tính năng"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📄 License

Dự án này được phát triển cho mục đích học thuật.

---

<p align="center">Made with ❤️ by the Online Classroom Team</p>
