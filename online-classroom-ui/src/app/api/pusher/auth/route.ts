import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let socketId: string | null = null;
    let channelName: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      socketId = formData.get("socket_id") as string;
      channelName = formData.get("channel_name") as string;
    } else {
      try {
        const body = await req.json();
        socketId = body.socket_id;
        channelName = body.channel_name;
      } catch {
        // Fallback text query string
        const text = await req.text();
        const params = new URLSearchParams(text);
        socketId = params.get("socket_id");
        channelName = params.get("channel_name");
      }
    }

    if (!socketId) {
      return NextResponse.json({ error: "socket_id is required" }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const response = await fetch(`${backendUrl}/realtime/pusher/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session=${session}`,
      },
      body: JSON.stringify({
        socket_id: socketId,
        channel_name: channelName || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Trả về raw auth object cho Pusher client
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Pusher auth proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
