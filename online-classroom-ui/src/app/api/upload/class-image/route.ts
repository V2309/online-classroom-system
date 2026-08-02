import { NextRequest, NextResponse } from "next/server";
import { uploadToImageKit } from "@/lib/imagekit";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authentication
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const classCode = formData.get("classCode") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `class-${classCode}-${timestamp}.${fileExtension}`;

    // Upload to ImageKit
    const uploadResult = await uploadToImageKit(file, fileName, "classes");

    if (uploadResult.success) {
      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        fileId: uploadResult.fileId,
        name: uploadResult.name,
      });
    } else {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
