"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Facebook,
  FileText,
  Calendar,
  MapPin,
  School,
  Copy,
  Shield,
  CheckCircle,
  XCircle,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import EditProfileModal from "@/components/forms/EditProfileModal"; // Import Modal
import UploadAvatarModal from "@/components/forms/UploadAvatarModal";
import Image from "next/image";
import { sendVerificationEmail } from "@/lib/actions/auth.action";
import { ProfileData } from "@/types/auth";


// Kiểu dữ liệu cho field đang được sửa
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
// === 3. CẬP NHẬT COMPONENT CON ProfileInfoRow ===
type VerificationState = "idle" | "loading" | "verified" | "sent";

const ProfileInfoRow = ({
  label,
  value,
  actionLabel = "Chỉnh sửa",
  onActionClick,
  onVerifyClick, // Thêm prop cho nút "Xác minh"
  verificationState, // Thêm state cho nút "Xác minh"
  showVerified = false,
  isVerified = false,
  copyable = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  actionLabel?: string;
  onActionClick?: () => void;
  onVerifyClick?: () => void;
  verificationState?: VerificationState;
  showVerified?: boolean;
  isVerified?: boolean;
  copyable?: boolean;
  icon: React.ElementType;
}) => (
  <div className="group relative">
    <div className="relative flex flex-col sm:flex-row justify-between sm:items-center py-5 px-4 rounded-xl border border-transparent group-hover:bg-gray-50 transition-all duration-300">
      <div className="flex items-center space-x-4 mb-3 sm:mb-0">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <span className="font-semibold text-gray-800 text-base">{label}</span>
      </div>
      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 font-medium">{value}</span>
          {copyable && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(value);
                toast.success("Đã sao chép!");
              }}
              className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-all duration-200 group/copy"
              title="Sao chép"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
        {showVerified && (
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isVerified
                ? "bg-green-100 text-green-700"
                : value
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isVerified ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>
              {isVerified ? "Đã xác minh" : value ? "Chưa xác minh" : "Chưa có"}
            </span>
          </div>
        )}
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md"
          >
            {actionLabel}
          </button>
        )}
        {/* Nút Xác Minh (mới) */}
        {onVerifyClick && (
          <button
            onClick={onVerifyClick}
            disabled={
              verificationState === "loading" ||
              verificationState === "verified" ||
              verificationState === "sent"
            }
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-sm flex items-center gap-2 ${
              verificationState === "verified"
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : verificationState === "loading"
                ? "bg-gray-200 text-gray-500 cursor-wait"
                : verificationState === "sent"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {verificationState === "loading" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {verificationState === "verified"
              ? "Đã xác minh"
              : verificationState === "sent"
              ? "Đã gửi"
              : "Xác minh"}
          </button>
        )}
      </div>
    </div>
  </div>
);

import { User as UserType } from "@/types/auth";

// Hàm chuẩn hóa dữ liệu User từ Backend sang cấu trúc ProfileData
const mapUserToProfileData = (u: UserType | null): ProfileData | null => {
  if (!u) return null;
  const birthday = u.birthday ? new Date(u.birthday) : null;
  return {
    username: u.username,
    phoneNumber: u.phone ?? '',
    isPhoneVerified: u.isPhoneVerified ?? false,
    email: u.email ?? '',
    isEmailVerified: u.isEmailVerified ?? false,
    password: '********',
    facebookLinked: false,
    name: u.username,
    dateOfBirth: birthday ? birthday.toLocaleDateString('vi-VN') : '',
    dateOfBirthValue: birthday ? birthday.toISOString().split('T')[0] : '',
    province: u.address || '',
    school: u.schoolname || '',
    role: u.role || 'student',
    avatar: u.img || undefined
  };
};

// --- Component Trang Profile Chính (Client Component) ---
interface ProfilePageProps {
  user?: UserType; // Nhận User thô từ Backend truyền qua Server Component
  type?: string;
}

export default function ProfilePage({
  user: initialUser,
  type,
}: ProfilePageProps = {}) {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(mapUserToProfileData(initialUser || null));
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  // State để quản lý modal đang mở
  const [modalField, setModalField] = useState<EditingField | null>(null);
  // State để quản lý modal upload avatar
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // --- 4. THÊM STATE CHO VIỆC GỬI EMAIL/SĐT ---
  const [emailVerificationState, setEmailVerificationState] =
    useState<VerificationState>("idle");
  const [phoneVerificationState, setPhoneVerificationState] =
    useState<VerificationState>("idle");

  // Cập nhật state khi initialUser thay đổi (bao gồm cả khi router.refresh() hoàn thành)
  useEffect(() => {
    if (initialUser) {
      setUser(mapUserToProfileData(initialUser));
      setEmailVerificationState(
        initialUser.isEmailVerified ? "verified" : "idle"
      );
      setPhoneVerificationState(
        initialUser.isPhoneVerified ? "verified" : "idle"
      );
    }
  }, [initialUser]);

  // Hàm wrapper để mở modal
  const handleEditClick = (
    label: string,
    key: EditingField["key"],
    value: string
  ) => {
    // Nếu là ngày sinh, sử dụng giá trị ISO cho input date
    const modalValue =
      key === "birthday" ? user?.dateOfBirthValue || "" : value;
    setModalField({ label, key, value: modalValue });
  };

  // --- 5. HÀM MỚI ĐỂ GỬI EMAIL XÁC MINH ---
  const handleSendVerification = async () => {
    if (!user || !user.email) {
      toast.error("Bạn cần cập nhật email trước.");
      return;
    }

    setEmailVerificationState("loading");
    try {
      const result = await sendVerificationEmail();
      if (result.success) {
        toast.success(result.success);
        setEmailVerificationState("sent"); // Chuyển sang trạng thái "Đã gửi"
      } else {
        toast.error(result.error || "Gửi email thất bại.");
        setEmailVerificationState("idle"); // Cho phép thử lại
      }
    } catch (err) {
      toast.error("Lỗi máy chủ.");
      setEmailVerificationState("idle"); // Cho phép thử lại
    }
  };

  // HÀM MỚI ĐỂ XỬ LÝ KHI UPDATE THÀNH CÔNG
  const handleUpdateSuccess = useCallback(() => {
    // 1. Refresh dữ liệu từ Server Component
    router.refresh();
    
    // 2. BẮN SỰ KIỆN ĐỂ BÁO CHO NAVIGATION
    window.dispatchEvent(new Event("profile-updated"));
  }, [router]);


  // Xử lý trạng thái Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] ">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  // Xử lý trạng thái Lỗi
  if (error || !user) {
    return (
      <div className="p-8 text-center text-red-500">
        {error || "Không tải được hồ sơ."}
      </div>
    );
  }

  // Render giao diện chính
  return (
    <div className=" font-sans min-h-screen">
      <div className="relative overflow-hidden">
        <main className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Card Header (Avatar, Title) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
              <div className="relative p-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 text-balance">
                      Hồ sơ của tôi
                    </h1>
                    <p className="text-gray-600 text-base">
                      Quản lý thông tin cá nhân và cài đặt tài khoản
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="inline-flex mt-4 sm:mt-0 items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Quản lý tài khoản</span>
                  </Link>
                </div>
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                      {user.avatar ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${user.avatar}`}
                          alt={user.name || "Avatar"}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center text-6xl font-bold text-blue-600">
                          <span>
                            {user.name ? user.name[0].toUpperCase() : "A"}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-1 right-1 w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-100 transition-all duration-300 transform hover:scale-110"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Thông tin tài khoản */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Thông tin tài khoản
                    </h2>
                    <p className="text-gray-500">
                      Quản lý thông tin đăng nhập và bảo mật
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  <ProfileInfoRow
                    label="Tên đăng nhập"
                    value={user.username || ""}
                    onActionClick={() =>
                      navigator.clipboard.writeText(user.username)
                    }
                    actionLabel="Sao chép"
                    copyable={true}
                    icon={User}
                  />
                  <ProfileInfoRow
                    label="Số điện thoại"
                    value={user.phoneNumber}
                    onActionClick={() =>
                      handleEditClick(
                        "Số điện thoại",
                        "phone",
                        user.phoneNumber
                      )
                    }
                    showVerified={true}
                    isVerified={user.isPhoneVerified}
                    // Logic xác minh SĐT (tạm thời)
                    onVerifyClick={
                      user.phoneNumber && !user.isPhoneVerified
                        ? () =>
                            toast.info("Chức năng xác minh SĐT đang phát triển")
                        : undefined
                    }
                    verificationState={phoneVerificationState}
                    icon={Phone}
                  />
                  {/* --- 7. CẬP NHẬT DÒNG EMAIL --- */}
                                   {" "}
                  <ProfileInfoRow
                    label="Email"
                    value={user.email}
                    onActionClick={() =>
                      handleEditClick("Email", "email", user.email)
                    }
                    // Chỉ hiện nút "Xác minh" nếu email đã có VÀ chưa được xác minh
                    onVerifyClick={
                      user.email && !user.isEmailVerified
                        ? handleSendVerification
                        : undefined
                    }
                    verificationState={emailVerificationState}
                    showVerified={true}
                    isVerified={user.isEmailVerified}
                    icon={Mail}
                  />
                  <ProfileInfoRow
                    label="Mật khẩu"
                    value={user.password || "********"}
                    onActionClick={() =>
                      handleEditClick("Mật khẩu", "password", "")
                    }
                    icon={Lock}
                  />
                  <ProfileInfoRow
                    label="Liên kết Facebook"
                    value={
                      user.facebookLinked ? "Đã liên kết" : "Chưa liên kết"
                    }
                    actionLabel={
                      user.facebookLinked ? "Hủy liên kết" : "Liên kết"
                    }
                    onActionClick={() =>
                      toast.info("Chức năng đang phát triển")
                    }
                    icon={Facebook}
                  />
                </div>
              </div>
            </div>

            {/* Card Thông tin cá nhân */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Thông tin cá nhân
                    </h2>
                    <p className="text-gray-500">
                      Cập nhật thông tin để không bị nhầm lẫn
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  <ProfileInfoRow
                    label="Tên"
                    value={user.name || "Chưa cập nhật"}
                    onActionClick={() =>
                      handleEditClick("Tên", "name", user.name)
                    }
                    icon={FileText}
                  />
                  <ProfileInfoRow
                    label="Ngày sinh"
                    value={user.dateOfBirth || "Chưa cập nhật"}
                    onActionClick={() =>
                      handleEditClick("Ngày sinh", "birthday", user.dateOfBirth)
                    }
                    icon={Calendar}
                  />
                  <ProfileInfoRow
                    label="Tỉnh"
                    value={user.province || "Chưa cập nhật"}
                    onActionClick={() =>
                      handleEditClick("Tỉnh", "address", user.province)
                    }
                    icon={MapPin}
                  />
                  <ProfileInfoRow
                    label="Trường"
                    value={user.school || "Chưa cập nhật"}
                    onActionClick={() =>
                      handleEditClick("Trường", "schoolname", user.school)
                    }
                    icon={School}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* RENDER MODAL NẾU modalField CÓ GIÁ TRỊ */}
      {modalField && (
        <EditProfileModal
          fieldLabel={modalField.label}
          fieldKey={modalField.key}
          currentValue={modalField.value}
          onClose={() => setModalField(null)}
          onSuccess={handleUpdateSuccess} // Truyền hàm fetch data để làm mới
        />
      )}

      {/* RENDER MODAL UPLOAD AVATAR */}
      {showAvatarModal && (
        <UploadAvatarModal  
          onClose={() => setShowAvatarModal(false)}
          onSuccess={handleUpdateSuccess  } // Truyền hàm fetch data để làm mới
        />
      )}
    </div>
  );
}
