// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // Khởi tạo NestJS application dựa trên AppModule
  const app = await NestFactory.create(AppModule);

  // Middleware đọc và parse cookie từ request
  // Sau đó có thể truy cập cookie thông qua req.cookies
  app.use(cookieParser());

  // ValidationPipe global
  // Áp dụng cho tất cả DTO trong toàn bộ ứng dụng
  app.useGlobalPipes(
    new ValidationPipe({
      // Chỉ giữ lại những field được khai báo trong DTO
      // Ví dụ DTO chỉ có username, client gửi thêm age
      // thì age sẽ bị loại bỏ
      whitelist: true,

      // Nếu client gửi field không được khai báo trong DTO
      // thì trả về lỗi 400 Bad Request
      forbidNonWhitelisted: true,

      // Tự động transform dữ liệu request về kiểu dữ liệu tương ứng
      // Ví dụ string "123" có thể được chuyển thành number 123
      transform: true,
    }),
  );

  // Interceptor global
  // Áp dụng cho tất cả API trong ứng dụng
  // Dùng để chuẩn hóa response thành:
  // {
  //   statusCode: 200,
  //   message: 'Success',
  //   data: ...
  // }
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  // Cấu hình CORS
  // Chấp nhận cả localhost (dev) và production URL
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean); // Loại bỏ undefined nếu env chưa set

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Thêm prefix "api/" cho tất cả API
  // Ví dụ:
  // @Get('users')
  // sẽ trở thành:
  // GET /api/users
  app.setGlobalPrefix('api/');

  // Khởi động server
  // Nếu có biến môi trường PORT thì dùng PORT đó
  // Nếu không có thì mặc định chạy port 8081
  await app.listen(process.env.PORT ?? 8081);
}

// Chạy hàm bootstrap để khởi động ứng dụng
bootstrap();
