// components/EditProfileModal.tsx

"use client";

import { useState } from "react";
import { X, Phone, Mail, Lock, User, FileText, Calendar, MapPin, School } from "lucide-react";
import { updateUserProfile, changePassword } from "@/lib/actions/user.action"; // Import cả 2 actions
import { toast } from "react-toastify";

interface EditProfileModalProps {
  fieldLabel: string; // "Số điện thoại", "Email", "Tên", v.v.
  fieldKey: "phone" | "email" | "name" | "schoolname" | "address" | "birthday" | "password";
  currentValue: string;
  onClose: () => void;
  onSuccess: () => void; // Callback để refresh data trên trang profile
}

export default function EditProfileModal({ 
  fieldLabel, 
  fieldKey,
  currentValue, 
  onClose, 
  onSuccess 
}: EditProfileModalProps) {
  
  const [newValue, setNewValue] = useState(currentValue);
  const [confirmPassword, setConfirmPassword] = useState(""); // Thêm state cho confirm password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Định nghĩa nội dung cho từng modal ---
  let title = "Chỉnh sửa thông tin";
  let description = "Cập nhật thông tin của bạn.";
  let inputType: "text" | "email" | "password" | "date" = "text";
  let inputIcon = <User size={18} className="text-gray-400" />;
  let placeholder = "";

  // Dùng switch để cấu hình modal dựa trên `fieldKey`
  switch (fieldKey) {
    case "phone":
      title = "Chỉnh sửa Số điện thoại";
      description = "Bạn sẽ cần xác thực thông tin sau khi cập nhật.";
      inputType = "text";
      inputIcon = <Phone size={18} className="text-gray-400" />;
      placeholder = "Nhập số điện thoại";
      break;
    case "email":
      title = "Chỉnh sửa Email";
      description = "Bạn sẽ cần xác thực email sau khi cập nhật.";
      inputType = "email";
      inputIcon = <Mail size={18} className="text-gray-400" />;
      placeholder = "Nhập địa chỉ email";
      break;
    case "name":
      title = "Chỉnh sửa Tên";
      description = "Cập nhật tên hiển thị của bạn.";
      inputType = "text";
      inputIcon = <FileText size={18} className="text-gray-400" />;
      placeholder = "Nhập tên của bạn";
      break;
    case "birthday":
      title = "Chỉnh sửa Ngày sinh";
      description = "Cập nhật ngày sinh của bạn.";
      inputType = "date";
      inputIcon = <Calendar size={18} className="text-gray-400" />;
      placeholder = "";
      break;
    case "address":
      title = "Chỉnh sửa Địa chỉ";
      description = "Cập nhật tỉnh/thành phố của bạn.";
      inputType = "text";
      inputIcon = <MapPin size={18} className="text-gray-400" />;
      placeholder = "Nhập tỉnh/thành phố";
      break;
    case "schoolname":
      title = "Chỉnh sửa Trường học";
      description = "Cập nhật tên trường học của bạn.";
      inputType = "text";
      inputIcon = <School size={18} className="text-gray-400" />;
      placeholder = "Nhập tên trường học";
      break;
    case "password":
      title = "Đổi mật khẩu";
      description = "Nhập mật khẩu mới cho tài khoản của bạn.";
      inputType = "password";
      inputIcon = <Lock size={18} className="text-gray-400" />;
      placeholder = "Nhập mật khẩu mới";
      break;
  }
  // ------------------------------------------
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Xử lý đổi mật khẩu
      if (fieldKey === 'password') {
        const result = await changePassword(newValue, confirmPassword);
        
        if (result.success) {
          toast.success("Đổi mật khẩu thành công!");
          onSuccess(); // Gọi hàm refresh data của trang profile
          onClose();   // Đóng modal
        } else {
          setError(result.error || "Đổi mật khẩu thất bại");
        }
        setIsLoading(false);
        return;
      }

      // Xử lý cho tất cả các trường khác
      const result = await updateUserProfile(fieldKey, newValue);

      if (result.success) {
        toast.success("Cập nhật thành công!");
        onSuccess(); // Gọi hàm refresh data của trang profile
        onClose();   // Đóng modal
      } else {
        setError(result.error || "Lỗi không xác định");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
    
    setIsLoading(false);
  };

  return (
    // Lớp nền mờ
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        {/* Header Modal */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">

            {/* Field chính */}
            <div>
              <label htmlFor={fieldKey} className="text-sm font-medium text-gray-700">
                {fieldKey === 'password' ? 'Mật khẩu mới' : fieldLabel}
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  {inputIcon}
                </span>
                <input
                  id={fieldKey}
                  name={fieldKey}
                  type={inputType}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Field confirm password - chỉ hiện với password */}
            {fieldKey === 'password' && (
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Nhập lại mật khẩu mới
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock size={18} className="text-gray-400" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Footer Modal (Nút bấm) */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}