# Rule: Quy trình Migration API (NestJS) song song Cập nhật Frontend (Next.js)

> Áp dụng cho toàn bộ quá trình migrate `next-dashboard-ui` (Server Actions + Route Handlers) sang `backend-nest`. Tham chiếu danh sách module/thứ tự theo `BACKEND_MIGRATION.md` (mục 4, 17, 18).

---

## 1. Nguyên tắc bắt buộc

1. **Không làm nhiều API cùng lúc.** Chỉ được làm **1 API/1 nhóm chức năng nhỏ** tại một thời điểm (vd: `POST /auth/login`, không gộp luôn `signup + login + logout` trong 1 lượt).
2. **API xong → Frontend phải xong ngay trong cùng lượt, không để "nợ" lại sau.** Không có chuyện "để backend làm hết rồi quay lại nối frontend sau" — mỗi API xong là phải trỏ FE gọi vào API đó, xoá/thay code cũ (Server Action, `fetch` nội bộ, mock data) tương ứng.
3. **Không tự ý chuyển sang API tiếp theo.** Sau khi hoàn thành 1 cặp (Backend + Frontend), bắt buộc **dừng lại, báo cáo, và chờ tôi xác nhận đã test OK** rồi mới bắt đầu API kế tiếp. Đây là điều kiện chặn cứng (hard gate), không phải gợi ý.
4. **Không đoán mò FE component cần sửa.** Trước khi code, phải tìm chính xác component/hook/Server Action nào đang gọi tới logic cũ liên quan đến API sắp làm, liệt kê ra rồi mới sửa — tránh sửa sai chỗ hoặc bỏ sót chỗ gọi ngầm.
5. **Giữ nguyên hợp đồng dữ liệu (contract) nếu FE cũ đã hoạt động đúng.** Không tự đổi field name, response shape... trừ khi đã ghi rõ trong `BACKEND_MIGRATION.md` là cần đổi (vd: đổi response format sang `{ success, data }`).
6. **Mỗi API mới phải có ít nhất 1 cách test rõ ràng** (curl/Postman cho BE, và thao tác cụ thể trên UI cho FE) kèm trong báo cáo, để tôi kiểm tra nhanh không phải tự nghĩ cách test.
7. **Không xoá code cũ (Server Action/route.ts cũ) ngay lập tức.** Chỉ **ngừng gọi** từ FE (chuyển sang gọi API mới), giữ code cũ lại cho tới khi tôi xác nhận API mới chạy ổn định — để có đường lui nếu phát hiện lỗi.
8. **Nếu 1 API phụ thuộc API/module chưa migrate xong** (vd: Homework phụ thuộc Class) → phải làm đúng thứ tự phụ thuộc, không nhảy cóc.

---

## 2. Quy trình cho mỗi API (vòng lặp bắt buộc)

```
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 0 — Chọn đúng 1 API tiếp theo theo thứ tự Roadmap        │
└───────────────────────────┬───────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 1 — Rà soát Frontend đang gọi gì cho chức năng này        │
│  (grep Server Action / route.ts cũ, liệt kê component liên quan)│
└───────────────────────────┬───────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 2 — Code Backend (NestJS): DTO → Service → Controller     │
│  → Guard/Role nếu cần → test bằng curl/Postman trước             │
└───────────────────────────┬───────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 3 — Code Frontend: services/*.ts (gọi API mới)             │
│  + sửa component/hook liệt kê ở Bước 1 để dùng service mới       │
└───────────────────────────┬───────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 4 — Báo cáo kết quả theo đúng Template mục 3               │
└───────────────────────────┬───────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 5 — DỪNG LẠI. Chờ tôi test và xác nhận "OK / qua tiếp"     │
└───────────────────────────┬───────────────────────────────────┘
                             ▼
                    Xác nhận OK → quay lại Bước 0 (API tiếp theo)
                    Báo lỗi     → sửa lại, quay về Bước 2/3 (không tính API mới)
```

### Chi tiết Bước 1 — Rà soát Frontend (không được bỏ qua)

Trước khi đụng code, phải:
- Tìm mọi nơi FE đang gọi chức năng cũ tương ứng: grep tên hàm trong `src/lib/actions/*.ts`, grep đường dẫn trong `src/app/api/**/route.ts`, grep nơi `import` các hàm đó trong `components/`, `app/**/page.tsx`.
- Liệt kê **đầy đủ danh sách file/component sẽ bị ảnh hưởng** trước khi sửa, không sửa xong mới phát hiện thiếu chỗ.
- Nếu 1 component gọi nhiều hành động (vd trang lớp học vừa gọi `getStudentClasses` vừa gọi `leaveClassAction`) và API đang làm chỉ thay thế 1 phần → chỉ sửa đúng phần đó, phần còn lại vẫn tạm gọi code cũ, ghi rõ trong báo cáo là "chưa migrate phần X trong cùng file".

