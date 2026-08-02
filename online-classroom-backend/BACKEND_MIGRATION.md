# Kế hoạch Migration Backend: Next.js Fullstack → NestJS API
### Dự án: `V2309/school_project` (nền tảng lớp học "DoCus")

> Tài liệu này được viết dựa trên việc đọc trực tiếp source code thật của repo (clone `master`), không phải hướng dẫn chung chung. Phạm vi: **chỉ phần Backend** theo yêu cầu — không đi sâu vào Frontend UI, nhưng có mô tả tối thiểu API Client contract để Next.js gọi được NestJS.

---

## 0. Bối cảnh thực tế của repo

Repo có **2 phần backend khác nhau**, cần phân biệt rõ:

| Thư mục | Là gì | Xử lý trong migration này |
|---|---|---|
| `next-dashboard-ui/` | Next.js 14 App Router **fullstack** (UI + Server Actions + API Routes + Prisma trực tiếp) | **Tách business logic + DB access ra NestJS** (nội dung chính của tài liệu) |
| `backend/` (root) | Microservice Python **FastAPI** riêng biệt (`index.py`, `agent_core.py`, `podcast_generator.py`) dùng LangChain/Gemini để chấm bài tự luận bằng AI, sinh câu hỏi, tạo podcast. Gọi qua biến `NEXT_PUBLIC_FLASK_API_URL` | **Giữ nguyên, không migrate.** NestJS sẽ đóng vai trò gateway gọi sang service này qua HTTP khi cần (xem mục 5.9) |

Vì vậy "NestJS Backend" trong tài liệu này = phần thay thế cho `next-dashboard-ui/src/lib/actions/*` + `next-dashboard-ui/src/app/api/**/route.ts` + `next-dashboard-ui/prisma`.

---

## 1. Bảng phân tích công nghệ hiện tại

| Thành phần | Công nghệ hiện tại | Vị trí trong source | Giữ lại | Di chuyển sang NestJS | Thay đổi |
|---|---|---|---|---|---|
| Framework fullstack | Next.js 14.2.5 (App Router) | `next-dashboard-ui/` | ✅ (chỉ còn Frontend) | — | Bỏ Server Actions truy cập DB, Route Handlers gọi DB |
| Ngôn ngữ | TypeScript 5.8 | toàn repo | ✅ | ✅ (NestJS cũng TS) | — |
| Database | PostgreSQL | `datasource db` trong `prisma/schema.prisma` | — | ✅ (di chuyển ra chạy cạnh Nest) | Không đổi engine |
| ORM | Prisma 6.8 (`@prisma/client`) | `prisma/schema.prisma`, `src/lib/prisma.ts` | — | ✅ toàn bộ `prisma/` folder | Không đổi schema, chỉ đổi nơi chạy `PrismaClient` |
| Authentication | JWT tự viết bằng `jose` (không dùng Clerk/NextAuth dù có trong `package.json` — đây là dependency chết, không thấy sử dụng thực tế), cookie `session`, hash bằng `bcryptjs` | `src/lib/auth.ts`, `src/lib/actions/auth.action.ts`, `src/middleware.ts` | — | ✅ | Chuyển từ Server Action sang `AuthModule` + `JwtStrategy` (passport-jwt) |
| Authorization / RBAC | Kiểm tra thủ công `user.role` (`enum UserRole { admin, teacher, student }`) rải rác trong từng action/route + `checkClassAccess()` cho quyền theo lớp | `src/lib/class-access.ts` + inline trong ~30 file | — | ✅ | Chuyển thành `RolesGuard` + `@Roles()` decorator + `ClassAccessGuard` dùng chung |
| API Routes | 19 file `route.ts` (Route Handlers) | `src/app/api/**` | — | ✅ | Chuyển thành Controllers |
| Server Actions | 12 file, ~50 hàm `"use server"` — đây là nơi chứa **phần lớn business logic thật** | `src/lib/actions/*.ts` | — | ✅ | Chuyển thành Service methods, expose qua Controller mới (vì Server Action không thể gọi trực tiếp từ nơi khác ngoài Next.js) |
| Validation | Zod, nhưng chỉ dùng cho một phần form (`src/lib/formValidationSchema.tsx`), nhiều action **không có validate input** | `src/lib/formValidationSchema.tsx` | Giữ zod cho form phía FE | ✅ chuyển sang `class-validator` DTO | Bổ sung validate còn thiếu (lỗ hổng hiện tại) |
| File upload | **Kép**: AWS S3 (tài liệu/homework, `src/lib/s3.ts`, dùng SDK v2 cũ) + ImageKit (avatar, ảnh lớp học, `src/lib/imagekit.ts`) | `src/lib/s3.ts`, `src/lib/imagekit.ts`, `src/app/api/upload*/route.ts` | — | ✅ | Gộp vào `FilesModule`/`UploadModule`, đề xuất chuẩn hoá 1 storage strategy (xem mục 5.7) |
| Realtime chat/presence | Pusher (`src/lib/pusher-server.ts`, `src/app/api/pusher/auth/route.ts`) | | — | ✅ (auth endpoint) | `PusherModule` cấp token xác thực channel |
| Video call | Stream Video SDK (`@stream-io/node-sdk`) — sinh token phía server | `src/lib/actions/stream.action.ts` | — | ✅ | `StreamModule.tokenProvider()` |
| Email | Resend (gửi email xác minh) | `src/lib/actions/auth.action.ts` (`sendVerificationEmail`) | — | ✅ | `MailModule` |
| AI features | Python FastAPI riêng (RAG, sinh câu hỏi tự luận, podcast) | `backend/*.py` | ✅ giữ nguyên microservice | NestJS chỉ **proxy/gateway** | Không viết lại logic AI |
| State management (FE) | TanStack Query | `src/providers/QueryProvider.tsx` | ✅ Frontend | — | Đổi base URL từ Server Action sang gọi REST API |
| Background jobs | **Không có** (không thấy queue/cron nào) | — | — | — | Nếu cần (vd. tự động đóng bài tập hết hạn) → đề xuất thêm `@nestjs/schedule` hoặc BullMQ khi migrate, không có sẵn để "giữ" |
| Cache | **Không có** (không có Redis) | — | — | — | Đề xuất thêm Redis cache cho dashboard stats (mục 12) |
| Deployment hiện tại | `backend/vercel.json` (Python trên Vercel); Next.js chưa thấy cấu hình Docker/CI | `backend/vercel.json` | — | Viết mới Docker cho Nest | Thêm `docker-compose.yml` (mục 16) |

