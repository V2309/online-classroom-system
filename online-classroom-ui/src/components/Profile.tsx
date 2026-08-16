"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  MapPin,
  School,
  Copy,
  CheckCircle,
  XCircle,
  Camera,
  Share2,
  Edit3,
  Loader2,
  Shield,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";
import EditProfileModal from "@/components/forms/EditProfileModal";
import UploadAvatarModal from "@/components/forms/UploadAvatarModal";
import Image from "@/components/Image";
import { authService } from "@/services/auth.service";
import { ProfileData, User as UserType } from "@/types/auth";

type VerificationState = "idle" | "loading" | "verified" | "sent";

type EditingField = {
  label: string;
  key:
    | "phone"
    | "email"
    | "name"
    | "schoolname"
    | "address"
    | "birthday"
    | "password";
  value: string;
};

// Hàm map dữ liệu
const mapUserToProfileData = (u: UserType | null): ProfileData | null => {
  if (!u) return null;
  const birthday = u.birthday ? new Date(u.birthday) : null;
  return {
    username: u.username,
    phoneNumber: u.phone ?? "",
    isPhoneVerified: u.isPhoneVerified ?? false,
    email: u.email ?? "",
    isEmailVerified: u.isEmailVerified ?? false,
    password: "********",
    facebookLinked: false,
    name: u.username,
    dateOfBirth: birthday ? birthday.toLocaleDateString("vi-VN") : "",
    dateOfBirthValue: birthday ? birthday.toISOString().split("T")[0] : "",
    province: u.address || "",
    school: u.schoolname || "",
    role: u.role || "student",
    avatar: u.img || undefined,
  };
};

interface ProfilePageProps {
  user?: UserType;
  type?: string;
}

