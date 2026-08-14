import { cookies } from "next/headers";
import { decodeJwt } from "jose";

export interface CurrentUserSession {
  id: string;
  username: string;
  role: "teacher" | "student" | "admin";
  img?: string | null;
}

/**
 * Lấy thông tin user hiện tại trên Server Component trực tiếp từ cookie JWT.
 * Tốc độ tức thì (0ms), không tốn HTTP request sang NestJS.
 */
export function getCurrentUser(): CurrentUserSession | null {
  const session = cookies().get("session")?.value;
  if (!session) return null;

  try {
    const payload = decodeJwt(session) as any;
    if (!payload?.sub || !payload?.role) return null;

    return {
      id: payload.sub,
      username: payload.username || "",
      role: payload.role,
      img: payload.img || null,
    };
  } catch (err) {
    console.error("Lỗi giải mã token session:", err);
    return null;
  }
}
