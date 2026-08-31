<div align="center">

# 🎓 Online Classroom System

**A full-featured online learning platform with video conferencing, AI-powered assistance, homework management, real-time collaboration, and more.**

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Subscription & Payment](#-subscription--payment)
- [Technologies & Tools](#-technologies--tools)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Authentication Flow](#-authentication-flow)
- [Scripts](#-scripts)


---

## 🔍 Overview

**Online Classroom System** is a comprehensive learning management system (LMS) built with a **monorepo** architecture consisting of 3 independent services:

| Service | Description | Port |
|---|---|---|
| `online-classroom-ui` | Next.js Frontend (App Router) | `3000` |
| `online-classroom-backend` | NestJS REST API | `8081` |
| `rag-api` | FastAPI AI / RAG Service | `8000` |

---

## 🏗️ System Architecture

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

## ✨ Features

### 👨‍🏫 Classroom Management
- Create / join classes via invite code or join request
- Member management (students, teachers)
- Class newsfeed — posts, likes, and comments
- Group management (group chat, group assignments)
- Visual class schedule & timetable

### 📹 Video Conferencing (Stream.io)
- Host live online classes and meetings in real time
- Screen sharing, mic and camera controls
- Dedicated conference rooms per class

### 📝 Homework Management
- Teachers create assignments with deadlines and grades
- Students submit work with file attachments
- Grading and direct feedback
- Score table with Excel export

### 📚 Courses & Documents
- Create courses with multiple lessons (video, PDF)
- Track learning progress per student
- View PDF/Word files directly in browser
- Upload documents to Cloudflare R2 / ImageKit

### 🎨 Collaborative Whiteboard (tldraw)
- Real-time collaborative drawing board
- Save and share whiteboards within a class

### 💬 Real-time Chat
- Direct messaging between members
- Group chat within each class
- Push notifications via Pusher

### 🤖 AI Integration & Smart Tools (RAG API)
- **Document Q&A (RAG)**: Chat with uploaded PDF documents using LangChain + vector search
- **Auto Quiz & Exam Extraction**: Automatically parse and extract multiple-choice questions from PDF / Word documents
- **Exam Shuffling & Export**: Randomize questions and answer choices for anti-cheat and export directly to PDF / DOCX
- **Essay Question Generator**: Generate customized essay questions, sample answers, and grading rubrics
- **Podcast Generator**: Convert document content into conversational audio podcasts
- **Multi-LLM Engine**: Support for OpenAI GPT, Google Gemini, and Tavily Web Search

### ✍️ Exam & Homework Management
- **Multiple Choice & Essay Exams**: Full support for both automatic grading (quizzes) and detailed manual grading with rubrics (essays)
- **Homework Assignment**: Teachers assign homework with deadlines, attachments, and maximum scores
- **Student Submissions**: Online submission with multiple file uploads and realtime countdown timer
- **Gradebook & Export**: Detailed score analytics, student progress tracking, and Excel export

### 🔐 Authentication & Presence
- **Google OAuth 2.0 Single Sign-On**: One-click Google login/signup with role selection (Teacher / Student)
- **JWT & Role-Based Access Control (RBAC)**: Secure authorization for Admin, Teacher, and Student roles
- **Real-time User Presence**: Live online/offline status tracking across classrooms and chat channels via Pusher

### 💬 Quick Contact & Live Support Widget
- **Speed Dial Contact Bubble**: Floating quick-access widget on the landing page with smooth expand/collapse animations
- **Multi-Channel Support**: Instant connection to Hotline call (`tel:`), Zalo chat (`zalo.me`), and Facebook Messenger (`m.me`)
- **Integrated Mini Live Chat**: Interactive customer service drawer with FAQ suggestions and auto-responder

### 🔔 Notifications
- Real-time notifications for all class activities
- Transactional email notifications (Resend)

### 👑 Admin Dashboard
- Manage all system users, classes, and roles
- View system-wide statistics, revenue, and active analytics
- Ban / unban user accounts and system configuration

---

## 💎 Subscription & Payment

The platform features a complete SaaS subscription tier model with **3 payment gateways** commonly used in Vietnam:

### 🌟 Subscription Tiers
| Tier | Pricing (Monthly / Yearly) | Key Privileges |
|---|---|---|
| **FREE** | 0 VND | Up to 5 classes, standard homework & quiz, interactive whiteboard |
| **PRO** | 1.000 VND / 10.000 VND | Unlimited classes & students, unlimited AI Quiz & Podcast generator, priority video rooms |
| **PREMIUM** | 2.000 VND / 20.000 VND | All Pro features, Cloudflare R2 high-speed storage, 24/7 dedicated support |

### 🚀 Payment Gateways & Security
- **VNPAY Sandbox**: HMAC-SHA512 checksum via official `vnpay` SDK. Supports VNPAY-QR, 40+ domestic ATM cards (NCB test card), and International Visa/MasterCard.
- **ZaloPay Sandbox**: HMAC-SHA256 checksum (App ID: 2553). Supports ZaloPay Wallet QR and Visa test simulation.
- **MoMo Sandbox**: HMAC-SHA256 OpenAPI v3 standard integration (`captureWallet`).
- **Instant Activation**: Automatic IPN Webhook & Return URL verification with transaction consistency, extending user subscription dates (+30 or +365 days) immediately.
- **UI Enhancements**: Dynamic illuminated avatar rings and VIP badges across Navigation and Header.


---

## 🛠️ Technologies & Tools

### Frontend

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=zustand&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![React Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework |
| **TypeScript** | Type safety |
| **TailwindCSS v4** | Styling |
| **TanStack Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form validation |
| **Stream.io Video SDK** | Video conferencing |
| **Pusher JS** | Real-time events |
| **tldraw** | Collaborative whiteboard |
| **Framer Motion** | Animations |
| **Recharts** | Charts & analytics |
| **React Big Calendar** | Schedule / calendar |
| **Prisma Client** | Database access |
| **jose / JWT** | Token handling |

---

### Backend

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Passport](https://img.shields.io/badge/Passport.js-34E27A?style=flat-square&logo=passport&logoColor=black)](https://www.passportjs.org/)
[![Pusher](https://img.shields.io/badge/Pusher-300D4F?style=flat-square&logo=pusher&logoColor=white)](https://pusher.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)

| Technology | Purpose |
|---|---|
| **NestJS 11** | Node.js framework |
| **TypeScript** | Type safety |
| **Prisma 7** | ORM + Migrations |
| **PostgreSQL** | Primary database |
| **Passport.js + JWT** | Authentication |
| **Pusher** | Real-time notifications |
| **Stream.io Node SDK** | Video call token generation |
| **Cloudflare R2 (AWS SDK)** | File storage |
| **ImageKit** | Image optimization & CDN |
| **Resend** | Transactional email |
| **ExcelJS** | Excel file export |
| **bcryptjs** | Password hashing |

---

### AI Service

[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://www.langchain.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

| Technology | Purpose |
|---|---|
| **FastAPI** | Python web framework |
| **LangChain** | LLM orchestration |
| **FAISS** | Vector similarity search |
| **OpenAI GPT** | Primary LLM & embeddings |
| **Google Gemini** | Alternative LLM |
| **Tavily** | Web search integration |
| **PyMuPDF / python-docx** | Document parsing (PDF, Word) |
| **pydub** | Audio processing (podcast) |
| **rank-bm25** | Keyword-based search |

---

### DevOps & Infrastructure

[![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)](https://git-scm.com/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://cloudflare.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-FF6400?style=flat-square&logo=imagekit&logoColor=white)](https://imagekit.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📁 Project Structure

```
online-classroom-system/
├── online-classroom-ui/              # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/               # Authentication pages
│       │   │   ├── sign-in/
│       │   │   └── sign-up/
│       │   ├── (page)/               # Protected pages
│       │   │   ├── overview/         # User dashboard
│       │   │   ├── class/            # Class list & detail
│       │   │   │   └── [id]/
│       │   │   │       ├── newsfeed/      # Class news feed
│       │   │   │       ├── homework/      # Assignments
│       │   │   │       ├── documents/     # Documents
│       │   │   │       ├── schedule/      # Class schedule
│       │   │   │       ├── member/        # Members
│       │   │   │       ├── groups/        # Groups
│       │   │   │       ├── groupchat/     # Group chat
│       │   │   │       ├── scoretable/    # Score board
│       │   │   │       ├── video/         # Recorded videos
│       │   │   │       └── (whiteboardpage)/ # Whiteboard
│       │   │   ├── chat/             # Direct messaging
│       │   │   ├── schedule/         # Personal schedule
│       │   │   └── profile/          # User profile
│       │   ├── (fullpage)/           # Full-screen pages (conference)
│       │   └── (admin)/
│       │       └── dashboard/        # Admin dashboard
│       ├── components/               # Shared UI components
│       ├── hooks/                    # Custom React hooks
│       ├── lib/                      # Utilities & helpers
│       ├── providers/                # Context providers
│       ├── services/                 # API service layer
│       ├── stores/                   # Zustand stores
│       └── types/                    # TypeScript types
│
├── online-classroom-backend/         # NestJS Backend
│   └── src/
│       ├── common/                   # Decorators, Guards, Interceptors
│       ├── lib/
│       │   ├── database/             # Prisma module
│       │   ├── pusher/               # Pusher module
│       │   └── r2/                   # Cloudflare R2 module
│       └── module/
│           ├── auth/                 # Login, Register, JWT
│           ├── user/                 # User management
│           ├── class/                # Class management
│           ├── post/                 # Posts & comments
│           ├── homework/             # Assignments
│           ├── course/               # Courses & lessons
│           ├── document/             # Documents
│           ├── chat/                 # Messaging
│           ├── group/                # Groups
│           ├── notification/         # Notifications
│           ├── schedule/             # Schedule
│           ├── whiteboard/           # Whiteboard
│           ├── upload/               # File upload
│           ├── realtime/             # WebSocket / Stream token
│           ├── mail/                 # Email service
│           └── ai/                   # AI gateway (proxy to RAG API)
│
└── rag-api/                          # FastAPI AI Service
    ├── pipelines/                    # Ingest & QA pipelines
    ├── ingestion/                    # Document loaders & chunkers
    ├── indexing/                     # Embedding & vector store
    ├── retrieval/                    # Search & query transform
    ├── post_processing/              # Reranker & context compressor
    ├── generation/                   # LLM factory & prompt templates
    ├── quiz/                         # Auto quiz generation
    ├── index.py                      # FastAPI entry point
    └── config.py                     # RAG configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Python** >= 3.10
- **PostgreSQL** >= 15

### 1. Clone the repository

```bash
git clone https://github.com/V2309/online-classroom-system.git
cd online-classroom-system
```

---

### 2. Backend (NestJS — Port 8081)

```bash
cd online-classroom-backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Run database migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start development server
npm run start:dev
```

> ✅ Backend runs at: **http://localhost:8081**

---

### 3. Frontend (Next.js — Port 3000)

```bash
cd online-classroom-ui

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start development server
npm run dev
```

> ✅ Frontend runs at: **http://localhost:3000**

---

### 4. RAG API (FastAPI — Port 8000)

```bash
cd rag-api

# Create virtual environment
python -m venv venv

# Activate venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env

# Start development server
uvicorn index:app --reload --port 8000
```

> ✅ RAG API runs at: **http://localhost:8000**

---

## 🔐 Environment Variables

### `online-classroom-backend/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/classroom_db"

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Stream.io (Video Conferencing)
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Pusher (Real-time)
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

# Google OAuth & Identity Services
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Payment Gateways (Sandbox)
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
ZALOPAY_KEY2=kLtgPl8HHhfvMuD2wKfgccY4YqZatOKd
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create

MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Server Port
PORT=8081

```

### `online-classroom-ui/.env`

```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8081/api
NEXT_PUBLIC_RAG_API_URL=http://localhost:8000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# JWT (must match Backend)
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

All backend API endpoints are prefixed with `/api/`. Backend runs on port `8081`.

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | POST | `/api/auth/signup` | Register new account |
| | POST | `/api/auth/login` | Login with email/phone & password |
| | POST | `/api/auth/google` | Login / Register with Google OAuth token & role |
| | POST | `/api/auth/logout` | Logout & clear session cookie |
| | POST | `/api/auth/refresh` | Refresh access token |
| | POST | `/api/auth/resend-verification` | Resend verification email |
| | GET/POST | `/api/auth/verify-email` | Verify email token |
| **User** | GET | `/api/user/me` | Get current user info |
| | PATCH | `/api/user/:id` | Update user profile |
| **Class** | GET | `/api/class` | Get class list |
| | POST | `/api/class` | Create new class |
| | GET | `/api/class/:id` | Get class details |
| | POST | `/api/class/:id/join` | Join a class |
| **Post** | GET | `/api/post/:classId` | Get class newsfeed |
| | POST | `/api/post` | Create a post |
| **Homework** | GET | `/api/homework/:classId` | Get assignments |
| | POST | `/api/homework` | Create assignment |
| | POST | `/api/homework/:id/submit` | Submit homework |
| **Course** | GET | `/api/course` | Get course list |
| | POST | `/api/course` | Create course |
| **Document** | GET | `/api/document/:classId` | Get class documents |
| | POST | `/api/document` | Upload document |
| **Chat** | GET | `/api/chat` | Get conversations |
| | POST | `/api/chat/message` | Send a message |
| **Schedule** | GET | `/api/schedule/:classId` | Get class schedule |
| | POST | `/api/schedule` | Create schedule event |
| **Notification** | GET | `/api/notification` | Get user notifications |
| **Whiteboard** | GET | `/api/whiteboard/:classId` | Get whiteboard data |
| | PUT | `/api/whiteboard/:id` | Update whiteboard |
| **Payment** | GET | `/api/payment/plans` | Get subscription plan tiers & pricing |
| | POST | `/api/payment/create-subscription` | Create payment order (VNPAY, ZaloPay, MoMo) |
| | GET/POST | `/api/payment/vnpay/callback` | VNPAY IPN webhook handler |
| | POST | `/api/payment/zalopay/callback` | ZaloPay IPN webhook handler |
| | POST | `/api/payment/momo/callback` | MoMo IPN webhook handler |
| | POST | `/api/payment/verify-return` | Verify browser redirect & auto-activate plan |
| | GET | `/api/payment/order-status/:orderId` | Check order status & user plan |
| **Upload** | POST | `/api/upload/image` | Upload image (ImageKit) |
| | POST | `/api/upload/file` | Upload file (R2) |
| **Realtime** | GET | `/api/realtime/token` | Get Stream.io token |
| **AI** | POST | `/api/ai/ask` | AI Q&A (RAG) |
| | POST | `/api/ai/quiz` | Generate quiz |
| | POST | `/api/ai/podcast` | Generate podcast |

---

## 🗄️ Database Schema

The system uses **PostgreSQL** with **Prisma ORM**.

```
User (plan: FREE | PRO | PREMIUM, planExpiresAt, googleId)
 ├── Student (1-1)
 │    ├── Class[] (many-many)
 │    ├── Attendance[]
 │    ├── Result[]
 │    ├── HomeworkSubmission[]
 │    └── ClassGroupMember[]
 │
 ├── Teacher (1-1)
 │    ├── Class[] (many-many)
 │    ├── Subject[]
 │    ├── Lesson[]
 │    ├── Homework[]
 │    └── File[]
 │
 ├── Order[] (1-n)
 │    └── Payment[] (1-n, provider: VNPAY | ZALOPAY | MOMO)
 │
 └── Subscription[] (1-n)


Class
 ├── Post[] (with Like[], Comment[])
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

Message / Chat
Notification
VerificationToken
```

> 📄 Full schema: [`online-classroom-backend/prisma/schema.prisma`](./online-classroom-backend/prisma/schema.prisma)

---

## 🔒 Authentication & Session Flow

The system supports both **Credentials Authentication** and **Google OAuth 2.0 Identity Services**, managed via a **BFF (Backend For Frontend) Cookie Session Architecture**:

### 1. Traditional Credentials Auth
1. Client submits email/phone and password to `POST /api/auth/login`.
2. Backend verifies credentials and issues `accessToken` (7 days) and `refreshToken` (30 days).
3. Frontend syncs the session via Next.js Route Handler `POST /api/auth/session` into an `HttpOnly`, `SameSite=Lax`, `Secure` cookie on the frontend domain.
4. Next.js Middleware and SSR validate this cookie on protected routes.

### 2. Google OAuth 2.0 Integration
```
User clicks "Đăng nhập / Đăng ký bằng Google"
        ↓
Google Identity Popup (OAuth 2.0 Token / ID Token)
        ↓
Frontend receives Google Token & sends to POST /api/auth/google
        ↓
Backend verifies token signature with Google Auth Library
        ↓
┌────────────────────────────────────────────────────────┐
│ User exists in Database (by googleId or email)?        │
└────────────────────────────────────────────────────────┘
       ↓ YES                                    ↓ NO
       ↓                                        ↓
Update avatar & emailVerified             Create User with selected role
       ↓                                  (Student or Teacher) + Profile
Issue JWT access & refresh tokens                ↓
       ↓                                  Issue JWT access & refresh tokens
       └──────────────────┬─────────────────────┘
                          ↓
Frontend stores 'session' cookie on Vercel domain (/api/auth/session)
                          ↓
Redirects user to role dashboard (/overview for student, /class for teacher)
```

**Roles & Permissions:**

| Role | Default Redirect | Description |
|---|---|---|
| `student` | `/overview` | Join classes, submit homework, view documents, AI chat |
| `teacher` | `/class` | Create classes, assign homework, grade submissions, manage courses |
| `admin` | `/dashboard` | Access admin analytics, manage all users, classes, and system settings |

---

## 🚀 Production Deployment

### 1. Frontend Deployment (Vercel)
- Deploy `online-classroom-ui` directly on **Vercel**.
- Configure Environment Variables on Vercel Dashboard:
  - `NEXT_PUBLIC_API_URL`: `https://your-backend.azurewebsites.net/api`
  - `JWT_SECRET_KEY`: Same JWT Secret Key as Backend.
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

### 2. Backend Deployment (Azure App Service)
- Deploy `online-classroom-backend` to **Azure App Service (Node.js 20 LTS Linux)**.
- Integrated automated CI/CD via GitHub Actions workflow (`.github/workflows/deploy-backend.yml`).
- Configure Application Settings in Azure Portal:
  - `DATABASE_URL`: PostgreSQL connection string.
  - `JWT_SECRET_KEY`: Secret string used for signing JWTs.
  - `FRONTEND_URL`: `https://docusonline.vercel.app`
  - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

---

## 📦 Scripts

### Backend
```bash
npm run start:dev      # Start development server (hot-reload)
npm run build          # Build for production
npm run start:prod     # Start production server
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio (database GUI)
npm run db:generate    # Generate Prisma client
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
```

### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run lint           # Lint source code
npm run test           # Run unit tests
```

### RAG API
```bash
uvicorn index:app --reload --port 8000   # Development
uvicorn index:app --port 8000            # Production
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your changes"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project was developed for academic purposes.

---

<div align="center">
  Made with ❤️ by the Online Classroom Team
</div>
