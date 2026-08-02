"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { changePasswordSchema } from "@/lib/formValidationSchema";
import bcrypt from "bcryptjs";

// Định nghĩa kiểu trả về của action
type ActionState = {
  success: boolean;
  error?: string;
};

// Định nghĩa các schema để validate
const phoneSchema = z.string().min(9, "Số điện thoại phải có ít nhất 9 số.");
const emailSchema = z.string().email("Email không hợp lệ.");
const nameSchema = z.string().min(2, "Tên quá ngắn.");
// (Bạn có thể thêm các schema khác ở đây)

export async function updateUserProfile(
  // Dùng `fieldKey` để biết nên update trường nào
  fieldKey: "phone" | "email" | "name" | "schoolname" | "address" | "birthday", 
  value: string
): Promise<ActionState> {
  
  const userSession = await getCurrentUser();
  if (!userSession) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  // 1. Validate dữ liệu
  try {
    if (fieldKey === "phone") phoneSchema.parse(value);
    if (fieldKey === "email") emailSchema.parse(value);
    if (fieldKey === "name") nameSchema.parse(value);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
  }
  
  // 2. Cập nhật database
  try {
    // Nếu cập nhật trường `name` (Tên),
    // chúng ta cần cập nhật cả bảng `student` hoặc `teacher`
    if (fieldKey === "name") {
      const user = await prisma.user.findUnique({
        where: { id: userSession.id as string },
        select: { role: true }
      });
      
      if (user?.role === 'student') {
         await prisma.student.update({
            where: { userId: userSession.id as string },
            data: { username: value } // Giả sử tên học sinh lưu ở `student.username`
         });
      } else if (user?.role === 'teacher') {
         await prisma.teacher.update({
            where: { userId: userSession.id as string },
            data: { username: value } // Giả sử tên giáo viên lưu ở `teacher.username`
         });
      }
      // Vẫn cập nhật bảng user
       await prisma.user.update({
        where: { id: userSession.id as string },
        data: { username: value }, // Cập nhật cả 'user.username'
      });

      // ✅ TẠO LẠI JWT TOKEN với tên mới
      const { SignJWT } = await import('jose');
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY || "default_secret_key");
      
      const newToken = await new SignJWT({
        id: userSession.id,
        username: value, // ✅ Tên mới
        role: user?.role
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

      // ✅ CẬP NHẬT COOKIE
      const { cookies } = await import('next/headers');
      cookies().set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }
    else if (fieldKey === "birthday") {
      // Xử lý ngày sinh - chuyển đổi string thành Date
      const dateValue = new Date(value);
      await prisma.user.update({
        where: { id: userSession.id as string },
        data: {
          birthday: dateValue,
        },
      });
    }
    else {
      // Cập nhật các trường thông thường trên bảng User
      await prisma.user.update({
        where: { id: userSession.id as string },
        data: {
          [fieldKey]: value,
          // Nếu cập nhật SĐT/Email, bạn có thể muốn reset trạng thái xác thực
          // ...(fieldKey === 'phone' && { isPhoneVerified: false }),
          // ...(fieldKey === 'email' && { isEmailVerified: false }),
        },
      });
    }

    // 3. Làm mới cache
    revalidatePath("/profile");
    
    return { success: true };

  } catch (err: any) {
    console.error("Update Profile Error:", err);
    // Xử lý lỗi nếu SĐT/Email đã tồn tại
    if (err?.code === 'P2002') { // Mã lỗi unique constraint của Prisma
       return { success: false, error: `${fieldKey === 'phone' ? 'SĐT' : 'Email'} này đã được sử dụng.` };
    }
    return { success: false, error: "Cập nhật thất bại. Vui lòng thử lại." };
  }
}

// Action để upload avatar
export async function uploadAvatar(formData: FormData): Promise<ActionState> {
  const userSession = await getCurrentUser();
  if (!userSession) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const file = formData.get("avatar") as File;
  
  if (!file || file.size === 0) {
    return { success: false, error: "Vui lòng chọn file ảnh." };
  }

  // Kiểm tra định dạng file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Chỉ cho phép file ảnh (JPG, PNG, WEBP)." };
  }

  // Kiểm tra kích thước file (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Ảnh không được vượt quá 5MB." };
  }

  try {
    // Import imagekit từ utils
    const { imagekit } = await import('../utils');
    
    if (!imagekit) {
      return { success: false, error: "Lỗi hệ thống upload ảnh." };
    }

    // Upload file lên ImageKit
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      imagekit.upload(
        {
          file: buffer,
          fileName: `avatar_${userSession.id}_${Date.now()}`,
          folder: "/avatars",
          transformation: {
            pre: "w-400,h-400,c-maintain_ratio",
            post: [
              {
                type: "transformation",
                value: "w-200,h-200,c-maintain_ratio"
              }
            ]
          }
        },
        function (error, result) {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Cập nhật avatar trong database
    await prisma.user.update({
      where: { id: userSession.id as string },
      data: { img: uploadResult.filePath },
    });

    // Cập nhật cả Student hoặc Teacher table nếu cần
    const user = await prisma.user.findUnique({
      where: { id: userSession.id as string },
      select: { role: true }
    });

    if (user?.role === 'student') {
      await prisma.student.update({
        where: { userId: userSession.id as string },
        data: { img: uploadResult.filePath }
      });
    } else if (user?.role === 'teacher') {
      await prisma.teacher.update({
        where: { userId: userSession.id as string },
        data: { img: uploadResult.filePath }
      });
    }

    // Làm mới cache
    revalidatePath("/profile");
    
    return { success: true };

  } catch (err: any) {
    console.error("Upload Avatar Error:", err);
    return { success: false, error: "Upload ảnh thất bại. Vui lòng thử lại." };
  }
}

// Action để đổi mật khẩu (bỏ mật khẩu hiện tại vì không thể so sánh với DB đã mã hóa)
export async function changePassword(
  newPassword: string,
  confirmPassword: string
): Promise<ActionState> {
  const userSession = await getCurrentUser();
  if (!userSession) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  try {
    // 1. Validate dữ liệu với schema
    const validationResult = changePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0].message 
      };
    }

    // 2. Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 3. Cập nhật mật khẩu mới
    await prisma.user.update({
      where: { id: userSession.id as string },
      data: { password: hashedNewPassword },
    });

    // 4. Làm mới cache
    revalidatePath("/profile");
    
    return { success: true };

  } catch (err: any) {
    console.error("Change Password Error:", err);
    return { success: false, error: "Đổi mật khẩu thất bại. Vui lòng thử lại." };
  }
}


export const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isBanned: !currentStatus, // Đảo ngược trạng thái hiện tại
      },
    });

    // Làm mới lại dữ liệu trang dashboard user để UI cập nhật ngay lập tức
    revalidatePath("/dashboard/user");
    
    return { success: true, message: "Cập nhật trạng thái thành công!" };
  } catch (err) {
    console.log(err);
    return { success: false, message: "Có lỗi xảy ra!" };
  }
};