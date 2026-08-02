// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
// Import các hàm helper từ file service bạn vừa tạo
import { 
  sendMessage, 
  getSessionInfo 
} from "@/lib/chatService"; // <-- Sửa đường dẫn nếu bạn đặt file service ở chỗ khác

/**
 * Xử lý yêu cầu POST (ví dụ: gửi tin nhắn mới)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Lấy dữ liệu từ client
    const body = await request.json();
    const { message, session_id } = body;

    // Kiểm tra dữ liệu đầu vào
    if (!message || !session_id) {
      return NextResponse.json(
        { error: "Thiếu 'message' hoặc 'session_id'" },
        { status: 400 }
      );
    }

    // 2. Gọi hàm service (đã được tách ra)
    const apiResponse = await sendMessage(message, session_id);

    // 3. Trả về cho client
    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error("Lỗi trong API /api/chat POST:", error);
    // Xử lý lỗi từ axios (nếu có)
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || "Lỗi từ API bên ngoài" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

/**
 * Xử lý yêu cầu GET (ví dụ: lấy lịch sử chat hoặc thông tin session)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu 'session_id'" }, { status: 400 });
    }

    // 2. Gọi hàm service (ví dụ: lấy thông tin session)
    const info = await getSessionInfo(sessionId);

    // (Nếu bạn muốn lấy lịch sử chat, hãy gọi: 
    // const history = await getChatHistory(sessionId);
    // return NextResponse.json(history);)

    // 3. Trả về
    return NextResponse.json(info);

  } catch (error) {
    console.error("Lỗi trong API /api/chat GET:", error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || "Lỗi từ API bên ngoài" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

// Cần import axios để check lỗi
import axios from "axios";