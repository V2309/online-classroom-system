import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;
    
    // Đường dẫn đến thư mục uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Tạo thư mục nếu chưa tồn tại
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);

    // Lưu file vào public/uploads
    await writeFile(filePath, buffer);

    // Trả về URL public để preview
    const url = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      success: true,
      url, 
      name: file.name, 
      type: file.type, 
      size: file.size,
      tempPath: filePath
    });
    
  } catch (error) {
    console.error("Error uploading temp file:", error);
    return NextResponse.json(
      { error: "Failed to upload temp file" },
      { status: 500 }
    );
  }
}