### Chi tiết Bước 2 — Backend

- Theo đúng chuẩn đã thống nhất: DTO (`class-validator`) → Service (business logic + Prisma) → Controller (chỉ định tuyến) → gắn `JwtAuthGuard`/`RolesGuard`/`ClassAccessGuard` nếu route cần.
- Tự test bằng `curl`/Postman **trước khi** đụng vào FE, đảm bảo response đúng format `{ success, data }` (mục 4, `BACKEND_MIGRATION.md`) rồi mới đi Bước 3.

### Chi tiết Bước 3 — Frontend

- Thêm method vào đúng file `services/xxx.service.ts` liên quan (theo cấu trúc mục 8.4.2, `BACKEND_MIGRATION.md`), không tạo file service mới tràn lan cho 1 API lẻ.
- Sửa component/hook đã liệt kê ở Bước 1 để gọi `service` mới thay vì Server Action/fetch cũ.
- Server Action/route.ts cũ: **comment `// DEPRECATED - đã thay bằng services/xxx.service.ts, xem PR/commit ngày ...`**, không xoá vội (theo nguyên tắc 7).

---

## 3. Template báo cáo (bắt buộc dùng đúng format này ở Bước 4)

```markdown
## ✅ API: [Tên API] — [Method] [Endpoint]

**Backend đã làm:**
- File: `backend-nest/src/modules/xxx/...`
- Guard áp dụng: [JwtAuthGuard / RolesGuard(role) / ClassAccessGuard / không]
- Cách test nhanh:
  ```
  curl -X POST http://localhost:8080/api/v1/... \
    -H "Content-Type: application/json" \
    -b "session=<token test>" \
    -d '{ ... }'
  ```
  Kết quả mong đợi: `{ "success": true, "data": {...} }`

**Frontend đã thay thế:**
- Service: `next-dashboard-ui/src/services/xxx.service.ts` → method `xxxService.yyy()`
- Component/hook đã sửa để gọi service mới:
  - `src/components/.../ABC.tsx`
  - `src/app/(dashboard)/.../page.tsx`
- Server Action/route cũ đã đánh dấu deprecated: `src/lib/actions/xxx.action.ts` (hàm `yyyAction`)
- Cách test trên UI: [thao tác cụ thể, vd: "Vào /dashboard/classes → bấm 'Tạo lớp' → điền form → Submit → kỳ vọng thấy lớp mới xuất hiện trong danh sách, không reload trang"]

**Lưu ý / rủi ro (nếu có):**
- [vd: chưa xử lý case trùng mã lớp, sẽ làm ở API sau / cần env mới ABC_KEY]

---
👉 Đang dừng ở đây, chờ xác nhận kết quả test trước khi làm API tiếp theo.
```

---

## 4. Bảng theo dõi tiến độ (cập nhật liên tục mỗi lượt)

> Thứ tự lấy theo Phase 2–3 của `BACKEND_MIGRATION.md` mục 17. Cột "FE cần rà" liệt kê sơ bộ theo mục 5 của tài liệu đó — vẫn phải grep lại thực tế ở Bước 1 vì có thể phát sinh thêm.

| # | Module | API cụ thể | FE cần rà (action/route cũ) | Trạng thái |
|---|---|---|---|---|
| 1 | Auth | `POST /auth/signup` | `src/app/api/signup/route.ts` | ✅ Đã xác nhận |
| 2 | Auth | `POST /auth/login` | `src/lib/actions/auth.action.ts` (`loginAction`) | ✅ Đã xác nhận |
| 3 | Auth | `POST /auth/logout` | `src/lib/actions/auth.action.ts` (`logoutAction`) | ✅ Đã xác nhận |
| 4 | Auth | `GET /users/me` (current user) | `src/lib/auth.ts` (`getCurrentUser`) | ✅ Đã xác nhận |
| 5 | Auth | verify email | `src/lib/actions/auth.action.ts` (`sendVerificationEmail`, `verifyEmailToken`) | ✅ Đã xác nhận |
| 6 | Users | update profile / avatar / đổi mật khẩu | `src/lib/actions/user.action.ts` | ✅ Đã xác nhận |
| 7 | Classes | CRUD lớp, join/leave, join-request, danh sách & xóa thành viên (`/members`) | `src/lib/actions/class.action.ts`, `src/app/(page)/class/[id]/member/page.tsx` | ✅ Đã xác nhận |
| 8 | Grades | tạo/khối lớp (`Grade`) | `src/lib/actions/class.action.ts` (`createGrade`) | ✅ Đã xác nhận |
| 9 | Schedule | Event/Attendance/meeting | `src/lib/actions/schedule.action.ts` | ✅ Đã xác nhận |
| 10 | Chat | message/pin/recall | `src/lib/actions/chat.action.ts`, `src/app/(page)/class/[id]/groupchat/page.tsx` | ✅ Đã xác nhận |
| 11 | Groups | ClassGroup (CRUD, kéo thả thành viên, nhóm trưởng) | `src/lib/actions/group.actions.ts`, `src/app/(page)/class/[id]/groups/page.tsx` | ✅ Đã xác nhận |



