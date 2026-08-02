"use server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from 'resend';
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY ||
    "default_secret_key_change_this_in_production"
);



// lib/actions/auth.action.ts

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: email }, { phone: email }],
    },
  });

  if (!user) {
    return { error: "Tài khoản không tồn tại." };
  }

  if (user.isBanned) {
    return { error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." };
  }
  const isMatch = await compare(password, user.password as string);
  if (!isMatch) {
    return { error: "Mật khẩu không đúng." };
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(JWT_SECRET);

  cookies().set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 ngày
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true, role: user.role };
}

export async function logoutAction() {
  try {
    cookies().delete("session");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { error: "Đăng xuất thất bại" };
  }
}

// gui email xac minh 

// Khởi tạo Resend
const resend = new Resend(process.env.RESEND_API_KEY);
// Lấy URL cơ sở từ biến môi trường
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
export async function sendVerificationEmail() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.email) {
      return { error: "Bạn chưa đăng nhập hoặc chưa có email." };
    }
    if (user.isEmailVerified) {
      return { error: "Email này đã được xác minh." };
    }

    // 1. Tạo token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // 2. Xóa token cũ (nếu có) và lưu token mới vào DB
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id as string },
    });
    await prisma.verificationToken.create({
      data: {
        userId: user.id as string,
        token,
        expires,
      },
    });

    // 3. Tạo link xác minh
    const verificationLink = `${BASE_URL}/verify-email?token=${token}`;

    // 4. Gửi email
    const { data, error } = await resend.emails.send({
      from: 'DoCus <onboarding@resend.dev>', // (Bạn có thể thay 'onboarding@resend.dev' bằng domain của bạn)
      to: [user.email as string],
      subject: 'Xác minh địa chỉ email của bạn - DoCus',
      html: `<p>Chào ${user.username},</p>
             <p>Vui lòng bấm vào link sau để xác minh email: 
             <a href="${verificationLink}">Xác minh ngay</a>
             </p>
             <p>Link này sẽ hết hạn sau 15 phút.</p>`,
    });

    if (error) {
      console.error(error);
      return { error: "Không thể gửi email. Vui lòng thử lại sau." };
    }

    return { success: "Email xác minh đã được gửi! Vui lòng kiểm tra hộp thư." };

  } catch (error) {
    console.error(error);
    return { error: "Đã xảy ra lỗi server." };
  }
}

/**
 * Xác minh token từ link email
 */
export async function verifyEmailToken(token: string) {
  try {
    // 1. Tìm token trong DB
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return { error: "Token không hợp lệ hoặc đã được sử dụng." };
    }

    // 2. Kiểm tra token hết hạn
    if (existingToken.expires < new Date()) {
      return { error: "Token đã hết hạn. Vui lòng yêu cầu link mới." };
    }

    // 3. Lấy thông tin email (phòng trường hợp user đổi email nhưng chưa xác minh)
    const userToVerify = await prisma.user.findUnique({
      where: { id: existingToken.userId },
      select: { email: true }
    });

    if (!userToVerify) {
       return { error: "Người dùng không tồn tại." };
    }

    // 4. Cập nhật user là đã xác minh
    await prisma.user.update({
      where: { id: existingToken.userId },
      data: {
        isEmailVerified: true,
        email: userToVerify.email, // Đảm bảo email được "chốt" khi xác minh
      },
    });

    // 5. Xóa token đã dùng
    await prisma.verificationToken.delete({
      where: { id: existingToken.id },
    });
    
    revalidatePath("/profile"); // Làm mới trang profile
    return { success: "Email đã được xác minh thành công!" };

  } catch (error) {
    console.error(error);
    return { error: "Lỗi server khi xác minh." };
  }
}