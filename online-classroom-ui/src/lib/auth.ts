"use server";
import "server-only";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "jwt-default"
);

export async function getCurrentUser() {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return null; // Không có cookie -> không cần DB

    let payload: any;
    try {
      const verified = await jwtVerify(session, JWT_SECRET);
      payload = verified.payload;
    } catch {
      return null; // Token lỗi -> không cần log -> tránh lỗi build
    }

    const userId = payload?.id || payload?.sub;
    if (!userId) return null;

    // Chỉ query Prisma khi runtime (không cho chạy trong build)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isEmailVerified: true,
        role: true,
        img: true,
      },
    });

    return user;
  } catch {
    return null; // Không throw → tránh fail build
  }
}