| 12 | Courses | Course/Chapter/Video/Folder (CRUD, di chuyển folder, player) | `src/lib/actions/file.action.ts`, `src/app/(page)/class/[id]/video/**` | ✅ Đã xác nhận |

| 13 | Documents | File/FileView (Upload Cloudflare R2, danh sách, chi tiết PDF, thống kê & xem người xem, xóa) | `src/lib/actions/file.action.ts`, `src/app/api/files/**`, `src/app/(page)/class/[id]/documents/**` | ✅ Đã xác nhận |

| 14 | Upload | avatar / class-image / documents | `src/app/api/upload*/route.ts` | ✅ Đã xác nhận |
| 15 | Posts | feed/like/comment | `src/lib/actions/post.action.ts`, `src/app/api/posts/**` | ✅ Đã xác nhận |
| 16 | Whiteboard | state | `src/lib/actions/whiteboard.action.ts` | ✅ Đã xác nhận |
| 18 | Realtime | Pusher auth (Channel/Presence/User auth), Stream token | `src/app/api/pusher/auth/route.ts`, `src/lib/actions/stream.action.ts` | ✅ Đã xác nhận |

| 19 | Mail | gửi lại email xác minh | (đã gộp ở #5, `POST /auth/resend-verification`) | ✅ Đã xác nhận |
| 20 | AI Gateway | proxy sang FastAPI | các nơi gọi `NEXT_PUBLIC_FLASK_API_URL` | ✅ Đã xác nhận |
| 21 | Dashboard | thống kê admin | `src/lib/actions/dashboard.action.ts` | ⬜ Chưa làm |
| 22 | Homework | tạo/sửa homework + câu hỏi, bảng điểm scoretable, tổng quan overview | `src/lib/actions/actions.ts`, `src/app/(page)/class/[id]/scoretable/**`, `src/app/(page)/overview/**` | ✅ Đã xác nhận |
| 23 | Homework | nộp/lưu nháp/chấm điểm, ẩn điểm theo deadline | `src/app/api/homework/[id]/{save,submit,grade}/route.ts` | ✅ Đã xác nhận |

**Chú thích trạng thái:** `⬜ Chưa làm` · `🟡 Đang làm` · `🔵 Chờ bạn kiểm tra` · `✅ Đã xác nhận, xong` · `🔴 Lỗi, cần sửa lại`

> Sau mỗi lượt hoàn thành 1 dòng, cập nhật cột Trạng thái trong file này trước khi báo cáo.

---

## 5. Định nghĩa "Hoàn thành" (Definition of Done) cho 1 API

Một API chỉ được tính **xong** khi thoả cả 4 điều kiện:

- [ ] Backend trả đúng response format, có validate input, có Guard đúng role (nếu cần).
- [ ] Toàn bộ component/trang liên quan đã chuyển sang gọi `services/*.ts` mới — không còn nơi nào trong luồng chính gọi code cũ.
- [ ] Đã đưa ra cách test cụ thể (BE bằng curl/Postman, FE bằng thao tác UI) trong báo cáo.
- [ ] **Tôi đã tự kiểm tra và xác nhận "OK"** — chỉ khi có xác nhận này mới được đánh dấu ✅ và chuyển sang API tiếp theo.

---

## 6. Khi phát hiện lỗi trong lúc tôi test

- Không tự ý "vừa sửa lỗi vừa tranh thủ làm luôn API tiếp theo". Sửa xong lỗi của API hiện tại → báo lại → chờ xác nhận lại → mới đi tiếp.
- Nếu lỗi do sai contract dữ liệu (FE mong field khác BE trả) → ưu tiên sửa BE cho khớp hợp đồng cũ trừ khi đã thống nhất đổi trong `BACKEND_MIGRATION.md`.
- Ghi lại lỗi + cách sửa vào phần "Lưu ý / rủi ro" của báo cáo API đó để tra cứu sau.