---

## 2. Kiến trúc hiện tại (Next.js Fullstack)

```
Browser
  │
  ▼
Next.js Middleware (src/middleware.ts)
  → đọc cookie "session", verify JWT bằng jose, check role cho /dashboard
  │
  ▼
┌─────────────────────────────┬──────────────────────────────┐
│ Server Components/Pages     │ Route Handlers (API Routes)  │
│ gọi trực tiếp Server Actions│ src/app/api/**/route.ts      │
└─────────────┬───────────────┴───────────────┬───────────────┘
              ▼                                ▼
   src/lib/actions/*.ts ("use server")   NextRequest/NextResponse
   - actions.ts (homework builder)       - homework grade/submit/save
   - auth.action.ts (login/signup/email) - files, upload, pusher/auth
   - chat.action.ts                      - posts/comments
   - class.action.ts                     - notifications, user
   - dashboard.action.ts
   - file.action.ts (course/folder/docs)
   - group.actions.ts
   - post.action.ts
   - schedule.action.ts (lịch học/họp)
   - stream.action.ts (video token)
   - user.action.ts
   - whiteboard.action.ts
              │
              ▼
       src/lib/prisma.ts (PrismaClient singleton)
              │
              ▼
         PostgreSQL (35+ model trong schema.prisma)
              │
    ┌─────────┼──────────┬───────────┬───────────┬───────────┐
    ▼         ▼          ▼           ▼           ▼           ▼
   S3      ImageKit    Pusher      Stream       Resend    Python AI
(tài liệu) (ảnh)      (chat rt)  (video call)  (email)   (FastAPI riêng)
```

**Vị trí xử lý cụ thể (đọc trực tiếp từ code):**

| Trách nhiệm | File |
|---|---|
| Business logic chính | `src/lib/actions/*.ts` (12 file) |
| Truy cập database | Rải trong toàn bộ `src/lib/actions/*.ts` + `src/app/api/**/route.ts` (đều gọi `prisma` trực tiếp — **không có Repository Pattern**, không tách data access) |
| Authentication | `src/lib/auth.ts` (`getCurrentUser()` verify JWT từ cookie), `src/lib/actions/auth.action.ts` (`loginAction`, `logoutAction`, email verify), `src/middleware.ts` (chặn route chưa login) |
| Authorization | `src/lib/class-access.ts` (`checkClassAccess`) + kiểm tra `user.role !== "teacher"` lặp lại thủ công trong gần như mọi action (không dùng chung 1 guard) |
| API endpoint | 19 file `route.ts` dưới `src/app/api/` (danh sách đầy đủ ở mục 6) |
| Logic **nên** chuyển sang NestJS | Toàn bộ 2 nhóm trên (actions + api routes), vì đây chính là "backend" bị trộn lẫn vào Next.js |

---

## 3. Kiến trúc NestJS mới

```
┌─────────────────────────────┐
│        Next.js (FE)         │
│  Pages / Components / Hooks │
│  TanStack Query + api-client│
└──────────────┬───────────────┘
               │ HTTPS REST (Bearer/Cookie JWT)
               ▼
┌─────────────────────────────────────────┐
│                NestJS API                 │
│  Controller → Service → Repository/Prisma │
│  Guard (JwtAuthGuard, RolesGuard,          │
│         ClassAccessGuard)                  │
│  Pipe (ValidationPipe + class-validator)   │
│  Interceptor (Transform, Logging)          │
│  Filter (HttpExceptionFilter)              │
└───────┬───────────┬───────────┬───────────┘
        │            │           │
        ▼            ▼           ▼
   PostgreSQL   S3 / ImageKit  Pusher / Stream / Resend
        │
        ▼
  (gateway call) → Python AI microservice (FastAPI, giữ nguyên)
```

Trách nhiệm:
- **Next.js**: chỉ còn render UI (Server/Client Components), gọi NestJS qua `api-client`, không còn Server Action nào chạm Prisma trực tiếp.
- **NestJS**: toàn bộ business logic, DB access, auth, authorization, file upload, realtime auth token, gọi ra AI service.
- **Database**: 1 instance PostgreSQL duy nhất, chỉ NestJS được kết nối.
- **Authentication/Authorization**: hoàn toàn trong `AuthModule` + Guards của NestJS; Next.js chỉ lưu access token (cookie `httpOnly`) và đính kèm khi gọi API.

---

## 4. Cấu trúc thư mục NestJS đề xuất (bám theo domain thật của project)

