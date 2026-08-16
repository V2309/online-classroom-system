<div align="center">
  <br />
  <h1>🎓 Online Classroom — Frontend</h1>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/-TailwindCSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/-Zustand-443E38?style=for-the-badge&logo=zustand&logoColor=white" />
    <img src="https://img.shields.io/badge/-Stream.io-005FFF?style=for-the-badge&logo=stream&logoColor=white" />
    <img src="https://img.shields.io/badge/-Pusher-300D4F?style=for-the-badge&logo=pusher&logoColor=white" />
    <img src="https://img.shields.io/badge/-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  </div>

  <h3 align="center">Online Classroom System — Next.js Frontend</h3>

  <div align="center">
    A modern, full-featured classroom management UI built with Next.js 14 App Router —
    featuring real-time collaboration, video conferencing, AI-powered tools, and a warm "Terra" design system.
  </div>
</div>

---

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🗂️ [Project Structure](#project-structure)
5. 🤸 [Quick Start](#quick-start)
6. 📌 [Environment Variables](#environment-variables)
7. 🎨 [Design System](#design-system)
8. 📝 [Development Notes](#development-notes)

---

## <a name="introduction">✨ Introduction</a>

**Online Classroom UI** is the frontend application of the Online Classroom System, built with **Next.js 14 App Router** and **TypeScript**. It communicates with the **NestJS REST API** (port 8081) and the **FastAPI RAG service** (port 8000).

The application supports three distinct user roles — `student`, `teacher`, and `admin` — each with a tailored experience. Authentication is handled via JWT stored in an HttpOnly cookie, validated at every request through Next.js **Middleware**.

The design language follows the **"Terra — Rooted Warmth"** system: earthy tones, warm cream backgrounds, soft shapes, and serif typography (Literata headlines + Plus Jakarta Sans body).

---

## <a name="tech-stack">⚙️ Tech Stack</a>

| Technology | Purpose |
|---|---|
| **[Next.js 14](https://nextjs.org/)** (App Router) | React framework with file-based routing, SSR, and middleware |
| **[React 18](https://react.dev/)** | UI rendering with concurrent features |
| **[TypeScript](https://www.typescriptlang.org/)** | Full static typing across all layers |
| **[TailwindCSS v4](https://tailwindcss.com/)** | Utility-first styling with custom Terra design tokens |
| **[TanStack Query v5](https://tanstack.com/query)** | Server state management, caching, and data synchronization |
| **[Zustand v5](https://zustand-demo.pmnd.rs/)** | Lightweight global client state (user, class, AI, exam, chat) |
| **[React Hook Form + Zod](https://react-hook-form.com/)** | Type-safe form handling and validation |
| **[Stream.io Video SDK](https://getstream.io/video/)** | Real-time video conferencing rooms |
| **[Pusher JS](https://pusher.com/)** | Real-time notifications and messaging events |
| **[tldraw](https://tldraw.dev/)** | Collaborative infinite canvas whiteboard |
| **[Framer Motion](https://www.framer.com/motion/)** | Declarative animations and transitions |
| **[Recharts](https://recharts.org/)** | Responsive charts for score analytics |
| **[React Big Calendar](https://github.com/jquense/react-big-calendar)** | Full-featured schedule and timetable view |
| **[Prisma Client](https://www.prisma.io/)** | Type-safe database queries (used in Next.js API routes) |
| **[jose](https://github.com/panva/jose)** | JWT verification in Next.js Middleware (Edge runtime) |
| **[React PDF Viewer](https://react-pdf-viewer.dev/)** | In-browser PDF rendering |
| **[docx-preview](https://github.com/VolodymyrBaydalka/docxjs)** | In-browser Word document preview |
| **[react-dropzone](https://react-dropzone.js.org/)** | Drag-and-drop file uploads |
| **[ImageKit JS](https://imagekit.io/docs/)** | Client-side image upload with CDN optimization |
| **[react-markdown + remark-gfm](https://github.com/remarkjs/react-markdown)** | Render AI Markdown responses |
| **[ExcelJS + file-saver](https://github.com/exceljs/exceljs)** | Export score tables to `.xlsx` |
| **[Plus Jakarta Sans + Literata](https://fonts.google.com/)** | Google Fonts — body and heading typefaces |

---

## <a name="features">🔋 Features</a>

🔐 **Authentication & Authorization**
Custom JWT auth via HttpOnly cookie. Next.js Middleware protects all routes, validates tokens on every request, and redirects unauthenticated users to `/sign-in`. Role-based access control: `student`, `teacher`, `admin`. Admin routes (e.g. `/dashboard`) are guarded at the middleware level.

🏫 **Classroom Management**
Browse and manage classes from a unified list view. Join classes via invite code or submit a join request. Class detail pages include a tabbed layout: Newsfeed, Homework, Documents, Schedule, Members, Groups, Whiteboard, Score Table, and Video.

📰 **Class Newsfeed**
Real-time class timeline with infinite scroll. Teachers and students can post announcements with file attachments. Posts support likes and nested comments powered by Pusher for live updates.

📝 **Homework & Assessments**
Teachers create assignments with deadlines, max scores, file attachments, and optional online test mode. Students submit work with file uploads. The grading interface lets teachers review submissions, assign scores, and give feedback. Score charts visualize student performance over time.

📚 **Courses & Video Lessons**
Structured course pages with sections and video lessons. Tracks per-user view progress. Supports lazy-loaded YouTube embeds and hosted video playback.

📄 **Documents & File Viewer**
Upload and browse class documents (PDF, Word, Excel, images). Render PDF files inline via React PDF Viewer and Word documents via docx-preview — no download required.

📅 **Schedule & Calendar**
Full monthly/weekly class schedule using React Big Calendar. Teachers create schedule events; students see upcoming lessons in the sidebar widget. Personal schedule page shows all events across all classes.

👥 **Groups & Group Chat**
Create and manage student groups within a class. Dedicated group chat rooms with real-time messaging via Pusher. Drag-and-drop group member management.

💬 **Direct Chat**
One-on-one messaging between any two users. Real-time message delivery with read receipts. Chat history is persisted and paginated.

📹 **Video Conferencing (Stream.io)**
Instant video call rooms within each class. Setup screen for camera/mic preview before joining. In-call controls: mute, camera toggle, screen share, participant list, end call.

🎨 **Collaborative Whiteboard (tldraw)**
Infinite canvas with drawing tools, shapes, text, and images. Whiteboard state is saved per class and restored on next open.

🤖 **AI Assistant (UniAI)**
In-app AI panel powered by the RAG service:
- **Document Q&A**: Upload PDFs and ask questions about the content.
- **Auto Quiz**: Extract and shuffle multiple-choice questions from uploaded files.
- **Essay Generator**: Create essay questions from documents or any topic.
- **Podcast**: Convert documents into an audio podcast dialogue.

🔔 **Real-time Notifications**
Pusher-powered toast notifications for class events (new post, homework assigned, submission graded, join request approved). Notification bell with unread count in the header.

👑 **Admin Dashboard**
Overview of all users in the system with statistics. Manage and ban/unban accounts. Role assignment and activity monitoring.

---

## <a name="project-structure">🗂️ Project Structure</a>

```
src/
├── middleware.ts                  # JWT cookie validation & role-based route protection
│
├── app/
│   ├── layout.tsx                 # Root layout — Google Fonts, ToastContainer
│   ├── page.tsx                   # Landing page
│   │
│   ├── (auth)/                    # Public auth pages
│   │   ├── sign-in/               # Login form
│   │   └── sign-up/               # Registration form
│   │
│   ├── (page)/                    # Protected main app (sidebar layout)
│   │   ├── layout.tsx             # App shell — AppSidebar + AppHeader
│   │   ├── overview/              # User dashboard & upcoming schedule
│   │   ├── chat/                  # Direct messaging
│   │   ├── schedule/              # Personal calendar view
│   │   ├── profile/               # User profile edit
│   │   └── class/
│   │       ├── page.tsx           # Class list
│   │       └── [id]/
│   │           ├── layout.tsx     # Class shell — MenuClass tabs
│   │           ├── newsfeed/      # Class timeline with posts & comments
│   │           ├── homework/      # Assignment list + submit/grade views
│   │           ├── documents/     # File browser and viewer
│   │           ├── schedule/      # Class-specific schedule
│   │           ├── member/        # Member list & join requests
│   │           ├── groups/        # Student group management
│   │           ├── groupchat/     # Group chat room
│   │           ├── scoretable/    # Score board + analytics charts
│   │           ├── video/         # Recorded lesson videos
│   │           └── (whiteboardpage)/ # Full-screen collaborative whiteboard
│   │
│   ├── (fullpage)/                # Full-screen pages (no sidebar)
│   │   └── meeting/[id]/         # Stream.io video conference room
│   │
│   ├── (admin)/                   # Admin-only section
│   │   └── dashboard/             # User management & statistics
│   │
│   └── api/                       # Next.js API routes
│       ├── auth/                  # Session cookie management
│       ├── pusher/auth            # Pusher channel authentication
│       └── upload/                # ImageKit upload proxy
│
├── components/                    # 90+ reusable UI components
│   ├── AppHeader.tsx              # Top navigation bar + notification bell
│   ├── AppSidebar.tsx             # Collapsible side navigation
│   ├── Navigation.tsx             # Class tab menu
│   ├── Post.tsx                   # Newsfeed post card
│   ├── HomeworkDetailClient.tsx   # Student homework submission view
│   ├── HomeworkGradingClient.tsx  # Teacher grading interface
│   ├── ScorePageClient.tsx        # Score table with export
│   ├── CollaborativeWhiteboard.tsx # tldraw whiteboard
│   ├── MeetingRoom.tsx            # Stream.io video room
│   ├── ChatGroup.tsx              # Group chat interface
│   ├── UniAI.tsx                  # AI assistant panel
│   ├── BigCalendar.tsx            # Full schedule calendar
│   ├── PDFViewer.tsx              # In-browser PDF renderer
│   ├── VideoPageClient.tsx        # Video lesson player
│   ├── Profile.tsx                # User profile page
│   ├── Notification.tsx           # Notification bell dropdown
│   ├── PusherListener.tsx         # Global Pusher event listener
│   ├── ui/                        # Base UI primitives (Button, Input, Dialog…)
│   ├── forms/                     # Feature-specific form components
│   ├── modals/                    # Dialog and modal components
│   ├── admin/                     # Admin dashboard components
│   ├── calendar/                  # Calendar sub-components
│   └── dashboard/                 # Overview page widgets
│
├── hooks/                         # Custom React hooks
│   ├── useGetCalls.ts             # Fetch Stream.io call list
│   ├── useGetCallById.ts          # Fetch a single call by ID
│   ├── useHomeworkForm.ts         # Homework create/edit form logic
│   ├── useHomeworkSession.ts      # Online exam session state machine
│   ├── usePresence.ts             # Online presence via Pusher
│   └── useUser.ts                 # Access current user from context
│
├── providers/                     # React context providers
│   ├── QueryProvider.tsx          # TanStack Query client
│   ├── StreamClientProvider.tsx   # Stream.io video SDK client
│   └── UserProvider.tsx           # Global user context
│
├── services/                      # API service layer (fetch wrappers)
│   └── ai.service.ts              # RAG API calls (chat, quiz, essay, podcast)
│
├── stores/                        # Zustand global stores
│   ├── useUserStore.ts            # Current user state
│   ├── useClassStore.ts           # Active class context
│   ├── useAiStore.ts              # AI assistant panel state
│   ├── useExamStore.ts            # Online exam session state
│   └── useChatStore.ts            # Chat conversation state
│
├── lib/                           # Utilities and helpers
│   └── actions/                   # Next.js server actions
│
└── types/                         # Shared TypeScript type definitions
```

---

## <a name="quick-start">🤸 Quick Start</a>

### Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher
- The **NestJS backend** running at `http://localhost:8081`
- The **FastAPI RAG service** running at `http://localhost:8000` (optional — for AI features)

### Installation

**1. Navigate to the ui directory**

```bash
cd online-classroom-system/online-classroom-ui
```

**2. Install dependencies**

```bash
npm install
```

> Prisma Client is auto-generated via the `postinstall` script.

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in your values (see [Environment Variables](#environment-variables) below).

**4. Start the development server**

```bash
npm run dev
```

The app will be available at **`http://localhost:3000`**.

### Useful Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run Jest in watch mode |

---

## <a name="environment-variables">📌 Environment Variables</a>

Create a `.env` file (copy from `.env.example`):

```env
# ── Backend API ───────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8081/api
NEXT_PUBLIC_RAG_API_URL=http://localhost:8000

# ── JWT (must match backend JWT_SECRET_KEY exactly) ───
JWT_SECRET_KEY=your_jwt_secret_key

# ── Stream.io (Video Conferencing) ───────────────────
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key

# ── Pusher (Real-time Events) ────────────────────────
NEXT_PUBLIC_PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

# ── ImageKit (Image CDN) ─────────────────────────────
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key

# ── Cloudflare R2 (File Storage) ─────────────────────
R2_PUBLIC_URL=https://your-public-r2-url.com
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | NestJS backend base URL |
| `NEXT_PUBLIC_RAG_API_URL` | ✅ | FastAPI RAG service base URL |
| `JWT_SECRET_KEY` | ✅ | Must match backend — used by Middleware to verify cookies |
| `NEXT_PUBLIC_STREAM_API_KEY` | ✅ | Stream.io API key for video rooms |
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ | Pusher public key for real-time events |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ | Pusher cluster region (e.g. `ap1`) |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | ✅ | ImageKit public key (client-side uploads) |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | ✅ | ImageKit CDN base URL |
| `IMAGEKIT_PRIVATE_KEY` | ✅ | ImageKit private key (used in API routes) |
| `R2_PUBLIC_URL` | ✅ | Cloudflare R2 public base URL for file links |

> 🔒 Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep non-prefixed secrets server-side only.

---

## <a name="design-system">🎨 Design System — Terra</a>

The UI follows the **"Terra — Rooted Warmth"** design language: calm, grounded, and human.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#4a7c59` | Forest green — actions, links, active states |
| **Background** | `#faf6f0` | Warm cream — page and card backgrounds |
| **Tertiary** | `#705c30` | Warm amber — highlights, badges, accents |

- **Philosophy**: Earthy and desaturated — no neon or pure-hue colors. Every neutral should carry a warm yellow/green undertone.

### Typography

| Role | Font | Notes |
|---|---|---|
| **Headlines** | Literata (serif) | Warm personality, loaded from Google Fonts |
| **Body / Labels** | Plus Jakarta Sans | Friendly, rounded letterforms |

- Line height 1.6+ for body — comfortable, unhurried reading.

### Elevation & Shape

- **Shadows**: Very soft only — `0 4px 20px rgba(46, 50, 48, 0.06)`. Prefer tonal layering over shadows.
- **Border-radius**: 12px on buttons and cards; 8px on inputs.
- **Borders**: Low-opacity outline variants only when separation is needed.

### Component Rules

- **Buttons**: Primary = solid green fill; Secondary = cream bg + green text + thin border.
- **Cards**: Warm cream fill, 24px padding, 12px border-radius. No harsh borders.
- **Inputs**: Cream background, rounded, soft green focus ring.
- Large touch targets, generous spacing — every element should feel breathable.

---

## <a name="development-notes">📝 Development Notes</a>

- **Routing**: All main pages live under `src/app/(page)/` (protected) and `src/app/(auth)/` (public). Use Next.js App Router conventions — `layout.tsx` for shared shells, `page.tsx` for leaf routes.
- **Authentication**: The JWT cookie (`session`) is verified by `middleware.ts` on every request using `jose` (Edge-compatible). Never use `jsonwebtoken` in middleware.
- **Data Fetching**: Prefer TanStack Query for server data. Use `useQuery` for reads and `useMutation` for writes — always invalidate relevant query keys after mutations.
- **Global State**: Use Zustand stores only for true global client state (current user, active class, AI panel). Avoid putting server-fetched data in Zustand.
- **Real-time**: Pusher events are consumed globally via `PusherListener.tsx` mounted in the layout. Trigger query invalidations or store updates on received events.
- **Providers**: `QueryProvider`, `StreamClientProvider`, and `UserProvider` are mounted once in the `(page)/layout.tsx`.
- **Image Uploads**: Route through the `/api/upload` Next.js API route, which calls ImageKit with the private key. Never expose `IMAGEKIT_PRIVATE_KEY` to the client.
- **Build**: The production build uses `cross-env NODE_OPTIONS="--max-old-space-size=8192"` to prevent OOM crashes on large bundles.

---

<div align="center">
  <p>Built with ❤️ using Next.js 14 & TailwindCSS</p>
</div>
