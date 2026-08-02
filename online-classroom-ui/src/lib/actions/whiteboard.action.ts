// lib/actions/whiteboard.action.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Lấy dữ liệu bảng trắng
export async function getWhiteboardState(classCode: string) {
  try {
    const board = await prisma.whiteboard.findUnique({
      where: { classCode },
    });
    return board?.content || null;
  } catch (error) {
    console.error("Error getting whiteboard:", error);
    return null;
  }
}

// Lưu dữ liệu bảng trắng
export async function saveWhiteboardState(classCode: string, content: any) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    // Dùng upsert: Nếu có rồi thì update, chưa có thì create
    await prisma.whiteboard.upsert({
      where: { classCode },
      update: { content },
      create: {
        classCode,
        content,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving whiteboard:", error);
    return { error: "Failed to save" };
  }
}