```
backend-nest/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts     # thay cho getCurrentUser()
│   │   │   └── roles.decorator.ts            # @Roles('teacher','admin')
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── class-access.guard.ts         # thay cho checkClassAccess()
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/                            # ValidationPipe global, không cần file riêng
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── env.validation.ts                 # validate .env bằng Joi/class-validator
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts                  # dùng chung prisma/schema.prisma đã có
│   │
│   ├── modules/
│   │   ├── auth/                # login, signup, verify-email, JWT
│   │   ├── users/                # profile, avatar, change password (user.action.ts)
│   │   ├── classes/              # tạo/sửa/xoá lớp, join/leave, join-request (class.action.ts)
│   │   ├── grades/               # createGrade (nằm trong class.action.ts nhưng tách entity Grade)
│   │   ├── homework/             # actions.ts + api/homework/**
│   │   │   ├── questions/        # Question, QuestionAnswer
│   │   │   └── submissions/      # HomeworkSubmission, grading
│   │   ├── courses/              # Course, Chapter, Video, Folder (file.action.ts)
│   │   ├── documents/            # File, FileView (tài liệu upload rời, khác course)
│   │   ├── posts/                # Feed: Post, Like, Comment, SavedPosts (post.action.ts)
│   │   ├── chat/                 # Message, pin/recall (chat.action.ts)
│   │   ├── groups/                # ClassGroup, ClassGroupMember (group.actions.ts)
│   │   ├── schedule/              # Event, Attendance, meeting (schedule.action.ts)
│   │   ├── whiteboard/            # Whiteboard state (whiteboard.action.ts)
│   │   ├── notifications/         # Notification
│   │   ├── dashboard/             # thống kê admin (dashboard.action.ts)
│   │   ├── upload/                # S3 + ImageKit thống nhất
│   │   ├── realtime/
│   │   │   ├── pusher/            # cấp auth token cho Pusher channel
│   │   │   └── stream/            # cấp token Stream Video
│   │   ├── mail/                  # Resend email xác minh
│   │   
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/                        # copy nguyên từ next-dashboard-ui/prisma
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── .env
├── Dockerfile
└── package.json
```

**Vì sao chia module như trên chứ không rập khuôn?** Vì thực tế `class.action.ts`, `file.action.ts`, `schedule.action.ts` mỗi file đang gộp nhiều domain (VD `file.action.ts` xử lý cả `Course`, `Folder`, `Video` — 3 entity khác nhau). Khi sang NestJS nên **tách theo entity/domain thật**, không giữ nguyên ranh giới file cũ, để tránh "God Service".

---

## 5. Mapping chi tiết Next.js → NestJS (theo từng domain)

### 5.1 Auth (`src/lib/actions/auth.action.ts`, `src/lib/auth.ts`, `src/app/api/signup/route.ts`, `src/middleware.ts`)

| Next.js hiện tại | Vào | Ra | NestJS mới |
|---|---|---|---|
| `POST /api/signup` (route.ts, dùng `new PrismaClient()` riêng — **bug**: tạo instance mới mỗi request thay vì singleton) | username, class_name, schoolname, birthday, address, email, phone, role, password | User + Student/Teacher (transaction) | `AuthController.signup()` → `AuthService.signup()` dùng `PrismaService` chung |
| `loginAction(formData)` — tìm user theo email/phone, `bcrypt.compare`, ký JWT 1 ngày bằng `jose`, set cookie `session` httpOnly | email, password | cookie session | `AuthController.login()` → `AuthService.login()`, dùng `@nestjs/jwt` + `passport-jwt`, trả về `{ access_token }`, FE lưu cookie httpOnly qua Next.js API route trung gian hoặc NestJS tự set-cookie |
| `logoutAction()` | — | xoá cookie | `AuthController.logout()` |
| `getCurrentUser()` — verify JWT từ cookie, query lại User | cookie | User | `JwtStrategy.validate()` + `@CurrentUser()` decorator |
| `sendVerificationEmail()` — tạo token random 32 byte, lưu `VerificationToken`, gửi email qua Resend | — | email | `AuthService.sendVerificationEmail()` trong `MailModule` |
| `verifyEmailToken(token)` | token | cập nhật `isEmailVerified` | `AuthController.verifyEmail()` |
| `src/middleware.ts` — check role `admin` cho path `/dashboard` | — | redirect | Next.js middleware **giữ lại ở FE chỉ để redirect UI**; nhưng **API thật sự phải được bảo vệ lại bằng `RolesGuard` ở NestJS** (hiện tại middleware chỉ bảo vệ trang, không bảo vệ API — lỗ hổng cần vá khi migrate) |

### 5.2 Users (`src/lib/actions/user.action.ts`)

| Hàm hiện tại | NestJS |
|---|---|
| `updateUserProfile()` | `UsersController.updateProfile()` → `UsersService` |
| `uploadAvatar(formData)` | `UsersController.uploadAvatar()` dùng `FileInterceptor` → `UploadService` (ImageKit) |
| `changePassword()` | `UsersController.changePassword()` (verify old password bằng bcrypt trước khi update) |

### 5.3 Classes (`src/lib/actions/class.action.ts` — 22KB, nhiều nhất)

| Hàm hiện tại | NestJS Controller/Service |
|---|---|
| `createClass`, `updateClass`, `updateClassWithDetails` | `ClassesController` POST/PATCH `/classes` |
| `createGrade` | `GradesController` (tách khỏi Class vì là entity riêng `Grade`) |
| `softDeleteClass`, `restoreClass`, `deleteClass` | `DELETE /classes/:id`, `POST /classes/:id/restore` |
| `joinClassAction`, `leaveClassAction` | `POST /classes/:code/join`, `POST /classes/:id/leave` |
| `getStudentClasses`, `getTeacherClasses`, `getDeletedClasses` | `GET /classes?role=&includeDeleted=` |
| `approveJoinRequest`, `rejectJoinRequest`, `approveAllRequests`, `rejectAllRequests` | `ClassJoinRequestsController` (tách vì có entity `ClassJoinRequest` riêng) |
| Kiểm tra quyền lặp lại `teacher.id === class.supervisorId` | thay bằng `ClassAccessGuard` (dựa trên `checkClassAccess()` cũ) |

### 5.4 Homework & Questions (`src/lib/actions/actions.ts`, `src/app/api/homework/**`)