export default function ProfilePage({
  user: initialUser,
}: ProfilePageProps = {}) {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(
    mapUserToProfileData(initialUser || null)
  );
  const [loading] = useState(!initialUser);
  const [error] = useState<string | null>(null);

  const [modalField, setModalField] = useState<EditingField | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [emailVerificationState, setEmailVerificationState] =
    useState<VerificationState>("idle");

  useEffect(() => {
    if (initialUser) {
      setUser(mapUserToProfileData(initialUser));
      setEmailVerificationState(
        initialUser.isEmailVerified ? "verified" : "idle"
      );
    }
  }, [initialUser]);

  const handleEditClick = (
    label: string,
    key: EditingField["key"],
    value: string
  ) => {
    const modalValue =
      key === "birthday" ? user?.dateOfBirthValue || "" : value;
    setModalField({ label, key, value: modalValue });
  };

  const handleSendVerification = async () => {
    if (!user || !user.email) {
      toast.error("Bạn cần cập nhật email trước.");
      return;
    }

    setEmailVerificationState("loading");
    try {
      const result = await authService.resendVerification();
      toast.success(result.message || "Đã gửi email xác thực!");
      setEmailVerificationState("sent");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gửi email thất bại.");
      setEmailVerificationState("idle");
    }
  };

  const handleUpdateSuccess = useCallback(() => {
    router.refresh();
    window.dispatchEvent(new Event("profile-updated"));
  }, [router]);

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết hồ sơ!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 text-center text-destructive">
        {error || "Không tải được hồ sơ."}
      </div>
    );
  }

  const roleLabel =
    user.role === "teacher"
      ? "GIÁO VIÊN"
      : user.role === "admin"
      ? "QUẢN TRỊ VIÊN"
      : "HỌC VIÊN";

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ================= HEADER / HERO SECTION ================= */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar Container with Camera Button */}
          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden aspect-square ring-4 ring-white shadow-md bg-muted">
              <Image
                path={user.avatar || "/avatar.png"}
                alt={user.name || "Avatar"}
                w={160}
                h={160}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {/* Camera Overlay Button */}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center border-2 border-white shadow-md transition-all active:scale-95 cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Info & Action Buttons */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            {/* Role Capsule Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ede4d8] text-[#705c30] border border-[#dfd4c4]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{roleLabel}</span>
            </div>

            {/* Name */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {user.name || user.username}
            </h1>

            {/* Email */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{user.email || "Chưa cập nhật email"}</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleEditClick("Tên", "name", user.name)}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleShareProfile}
                className="px-5 py-2 bg-white hover:bg-muted border border-border text-foreground font-semibold rounded-full text-xs sm:text-sm shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARD 1: PERSONAL INFORMATION ================= */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
              <User className="w-5 h-5 text-primary" />
              <span>Personal Information</span>
            </h2>
          </div>

          {/* 2x2 Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Phone */}
            <div
              className="group cursor-pointer p-3 -m-3 rounded-2xl hover:bg-muted/50 transition-colors"
              onClick={() =>
                handleEditClick("Số điện thoại", "phone", user.phoneNumber)
              }
            >
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Phone Number
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {user.phoneNumber || "Chưa cập nhật"}
                </span>
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Date of Birth */}
            <div
              className="group cursor-pointer p-3 -m-3 rounded-2xl hover:bg-muted/50 transition-colors"
              onClick={() =>
                handleEditClick("Ngày sinh", "birthday", user.dateOfBirth)
              }
            >
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Date of Birth
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {user.dateOfBirth || "Chưa cập nhật"}
                </span>
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Location */}
            <div
              className="group cursor-pointer p-3 -m-3 rounded-2xl hover:bg-muted/50 transition-colors"
              onClick={() => handleEditClick("Địa chỉ", "address", user.province)}
            >
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Location
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {user.province || "Chưa cập nhật"}
                </span>
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Joined Date */}
            <div className="p-3 -m-3">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Joined Date
              </span>
              <span className="text-sm font-bold text-foreground">
                Tháng 3, 2024
              </span>
            </div>
          </div>

          {/* Short Bio */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Short Bio
            </span>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Passionate learner focused on modern education and continuous
              self-improvement. Eager to connect with like-minded individuals in
              the Terra community to share knowledge and cultivate a greener
              future.
            </p>
          </div>
        </div>

        {/* ================= CARD 2: ACCOUNT & SECURITY ================= */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-primary" />
              <span>Account & Security</span>
            </h2>
          </div>

          <div className="divide-y divide-border/60">
            {/* Username */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
                  Tên đăng nhập
                </span>
                <span className="text-sm font-bold text-foreground">
                  {user.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user.username);
                  toast.success("Đã sao chép tên đăng nhập!");
                }}
                className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                title="Sao chép"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Email verification */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
                  Email
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">
                    {user.email || "Chưa cập nhật"}
                  </span>
                  {user.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-state-success bg-state-success/15 px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Đã xác minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Chưa xác minh
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!user.isEmailVerified && user.email && (
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={emailVerificationState === "loading" || emailVerificationState === "sent"}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all disabled:opacity-50"
                  >
                    {emailVerificationState === "loading" ? "Đang gửi..." : emailVerificationState === "sent" ? "Đã gửi" : "Xác minh"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleEditClick("Email", "email", user.email)}
                  className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground font-semibold text-xs rounded-xl transition-colors"
                >
                  Đổi email
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
                  Mật khẩu
                </span>
                <span className="text-sm font-bold text-foreground">
                  ••••••••
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleEditClick("Mật khẩu", "password", "")}
                className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* School */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
                  Trường học
                </span>
                <span className="text-sm font-bold text-foreground">
                  {user.school || "Chưa cập nhật"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleEditClick("Trường", "schoolname", user.school)}
                className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT FIELD */}
      {modalField && (
        <EditProfileModal
          fieldLabel={modalField.label}
          fieldKey={modalField.key}
          currentValue={modalField.value}
          onClose={() => setModalField(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* MODAL UPLOAD AVATAR */}
      {showAvatarModal && (
        <UploadAvatarModal
          onClose={() => setShowAvatarModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
