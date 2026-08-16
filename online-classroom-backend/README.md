<div align="center">
  <br />
  <h1>🎓 Online Classroom — Backend API</h1>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
    <img src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
    <img src="https://img.shields.io/badge/-Pusher-300D4F?style=for-the-badge&logo=pusher&logoColor=white" />
    <img src="https://img.shields.io/badge/-Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
    <img src="https://img.shields.io/badge/-ImageKit-FF6400?style=for-the-badge&logo=imagekit&logoColor=white" />
  </div>

  <h3 align="center">Online Classroom System — NestJS REST API</h3>

  <div align="center">
    A modular, production-ready backend for managing online classrooms, homework, courses, real-time collaboration, video conferencing, and AI-powered features.
  </div>
</div>

---

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🗂️ [Project Structure](#project-structure)
5. 🤸 [Quick Start](#quick-start)
6. 🌐 [API Overview](#api-overview)
7. 📌 [Environment Variables](#environment-variables)
8. 📝 [Development Notes](#development-notes)

---

## <a name="introduction">✨ Introduction</a>

**Online Classroom Backend** is a fully-featured REST API built with **NestJS 11** and the **Express adapter**. It serves as the backbone of the Online Classroom System platform, providing:

- Secure user authentication via **JWT** stored in **HttpOnly Cookies**
- Full classroom, course, and homework management
- Real-time notifications and chat powered by **Pusher**
- Video conferencing token generation via **Stream.io**
- File uploads to **Cloudflare R2** and **ImageKit CDN**
- AI gateway proxying requests to the **FastAPI RAG service**
- Transactional email delivery via **Resend**
- Type-safe database access via **Prisma** + **PostgreSQL**
- Standardized API responses through a global **TransformInterceptor**

---

## <a name="tech-stack">⚙️ Tech Stack</a>

| Technology | Purpose |
|---|---|
| **[NestJS 11](https://nestjs.com/)** | Progressive Node.js framework — modular, DI-first, TypeScript-native |
| **[TypeScript](https://www.typescriptlang.org/)** | Full static typing across all layers |
| **[Prisma 7](https://www.prisma.io/)** | Next-gen ORM with auto-migrations and type-safe queries |
| **[PostgreSQL](https://www.postgresql.org/)** | Primary relational database |
| **[Passport.js + JWT](https://www.passportjs.org/)** | JWT authentication with HttpOnly cookie strategy |
| **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** | Secure password hashing |
| **[Pusher](https://pusher.com/)** | Real-time push notifications and events |
| **[Stream.io Node SDK](https://getstream.io/)** | Video call token generation for live sessions |
| **[Cloudflare R2 (AWS SDK)](https://www.cloudflare.com/products/r2/)** | Scalable object storage for documents and files |
| **[ImageKit](https://imagekit.io/)** | Image optimization, transformation, and CDN delivery |
| **[Resend](https://resend.com/)** | Transactional email API |
| **[ExcelJS](https://github.com/exceljs/exceljs)** | Generate and export `.xlsx` score sheets |
| **[class-validator](https://github.com/typestack/class-validator)** | DTO validation with decorators |
| **[class-transformer](https://github.com/typestack/class-transformer)** | Request/response serialization and transformation |
| **[cookie-parser](https://github.com/expressjs/cookie-parser)** | Parse and manage cookies on incoming requests |

---

## <a name="features">🔋 Features</a>

🔐 **Authentication (`/api/auth/*`)**
Custom JWT-based auth with Access Token (15 min) and Refresh Token (7 days), both stored as HttpOnly cookies. Supports register, login, logout, and token refresh. Passwords are hashed with bcryptjs.

👤 **User Management (`/api/user/*`)**
Retrieve and update user profiles. Role-based access control across three roles: `student`, `teacher`, and `admin`.

🏫 **Class Management (`/api/class/*`)**
Full CRUD for classes. Students can join via invite code or send join requests. Teachers manage members, approve requests, and configure class settings.

📝 **Posts & Newsfeed (`/api/post/*`)**
Class newsfeed with posts, likes, and comments. Teachers and students can interact within a shared class timeline.

📚 **Homework & Submissions (`/api/homework/*`)**
Teachers create assignments with deadlines and max scores. Students submit work with file attachments. Teachers grade submissions and provide feedback. Score tables are exportable to Excel.

🎓 **Courses & Lessons (`/api/course/*`)**
Structured course content with sections and video lessons. Tracks per-user view progress.

📄 **Documents (`/api/document/*`)**
Upload and manage class documents (PDF, Word). Stored on Cloudflare R2, accessible directly in browser.

💬 **Chat (`/api/chat/*`)**
One-on-one and group messaging. Messages delivered in real time via Pusher channels.

👥 **Groups (`/api/group/*`)**
Create and manage student groups within a class for collaborative work and group chat.

🔔 **Notifications (`/api/notification/*`)**
Real-time notifications for key class events (new post, homework assigned, submission graded). Delivered via Pusher.

📅 **Schedule (`/api/schedule/*`)**
Create and manage class schedule events. Supports recurring lessons and one-off sessions.

🎨 **Whiteboard (`/api/whiteboard/*`)**
Persist and retrieve collaborative whiteboard state (tldraw) per class session.

📤 **File Upload (`/api/upload/*`)**
Upload images to ImageKit (with automatic optimization) and files to Cloudflare R2 (with presigned URL generation).

📡 **Realtime / Video (`/api/realtime/*`)**
Generates Stream.io user tokens for joining live video conference rooms within a class.

🤖 **AI Gateway (`/api/ai/*`)**
Proxies AI requests to the FastAPI RAG service. Supports document-based Q&A, automatic quiz generation, and podcast creation from lesson content.

📧 **Mail (`/api/mail/*`)**
Sends transactional emails for account verification, notifications, and class invitations using Resend.

---

## <a name="project-structure">🗂️ Project Structure</a>

```
src/
├── app.module.ts              # Root module — imports all feature & lib modules
├── main.ts                    # Bootstrap: cookie-parser, ValidationPipe, CORS, global prefix
│
├── common/                    # Shared cross-cutting concerns
│   ├── decorators/            # Custom decorators (e.g. @CurrentUser)
│   ├── filters/               # Exception filters (e.g. HttpExceptionFilter)
│   ├── guards/                # Auth & role guards (JwtAuthGuard, RolesGuard)
│   └── interceptors/          # TransformInterceptor — standardizes all responses
│
├── lib/                       # Infrastructure modules (@Global)
│   ├── database/
│   │   ├── prisma.module.ts   # Global Prisma module
│   │   └── prisma.service.ts  # Prisma client singleton
│   ├── pusher/
│   │   └── pusher.module.ts   # Pusher client (real-time events)
│   └── r2/
│       └── r2.module.ts       # Cloudflare R2 (AWS SDK) client
│
└── module/                    # Feature modules
    ├── auth/                  # Register, Login, Logout, Refresh
    ├── user/                  # User profile CRUD
    ├── class/                 # Class management, join requests, members
    ├── post/                  # Newsfeed — posts, likes, comments
    ├── homework/              # Assignments, submissions, grading
    ├── course/                # Courses, sections, video lessons
    ├── document/              # Class documents
    ├── chat/                  # Messaging (DM + group)
    ├── group/                 # Student groups within a class
    ├── notification/          # Real-time notifications
    ├── schedule/              # Class schedule events
    ├── whiteboard/            # Whiteboard state (tldraw)
    ├── upload/                # Image (ImageKit) & file (R2) uploads
    ├── realtime/              # Stream.io token generation
    ├── mail/                  # Transactional email (Resend)
    └── ai/                    # AI gateway → FastAPI RAG service
        └── dto/
            ├── chat-request.dto.ts
            ├── generate-essay.dto.ts
            ├── podcast-request.dto.ts
            ├── shuffle-quiz.dto.ts
            └── download-quiz.dto.ts
```

---

## <a name="quick-start">🤸 Quick Start</a>

### Prerequisites

Make sure you have the following installed:

- **[Node.js](https://nodejs.org/)** v20 or higher
- **[npm](https://www.npmjs.com/)** v10 or higher
- **[PostgreSQL](https://www.postgresql.org/)** — running locally or via a cloud provider (Neon, Supabase, Railway)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/V2309/online-classroom-system.git
cd online-classroom-system/online-classroom-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in your real values (see [Environment Variables](#environment-variables) below).

**4. Run database migrations**

```bash
npm run db:migrate
```

**5. Generate Prisma client**

```bash
npm run db:generate
```

**6. Start the development server**

```bash
npm run start:dev
```

The API will be available at **`http://localhost:8081`**.

### Useful Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:prod` | Start compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:format` | Format Prisma schema |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format with Prettier |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run end-to-end tests |

---

## <a name="api-overview">🌐 API Overview</a>

All endpoints are prefixed with `/api/`. The server runs on port **8081** by default.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new account |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT cookie |
| `POST` | `/api/auth/logout` | ✅ | Logout and clear cookie |
| `POST` | `/api/auth/refresh` | ✅ | Refresh access token |
| `GET` | `/api/user/me` | ✅ | Get current user profile |
| `PATCH` | `/api/user/:id` | ✅ | Update user profile |
| `GET` | `/api/class` | ✅ | Get user's classes |
| `POST` | `/api/class` | ✅ | Create a new class |
| `GET` | `/api/class/:id` | ✅ | Get class details |
| `POST` | `/api/class/:id/join` | ✅ | Join a class |
| `GET` | `/api/post/:classId` | ✅ | Get class newsfeed |
| `POST` | `/api/post` | ✅ | Create a post |
| `GET` | `/api/homework/:classId` | ✅ | Get class assignments |
| `POST` | `/api/homework` | ✅ (teacher) | Create an assignment |
| `POST` | `/api/homework/:id/submit` | ✅ (student) | Submit homework |
| `GET` | `/api/course` | ✅ | Get all courses |
| `POST` | `/api/course` | ✅ (teacher) | Create a course |
| `GET` | `/api/document/:classId` | ✅ | Get class documents |
| `POST` | `/api/document` | ✅ | Upload a document |
| `GET` | `/api/chat` | ✅ | Get conversations |
| `POST` | `/api/chat/message` | ✅ | Send a message |
| `GET` | `/api/schedule/:classId` | ✅ | Get class schedule |
| `POST` | `/api/schedule` | ✅ (teacher) | Create a schedule event |
| `GET` | `/api/notification` | ✅ | Get user notifications |
| `GET` | `/api/whiteboard/:classId` | ✅ | Get whiteboard data |
| `PUT` | `/api/whiteboard/:id` | ✅ | Save whiteboard state |
| `POST` | `/api/upload/image` | ✅ | Upload image to ImageKit |
| `POST` | `/api/upload/file` | ✅ | Upload file to Cloudflare R2 |
| `GET` | `/api/realtime/token` | ✅ | Get Stream.io video token |
| `POST` | `/api/ai/ask` | ✅ | AI document Q&A (RAG) |
| `POST` | `/api/ai/quiz` | ✅ | Generate quiz from content |
| `POST` | `/api/ai/podcast` | ✅ | Generate podcast from document |

> ✅ = Requires valid JWT session cookie &nbsp;|&nbsp; ❌ = Public route

---

## <a name="environment-variables">📌 Environment Variables</a>

Create a `.env` file at the project root (copy from `.env.example`):

```env
# Server
PORT=8081
FRONTEND_URL="http://localhost:3000"

# JWT Authentication
JWT_SECRET_KEY="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/classroom_db"

# Stream.io (Video Conferencing)
STREAM_API_KEY="your-stream-api-key"
STREAM_API_SECRET="your-stream-api-secret"

# Pusher (Real-time Events)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"

# ImageKit (Image CDN)
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"

# Cloudflare R2 (File Storage)
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-bucket-name"
R2_ENDPOINT="https://your_account_id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://your-public-r2-url.com"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# AI / RAG Service
RAG_API_URL="http://localhost:8000"
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | HTTP port the server listens on (default: 8081) |
| `FRONTEND_URL` | ✅ | Frontend origin allowed by CORS |
| `JWT_SECRET_KEY` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `STREAM_API_KEY` | ✅ | Stream.io API key for video tokens |
| `STREAM_API_SECRET` | ✅ | Stream.io API secret |
| `PUSHER_APP_ID` | ✅ | Pusher application ID |
| `PUSHER_KEY` | ✅ | Pusher public key |
| `PUSHER_SECRET` | ✅ | Pusher secret key |
| `PUSHER_CLUSTER` | ✅ | Pusher server cluster region |
| `IMAGEKIT_PUBLIC_KEY` | ✅ | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | ✅ | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | ✅ | ImageKit CDN base URL |
| `R2_ACCESS_KEY_ID` | ✅ | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | ✅ | R2 bucket name |
| `R2_ENDPOINT` | ✅ | R2 S3-compatible endpoint |
| `RESEND_API_KEY` | ✅ | Resend transactional email API key |
| `RAG_API_URL` | ✅ | Base URL of the FastAPI RAG service |

---

## <a name="development-notes">📝 Development Notes</a>

- All feature modules live under `src/module/<name>/` — each follows NestJS modular pattern (module / controller / service / dto)
- Infrastructure modules (`PrismaModule`, `PusherModule`, `R2Module`) are `@Global()` — imported once in `AppModule`, available everywhere
- Never instantiate services directly — always use NestJS constructor injection
- DTOs use `class-validator` decorators for automatic request validation via the global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`)
- All API responses are normalized by the global `TransformInterceptor` to the shape: `{ statusCode, message, data }`
- JWT tokens are stored in HttpOnly cookies — never exposed to JavaScript on the client
- Use `nest g module` / `nest g service` / `nest g controller` for generating new components

---

<div align="center">
  <p>Built with ❤️ using NestJS 11</p>
</div>