| Endpoint / Action hiện tại | Method | NestJS mới |
|---|---|---|
| `createHomeworkWithQuestions` | Server Action | `POST /api/homework` |
| `createHomeworkFromExtractedQuestions`, `createHomeworkFromEssayQuestions` (import từ AI service) | Server Action | `POST /api/homework/from-extracted`, `POST /api/homework/from-essay` — gọi `AiGatewayService` để lấy câu hỏi trích xuất từ Python service rồi lưu DB |
| `getHomeworkById`, `src/app/api/homework/detail/route.ts` | GET | `GET /api/homework/:id` |
| `updateHomeworkWithQuestions`, `updateHomeworkSettings` | Server Action | `PATCH /api/homework/:id`, `PATCH /api/homework/:id/settings` |
| `src/app/api/homework/[id]/save/route.ts` | POST | `POST /api/homework/:id/submissions/draft` |
| `src/app/api/homework/[id]/submit/route.ts` | POST | `POST /api/homework/:id/submissions` |
| `src/app/api/homework/[id]/grade/route.ts` — nhận `submissionId, grade, feedback, questionGrades`, merge JSON `content` thủ công (logic khá phức tạp, nhiều `JSON.parse` thủ công trên field `content: String`) | POST | `POST /api/homework/:id/submissions/:submissionId/grade` → `HomeworkGradingService`. **Đề xuất**: cân nhắc đổi `HomeworkSubmission.content` từ `String` sang `Json` trong Prisma để bỏ `JSON.parse`/`JSON.stringify` thủ công (giảm rủi ro lỗi) |
| `src/app/api/homework/[id]/download/route.ts`, `.../export/route.ts` | GET | `GET /api/homework/:id/download`, `/export` |
| `src/app/api/homework/submissions/route.ts`, `.../submissions/count/route.ts` | GET | `GET /api/homework/:id/submissions`, `/submissions/count` |

### 5.5 Courses / Folders / Files (`src/lib/actions/file.action.ts`, `src/app/api/files/**`)

| Hàm hiện tại | NestJS |
|---|---|
| `deleteFile`, `createFolder`, `updateFolder`, `deleteFolder` | `DocumentsController` (entity `File`, `Folder`) |
| `createCourse`, `updateCourse`, `deleteCourse`, `moveCourseToFolder` | `CoursesController` (entity `Course`, `Chapter`, `Video`) |
| `src/app/api/files/route.ts`, `src/app/api/files/[docId]/view/route.ts` (có `FileView` để track lượt xem) | GET | `GET /api/documents`, `GET /api/documents/:id/view` (ghi `FileView`) |
| `deleteFromS3` trong `s3.ts` (SDK v2 `aws-sdk`, không phải v3) | — | `UploadService.deleteFile()` — **đề xuất nâng cấp lên `@aws-sdk/client-s3` v3** khi viết lại vì SDK v2 đã deprecated |

### 5.6 Feed / Posts (`src/lib/actions/post.action.ts`, `src/app/api/posts/**`)

| Hàm | NestJS |
|---|---|
| `addPostToClass` | `POST /api/posts` |
| `likePost` | `POST /api/posts/:id/like` |
| `addComment`, `getPostComments` | `POST /api/posts/:id/comments`, `GET /api/posts/:id/comments` |
| `updatePost`, `deletePost` | `PATCH /api/posts/:id`, `DELETE /api/posts/:id` |
| `src/app/api/posts/[postId]/comments/route.ts` | trùng với action trên → hợp nhất, chỉ giữ 1 nguồn sự thật trong Nest |

### 5.7 Chat (`src/lib/actions/chat.action.ts`, `src/app/api/chat/route.ts`)

| Hàm | NestJS |
|---|---|
| `sendMessage`, `deleteMessage`, `recallMessage`, `pinMessage`, `unpinMessage`, `getPinnedMessages` | `ChatController` — gọi Prisma lưu `Message`, sau đó publish sự kiện qua `PusherService.trigger()` để realtime tới client (giữ nguyên cơ chế Pusher, chỉ chuyển nơi gọi) |

### 5.8 Realtime & Video (`src/lib/pusher-server.ts`, `src/app/api/pusher/auth/route.ts`, `src/lib/actions/stream.action.ts`)

| Hiện tại | NestJS |
|---|---|
| `POST /api/pusher/auth` — xác thực socket + presence/private channel | `PusherController.authenticate()` trong `RealtimeModule` |
| `tokenProvider()` (Stream video token, hết hạn 1h) | `StreamController.getToken()` |

### 5.9 AI Gateway (kết nối sang Python FastAPI hiện tại)

Không migrate logic AI, nhưng NestJS cần 1 module gọi sang service Python (địa chỉ hiện là `NEXT_PUBLIC_FLASK_API_URL`, đổi tên biến vì không còn là "public" phía FE nữa):

```ts
// src/modules/ai-gateway/ai-gateway.service.ts
@Injectable()
export class AiGatewayService {
  private readonly baseUrl = this.config.get<string>('AI_SERVICE_URL');
  constructor(private readonly config: ConfigService, private readonly http: HttpService) {}

  async extractQuestionsFromFile(file: Express.Multer.File) {
    const form = new FormData();
    form.append('file', file.buffer, file.originalname);
    const { data } = await firstValueFrom(this.http.post(`${this.baseUrl}/extract-questions`, form));
    return data;
  }
}
```

### 5.10 Các module còn lại

| File hiện tại | NestJS module |
|---|---|
| `group.actions.ts` (createGroup, updateGroupMembers, deleteGroup, getClassGroups, updateGroup, setGroupLeader) | `GroupsModule` |
| `schedule.action.ts` (createSchedule, createMeetingSchedule, update/delete single hoặc recurrence, getTeacherSchedules, getStudentSchedules, checkRecurrenceGroup, getUpcomingMeeting) | `ScheduleModule` (entity `Event`, `Attendance`) |
| `whiteboard.action.ts` (getWhiteboardState, saveWhiteboardState) | `WhiteboardModule` |
| `dashboard.action.ts` (getDashboardStats, getOnlineUsersCount, getUserGrowthData, getClassActivityData, getRecentActivity) | `DashboardModule` — chỉ role `admin`; nên thêm cache (mục 12) vì đây là các query tổng hợp nặng |
| `src/app/api/notifications/route.ts` | `NotificationsModule` |
| `src/app/api/user/route.ts`, `src/app/api/user/classes/route.ts` | gộp vào `UsersModule` / `ClassesModule` |
| `src/app/api/upload-temp/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/upload/class-image/route.ts` | `UploadModule` |

---

