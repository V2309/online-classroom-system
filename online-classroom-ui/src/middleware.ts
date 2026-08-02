import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "default_secret_key" // NHỚ: Khóa này phải giống hệt khóa ở Backend
);

const publicRoutes = [
  "/",
  "/sign-in", 
  "/sign-up",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Bỏ qua API routes, file tĩnh, Next.js internal routes
  if (
    pathname.startsWith("/api/") || 
    pathname.includes('.') || 
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }
  
  // Kiểm tra nếu là public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Sử dụng "session" cho đồng bộ với Backend và helper getCurrentUser
  const token = req.cookies.get("session")?.value;

  if (!token) {
    const url = new URL("/sign-in", req.url);
    return NextResponse.redirect(url);
  }

  try {
    // Giải mã token để lấy thông tin user
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Kiểm tra quyền Admin cho Dashboard
    if (pathname.startsWith("/dashboard")) {
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Lỗi xác thực JWT middleware:", err);
    const url = new URL("/sign-in", req.url);
    const response = NextResponse.redirect(url);
    
    // Xóa cookie "session" nếu token không hợp lệ hoặc hết hạn
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};