// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// --- GET: Lấy tất cả thông báo CHƯA ĐỌC ---
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id as string,
        isRead: false, // Chỉ lấy thông báo chưa đọc
      },
      include: {
        actor: { // Lấy thông tin người gửi
          select: { username: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Giới hạn 20 thông báo gần nhất
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- POST: Đánh dấu tất cả là đã đọc ---
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Đánh dấu tất cả thông báo của user này là đã đọc
    await prisma.notification.updateMany({
      where: {
        recipientId: user.id as string,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}