## 6. Danh sách đầy đủ API Routes hiện tại (để đối chiếu khi migrate, không bỏ sót)

```
src/app/api/chat/route.ts
src/app/api/files/[docId]/view/route.ts
src/app/api/files/route.ts
src/app/api/homework/[id]/download/route.ts
src/app/api/homework/[id]/export/route.ts
src/app/api/homework/[id]/grade/route.ts
src/app/api/homework/[id]/save/route.ts
src/app/api/homework/[id]/submit/route.ts
src/app/api/homework/detail/route.ts
src/app/api/homework/submissions/count/route.ts
src/app/api/homework/submissions/route.ts
src/app/api/notifications/route.ts
src/app/api/posts/[postId]/comments/route.ts
src/app/api/posts/route.ts
src/app/api/pusher/auth/route.ts
src/app/api/signup/route.ts
src/app/api/upload-temp/route.ts
src/app/api/upload/class-image/route.ts
src/app/api/upload/route.ts
src/app/api/user/classes/route.ts
src/app/api/user/route.ts
```

---

## 7. Thiết kế REST API mới (versioned `/api/v1`)

Mẫu chuẩn hoá — mọi endpoint áp dụng cùng convention:

| Domain | Method | Endpoint | Auth | Role |
|---|---|---|---|---|
| Auth | POST | `/api/auth/signup` | ❌ | — |
| Auth | POST | `/api/auth/login` | ❌ | — |
| Auth | POST | `/api/auth/logout` | ✅ | any |
| Auth | POST | `/api/auth/send-verification` | ✅ | any |
| Auth | POST | `/api/auth/verify-email` | ❌ (token trong body) | — |
| Classes | POST | `/api/classes` | ✅ | teacher |
| Classes | GET | `/api/classes` | ✅ | teacher/student |
| Classes | PATCH | `/api/classes/:id` | ✅ | teacher (owner) |
| Classes | DELETE | `/api/classes/:id` | ✅ | teacher (owner) |
| Classes | POST | `/api/classes/:code/join` | ✅ | student |
| Classes | POST | `/api/classes/:id/leave` | ✅ | student |
| Classes | POST | `/api/classes/join-requests/:id/approve` | ✅ | teacher (owner) |
| Homework | POST | `/api/homework` | ✅ | teacher |
| Homework | GET | `/api/homework/:id` | ✅ | teacher/student (có quyền) |
| Homework | POST | `/api/homework/:id/submissions` | ✅ | student |
| Homework | POST | `/api/homework/:id/submissions/:sid/grade` | ✅ | teacher (owner) |
| Courses | POST/GET/PATCH/DELETE | `/api/courses` | ✅ | teacher |
| Posts | POST/GET/PATCH/DELETE | `/api/posts` | ✅ | teacher/student |
| Chat | POST | `/api/chat/messages` | ✅ | teacher/student |
| Upload | POST | `/api/upload/documents`, `/api/upload/avatar`, `/api/upload/class-image` | ✅ | any (role tuỳ endpoint) |
| Realtime | POST | `/api/realtime/pusher/auth` | ✅ | any |
| Realtime | GET | `/api/realtime/stream/token` | ✅ | any |
| Dashboard | GET | `/api/dashboard/*` | ✅ | admin |

Ví dụ cụ thể — `POST /api/classes`:

```
Authorization: Bearer <access_token>

Request:
{
  "name": "Lớp 10A1",
  "capacity": 40,
  "gradeLevel": "10"
}

Response 201:
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 12,
    "class_code": "X7K2P9",
    "name": "Lớp 10A1",
    "createdAt": "2026-07-22T03:00:00.000Z"
  }
}
```

---

## 8. Authentication & Authorization

### 8.1 Luồng mới (giữ nguyên concept JWT + cookie đã có, chỉ chuyển nơi xử lý)

```
User
 ↓
Next.js Login Page (form)
 ↓
POST /api/auth/login  (NestJS)
 ↓
AuthController → AuthService
 ↓
Tìm User theo email/phone (Prisma) → so khớp bcrypt
 ↓
Ký Access Token JWT (payload: {sub, username, role}, hạn 15p) bằng @nestjs/jwt
 ↓
Ký Refresh Token (hạn 7 ngày) — MỚI so với hiện tại (hiện tại chỉ có 1 token 1 ngày, không có refresh)
 ↓
Set-Cookie: session=<access_token>; HttpOnly; Secure; SameSite=Lax
Set-Cookie: refresh=<refresh_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh
```

> **Ghi chú quan trọng**: Code hiện tại **chỉ có access token 1 ngày, không có refresh token** → khi hết hạn user phải đăng nhập lại hoàn toàn. Đây là điểm nên cải thiện khi viết lại ở NestJS (thêm `RefreshTokenGuard` + endpoint `/auth/refresh`), không bắt buộc nhưng khuyến nghị vì chi phí thêm không lớn.

### 8.2 Code mẫu

```ts
// auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.session, // giữ tên cookie "session" như hiện tại để không phải đổi FE nhiều
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, email: true, role: true, img: true, isEmailVerified: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

```ts
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return roles.includes(user?.role);
  }
}
```

```ts
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```ts
// auth/auth.service.ts (login) — port trực tiếp từ loginAction()
async login(dto: LoginDto) {
  const user = await this.prisma.user.findFirst({
    where: { OR: [{ email: dto.email }, { phone: dto.email }] },
  });
  if (!user) throw new UnauthorizedException('Tài khoản không tồn tại.');
  if (user.isBanned) throw new ForbiddenException('Tài khoản đã bị khoá.');
  const isMatch = await compare(dto.password, user.password);
  if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng.');

  const accessToken = await this.jwt.signAsync(
    { sub: user.id, username: user.username, role: user.role },
    { expiresIn: '15m' },
  );
  return { accessToken, role: user.role };
}
```

### 8.3 Authorization theo lớp học (`ClassAccessGuard`, port từ `checkClassAccess()`)

