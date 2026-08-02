src/
├── common/                # (1) Các thành phần dùng chung cho toàn bộ dự án
│   ├── decorators/        # Custom decorators (ví dụ: @CurrentUser)
│   ├── filters/           # Exception filters (ví dụ: HttpExceptionFilter)
│   ├── guards/            # Auth/Role guards (ví dụ: JwtAuthGuard, RolesGuard)
│   ├── interceptors/      # Interceptors (ví dụ: TransformInterceptor, Logging)
│   ├── middlewares/       # Express/Fastify middlewares
│   ├── pipes/             # Validation pipes
│   └── utils/             # Các hàm helpers/utils dùng chung
│
├── config/                # (2) Cấu hình hệ thống
│   ├── app.config.ts      # Cấu hình app (port, prefix...)
│   └── database.config.ts # Cấu hình kết nối DB
│
├── database/              # (3) Database (nếu sử dụng TypeORM/Prisma/Sequelize)
│   ├── migrations/        # Các file migration thay đổi cấu trúc DB
│   └── seeds/             # Dữ liệu mẫu ban đầu
│
├── modules/               # (4) Nơi chứa TẤT CẢ các tính năng của ứng dụng
│   ├── auth/              # Module xác thực (Login, Register, JWT)
│   ├── core/              # Core module (thường chứa các global service như Mail, S3)
│   └── users/             # Ví dụ một Feature Module tiêu chuẩn
│       ├── dto/           # Data Transfer Objects (chứa class validate dữ liệu đầu vào)
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       ├── entities/      # TypeORM Entities hoặc Mongoose Schemas
│       │   └── user.entity.ts
│       ├── interfaces/    # TypeScript interfaces định nghĩa kiểu dữ liệu (nếu cần)
│       ├── users.controller.ts  # Tiếp nhận Request, trả về Response
│       ├── users.service.ts     # Xử lý logic nghiệp vụ (Business logic)
│       └── users.module.ts      # Đóng gói và export module
│
├── app.module.ts          # Root Module - Nơi import tất cả các modules khác
└── main.ts                # Entry point - File khởi chạy server