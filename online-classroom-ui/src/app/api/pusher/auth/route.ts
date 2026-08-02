// app/api/pusher/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth"; 
import { pusherServer } from "@/lib/pusher-server"; 

export async function POST(request: NextRequest) {
  try {
    // Log request để debug
    const url = request.url;
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[Pusher Auth] No user found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse request - Pusher thường dùng formData
    const contentType = request.headers.get("content-type") || "";
    console.log(`[Pusher Auth] Content-Type: ${contentType}`);
    
    let socketId: string | null = null;
    let channel: string | null = null;

    try {
      // Pusher thường gửi formData, nhưng cũng có thể gửi JSON
      if (contentType.includes("application/json")) {
        const body = await request.json();
        socketId = body.socket_id || null;
        channel = body.channel_name || null;
       
      } else {
        // Mặc định dùng formData
        const data = await request.formData();
        socketId = data.get("socket_id") as string;
        channel = data.get("channel_name") as string;
     
      }
    } catch (parseError) {
      console.error("[Pusher Auth] Error parsing request:", parseError);
      return new NextResponse("Bad Request", { status: 400 });
    }

    

    if (!socketId) {
      console.error("[Pusher Auth] Missing socket_id");
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Nếu không có channel_name, đây là user authentication request (cho presence)
    if (!channel) {
      console.log("[Pusher Auth] User authentication request (presence channel)");
      // Tạo user_info object, loại bỏ undefined values
      const userInfo: Record<string, any> = {
        username: user.username || "",
      };
      if (user.img) {
        userInfo.img = user.img;
      }
      
      const userData = {
        id: String(user.id),
        user_info: userInfo,
      };
    
      const authResponse = pusherServer.authenticateUser(socketId, userData);
     
      return NextResponse.json(authResponse);
    }

    // Nếu có channel_name, đây là channel authorization request
  

    if (channel.startsWith('presence-')) {
      // Presence channel - dùng authorizeChannel với user data
      // Tạo user_info object, loại bỏ undefined values
      const userInfo: Record<string, any> = {
        username: user.username || "",
      };
      if (user.img) {
        userInfo.img = user.img;
      }
      
      // Format cho presence channel: cần user_id và user_info
      const presenceUserData = {
        user_id: String(user.id), // Presence channel dùng user_id
        user_info: userInfo,
      };
    
      const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceUserData);
   
      
      return NextResponse.json(authResponse);
    } else {
      // Private channel - dùng authorizeChannel
      // Tạo user_info object, loại bỏ undefined values
      const userInfo: Record<string, any> = {
        username: user.username || "",
      };
      if (user.img) {
        userInfo.img = user.img;
      }
      
      const privateUserData = {
        user_id: String(user.id),
        user_info: userInfo,
      };
    
      const authResponse = pusherServer.authorizeChannel(socketId, channel, privateUserData);
    
      return NextResponse.json(authResponse);
    }

  } catch (error) {
    console.error("[Pusher Auth] Error:", error);
    if (error instanceof Error) {
      console.error("[Pusher Auth] Error message:", error.message);
      console.error("[Pusher Auth] Error stack:", error.stack);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}