```ts
@Injectable()
export class ClassAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const classCode = req.params.classCode;
    if (!user || !['teacher', 'student'].includes(user.role)) return false;

    if (user.role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      const cls = teacher && await this.prisma.class.findFirst({
        where: { class_code: classCode, supervisorId: teacher.id, deleted: false },
      });
      if (!cls) return false;
      req.teacherId = teacher!.id;
      return true;
    }
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    const cls = student && await this.prisma.class.findFirst({
      where: { class_code: classCode, deleted: false, students: { some: { id: student.id } } },
    });
    if (!cls?.supervisorId) return false;
    req.teacherId = cls.supervisorId;
    return true;
  }
}
```

---

## 9. Database & Prisma trong NestJS

Vì schema **không cần thay đổi cấu trúc** (35 model đã ổn định, có migration history), chỉ cần **di chuyển nguyên** `prisma/` sang service Nest:

```
backend-nest/prisma/
├── schema.prisma       # copy y nguyên từ next-dashboard-ui/prisma/schema.prisma
├── migrations/          # copy y nguyên toàn bộ history (14 migration hiện có)
└── seed.ts
```

```ts
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

```ts
// prisma/prisma.module.ts
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

**Vấn đề cần sửa khi migrate**: `src/app/api/signup/route.ts` hiện tại tự tạo `new PrismaClient()` riêng thay vì dùng singleton `src/lib/prisma.ts` — đây là bug tiềm ẩn (connection leak). Khi chuyển sang `AuthService`, chỉ dùng `PrismaService` duy nhất được inject.

**Transaction**: `signup` đã dùng đúng `prisma.$transaction()` để tạo `User` + `Student`/`Teacher` cùng lúc — giữ nguyên pattern này trong `AuthService.signup()`.

---

## 10. Environment Variables

Biến thực tế được dùng trong code (`grep process.env` trên toàn repo):

**`backend-nest/.env`** (chỉ Backend được đọc):
```env
PORT=8080
DATABASE_URL=

JWT_SECRET_KEY=<đổi sang secret mạnh, KHÔNG dùng fallback "jwt-default" như code hiện tại>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=      # ⚠️ hiện tại đang là NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY (lộ ra client) — BẮT BUỘC sửa khi migrate, xem mục 14
IMAGEKIT_URL_ENDPOINT=

PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

STREAM_API_KEY=
STREAM_SECRET_KEY=

RESEND_API_KEY=
BASE_URL=http://localhost:3000

AI_SERVICE_URL=http://localhost:8000   # trước là NEXT_PUBLIC_FLASK_API_URL
```

**`frontend/.env.local`** (chỉ những gì FE thực sự cần, không chứa secret):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
NEXT_PUBLIC_STREAM_API_KEY=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
```

⚠️ **Không đưa** `JWT_SECRET_KEY`, `AWS_SECRET_ACCESS_KEY`, `IMAGEKIT_PRIVATE_KEY`, `PUSHER_SECRET`, `STREAM_SECRET_KEY`, `RESEND_API_KEY`, `DATABASE_URL` vào bất kỳ biến `NEXT_PUBLIC_*` nào — hiện tại `IMAGEKIT_PRIVATE_KEY` đang mắc lỗi này, cần vá ngay đầu tiên khi migrate (mục 14).

Dùng `@nestjs/config` với validate:
```ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET_KEY: Joi.string().min(32).required(),
    // ...
  }),
});
```

---

## 11. Clean Code & Coding Standards

- **Naming**: file `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts`, `*.guard.ts` — nhất quán, khác với hiện tại đặt tên không đồng nhất (`actions.ts` vs `class.action.ts` vs `group.actions.ts`).
- **Không dùng `any`**: code hiện tại dùng `any` khá nhiều (VD `payload: any` trong `auth.ts`, `content: any` trong nhiều chỗ xử lý JSON bài làm) — khi viết DTO/interface mới, định nghĩa type rõ ràng, đặc biệt cho `HomeworkSubmission.content`.
- **Controller mỏng**: chỉ nhận request/gọi Service, không chứa logic (khác với `route.ts` hiện tại đang xử lý business logic ngay trong handler, ví dụ toàn bộ logic merge điểm trong `homework/[id]/grade/route.ts`).
- **Service chứa business logic + transaction**, **Repository/Prisma chỉ query** — tách rõ 3 lớp thay vì gọi `prisma` thẳng từ mọi nơi như hiện tại.
- Dùng ESLint + Prettier (Next.js FE đã có ESLint, đồng bộ rule sang Nest); thêm Husky + lint-staged để chặn commit lỗi.

---

## 12. Performance Optimization (Backend)

Vấn đề thực tế phát hiện được, cần xử lý khi viết lại:

- **N+1 tiềm ẩn**: `getDashboardStats`, `getRecentActivity` trong `dashboard.action.ts` chạy nhiều query tổng hợp riêng lẻ — nên gộp bằng Prisma `$transaction([...])` chạy song song, hoặc raw SQL aggregate.
- **Không có pagination** ở nhiều nơi trả list (VD feed `getPostComments`, `notifications`) — cần thêm `skip/take` + `cursor` khi thiết kế lại DTO.
- **Cache**: `getDashboardStats`/`getOnlineUsersCount` là query nặng, chạy lại mỗi lần load trang admin — đề xuất thêm Redis cache TTL ngắn (30–60s) cho nhóm dashboard.
- **Chỉ số DB**: các truy vấn theo `class_code` (unique, đã có index tự động vì `@unique`) — ổn; nhưng các filter theo `classCode + deleted` (VD trong `class.action.ts`) nên thêm composite index nếu dữ liệu lớn.
- **Select field cần thiết**: một số action `include` toàn bộ quan hệ thay vì `select` field cần dùng — rà soát lại khi port sang Service.

---

## 13. Error Handling

Chuẩn hoá response format (hiện tại mỗi route trả format khác nhau — có nơi `{ error: "..." }`, có nơi throw, có nơi `{ success, error }`):

```ts
// common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
```

Riêng lỗi Prisma unique constraint (`P2002`) — code hiện tại đã xử lý đúng ở `signup/route.ts`, giữ pattern này nhưng tập trung vào 1 `PrismaExceptionFilter` dùng chung cho toàn bộ app thay vì lặp lại từng route.

---

## 14. Security — checklist các vấn đề THẬT SỰ tìm thấy trong code

| Vấn đề | Vị trí | Mức độ | Hành động khi migrate |
|---|---|---|---|
| JWT secret có fallback hardcode (`"jwt-default"`, `"default_secret_key_change_this_in_production"`) | `src/lib/auth.ts`, `src/lib/actions/auth.action.ts`, `src/middleware.ts` | 🔴 Cao | Bắt buộc `JWT_SECRET_KEY` qua `Joi.required()`, app fail-fast nếu thiếu, không fallback |
| ImageKit **private key** đang gán vào biến `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY` → bị bundle ra client | `src/lib/imagekit.ts` | 🔴 Cao | Đổi thành `IMAGEKIT_PRIVATE_KEY` (không `NEXT_PUBLIC_`), chỉ NestJS dùng |
| `signup/route.ts` tạo `new PrismaClient()` riêng mỗi request | `src/app/api/signup/route.ts` | 🟡 Trung bình | Dùng `PrismaService` singleton |
| Không thấy rate limiting cho `/login`, `/signup` | toàn bộ auth routes | 🟡 Trung bình | Thêm `@nestjs/throttler` cho nhóm auth |
| Middleware chỉ chặn ở tầng UI (`/dashboard`), **API routes bị bỏ qua hoàn toàn** (`if (pathname.startsWith("/api/")) return NextResponse.next()`) | `src/middleware.ts` | 🔴 Cao | Khi tách BE, mọi API bắt buộc phải qua `JwtAuthGuard`/`RolesGuard` — không được tin tưởng middleware FE nữa |
| Cookie `session` dùng `sameSite: "lax"` (không phải `strict`) | `auth.action.ts` | 🟢 Thấp | Giữ `lax` nếu cần cross-site redirect OAuth sau này, nếu không cần thì đổi `strict` |
| AWS SDK v2 (`aws-sdk`) đã deprecated | `src/lib/s3.ts` | 🟢 Thấp | Nâng cấp `@aws-sdk/client-s3` v3 khi viết `UploadService` |
| Password hashing dùng bcrypt cost 10 | `signup/route.ts` | ✅ Ổn | Giữ nguyên, có thể tăng cost lên 12 |

Ngoài ra áp dụng chuẩn chung: Helmet, CORS whitelist đúng domain FE, validate input toàn bộ bằng DTO (hiện nhiều route không validate — VD `signup` chỉ check `!field`, không check định dạng email/phone).

---

## 15. Testing Strategy

- Backend hiện tại có duy nhất `backend/test_quiz_api.py` (test cho service Python, không liên quan Nest).
- Next.js FE đã cấu hình Jest (`package.json` có `"test": "jest"`) nhưng scope hẹp.
- Đề xuất cho NestJS:
  - **Unit test**: Jest (mặc định của NestJS CLI) cho từng Service — mock `PrismaService`.
  - **Integration test**: Supertest cho Controller, dùng DB test riêng (docker Postgres test container hoặc SQLite trong CI nếu chấp nhận khác engine — khuyến nghị dùng Postgres thật qua Testcontainers để sát thực tế).
  - **E2E**: Playwright phía FE để test luồng login → tạo lớp → giao bài tập → nộp bài → chấm điểm (đúng luồng nghiệp vụ chính của app).

---

## 16. Docker & Deployment

```yaml
# docker-compose.yml (đặt ở root repo)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: school_project
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  backend:
    build: ./backend-nest
    env_file: ./backend-nest/.env
    ports: ["8080:8080"]
    depends_on: [postgres]

  ai-service:
    build: ./backend        # giữ nguyên Python FastAPI hiện có
    ports: ["8000:8000"]

  frontend:
    build: ./next-dashboard-ui
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api/v1
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  pgdata:
```

Lưu ý: `backend/vercel.json` hiện tại là cấu hình deploy Python service lên Vercel — **giữ nguyên** cho service AI, chỉ thêm Dockerfile mới cho `backend-nest`.

---

## 17. Migration Roadmap

**Phase 1 – Setup NestJS**
1. `nest new backend-nest`, cấu hình TypeScript strict, ESLint/Prettier đồng bộ với FE.
2. Copy `prisma/` từ `next-dashboard-ui` sang, chạy `prisma generate`.
3. Setup `ConfigModule` + validate env (mục 10).
4. Setup `PrismaModule` (mục 9).

**Phase 2 – Authentication (nền tảng cho mọi module khác)**
1. `AuthModule`: signup, login, logout, verify-email.
2. `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@CurrentUser()`.
3. Test song song: FE tạm thời gọi cả Server Action cũ lẫn API mới để so sánh kết quả trước khi cắt hẳn.

**Phase 3 – Core domain (theo độ ưu tiên nghiệp vụ)**
1. `UsersModule`, `ClassesModule` (kèm `ClassAccessGuard`).
2. `HomeworkModule` (phần lớn logic nhất, làm sau khi Class ổn định vì Homework phụ thuộc Class).
3. `CoursesModule`, `DocumentsModule`, `UploadModule` (S3 + ImageKit).
4. `PostsModule`, `ChatModule`, `GroupsModule`, `ScheduleModule`, `WhiteboardModule`, `NotificationsModule`.
5. `RealtimeModule` (Pusher auth, Stream token), `MailModule`, `AiGatewayModule`.
6. `DashboardModule` (làm cuối vì chỉ phục vụ admin, không chặn luồng chính).

**Phase 4 – Cắt Next.js**
1. Xoá dần `src/app/api/**/route.ts` và `src/lib/actions/*.ts` sau khi FE đã chuyển hẳn sang gọi NestJS.
2. Xoá truy cập Prisma trực tiếp khỏi Next.js (`src/lib/prisma.ts` không còn cần ở FE).
3. Cập nhật `middleware.ts` — chỉ giữ vai trò redirect UI dựa vào cookie, không tự ý cấp quyền (quyền thật kiểm tra ở API).

**Phase 5 – Vá bảo mật & tối ưu** (mục 12, 14) đồng thời với Phase 3–4, không để dồn tới cuối.

**Phase 6 – Testing & Docker & Deploy** (mục 15, 16).

---

## 18. Migration Checklist

```
[ ] Setup NestJS project + ESLint/Prettier
[ ] Copy prisma/ (schema + migrations + seed) sang backend-nest
[ ] Setup ConfigModule + env validation
[ ] Setup PrismaModule/PrismaService
[ ] AuthModule: signup / login / logout / verify-email
[ ] JwtStrategy + JwtAuthGuard + RolesGuard + @CurrentUser
[ ] UsersModule (profile, avatar, change password)
[ ] ClassesModule + ClassAccessGuard + Grades + JoinRequests
[ ] HomeworkModule + Questions + Submissions + Grading
[ ] CoursesModule (Course/Chapter/Video) + DocumentsModule (File/Folder/FileView)
[ ] UploadModule (S3 v3 + ImageKit hợp nhất)
[ ] PostsModule (feed/like/comment/save)
[ ] ChatModule + tích hợp Pusher trigger
[ ] GroupsModule (ClassGroup)
[ ] ScheduleModule (Event/Attendance/recurrence/meeting)
[ ] WhiteboardModule
[ ] NotificationsModule
[ ] RealtimeModule (Pusher auth endpoint, Stream token endpoint)
[ ] MailModule (Resend)
[ ] AiGatewayModule (proxy sang Python FastAPI)
[ ] DashboardModule (+ cache Redis cho stats)
[ ] Global ValidationPipe + DTO cho toàn bộ input còn thiếu validate
[ ] Global HttpExceptionFilter + response format thống nhất
[ ] Vá lỗi bảo mật: JWT secret bắt buộc, ImageKit private key, rate limit auth
[ ] Viết api-client.ts + services/*.ts phía Next.js, xoá dần Server Actions cũ
[ ] Xoá route.ts và actions.ts cũ sau khi FE đã chuyển hẳn
[ ] Unit test (Jest) cho các Service quan trọng: Auth, Homework grading, Class access
[ ] Integration test (Supertest) cho các Controller chính
[ ] docker-compose.yml (postgres + backend-nest + ai-service + frontend)
[ ] CI pipeline build + test + migrate DB
[ ] Deploy
```

---

## 19. Kiến trúc cuối cùng

```
                         ┌───────────────┐
                         │    Browser     │
                         └───────┬────────┘
                                 │
                                 ▼
                     ┌────────────────────┐
                     │   Next.js (FE)     │  cổng 3000
                     │  UI only, gọi REST │
                     └─────────┬──────────┘
                                │ REST /api/ (JWT cookie)
                                ▼
                     ┌────────────────────┐
                     │     NestJS API      │  cổng 8080
                     │ Auth / Classes /    │
                     │ Homework / Courses /│
                     │ Posts / Chat /...   │
                     └───┬─────────┬───────┘
                         │         │
             ┌───────────┘         └───────────┐
             ▼                                  ▼
     ┌───────────────┐                 ┌─────────────────────┐
     │  PostgreSQL    │                 │  External services   │
     │ (Prisma)       │                 │  S3 / ImageKit /     │
     └───────────────┘                 │  Pusher / Stream /    │
                                        │  Resend               │
                                        └──────────┬────────────┘
                                                    │
                                                    ▼
                                        ┌─────────────────────┐
                                        │ Python FastAPI (AI)  │  cổng 8000
                                        │ RAG / essay gen /    │
                                        │ podcast (giữ nguyên) │
                                        └─────────────────────┘
```

- **Danh sách module NestJS**: `auth`, `users`, `classes`, `grades`, `homework` (+questions, +submissions), `courses`, `documents`, `upload`, `posts`, `chat`, `groups`, `schedule`, `whiteboard`, `notifications`, `realtime` (+pusher, +stream), `mail`, `ai-gateway`, `dashboard`.
- **Database**: 1 PostgreSQL, chỉ NestJS kết nối, schema giữ nguyên 35+ model đã có.
- **Authentication**: JWT ký/verify hoàn toàn trong NestJS (`AuthModule`), Next.js chỉ giữ cookie.
- **Authorization**: `RolesGuard` (theo `UserRole` enum) + `ClassAccessGuard` (theo quyền sở hữu lớp) áp dụng ở tầng Controller, không còn kiểm tra rải rác trong logic nghiệp vụ.
- **Deployment**: 4 service độc lập (frontend, backend-nest, ai-service Python, postgres) qua `docker-compose.yml`.

---

## Tóm tắt các điểm cần lưu ý nhất khi bắt tay vào code

1. **`src/lib/actions/*.ts` (12 file, ~50 hàm)** là nơi chứa business logic thật — đây là khối lượng công việc chính, không phải `route.ts`.
2. Có **2 nhóm bug/lỗ hổng bảo mật thật** cần vá ngay khi migrate: `IMAGEKIT_PRIVATE_KEY` bị lộ qua `NEXT_PUBLIC_`, và JWT secret có fallback hardcode.
3. Middleware hiện tại **không bảo vệ API routes** (`/api/*` bị bỏ qua) — khi tách BE, bắt buộc mọi endpoint phải tự bảo vệ bằng Guard, không dựa vào middleware Next.js nữa.
4. Không tự ý migrate phần Python AI service (`backend/`) — chỉ tạo gateway gọi sang, vì đây là service riêng biệt hoạt động tốt, không nằm trong phạm vi "Next.js Fullstack → NestJS".
5. `HomeworkSubmission.content` đang là `String` chứa JSON thủ công — nên cân nhắc đổi sang kiểu `Json` của Prisma khi viết lại `HomeworkModule` để code sạch hơn.
