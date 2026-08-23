"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProvinceSelect from "@/components/ProvinceSelect";
import { authService } from "@/services/auth.service";
import { signupSchema } from "@/lib/formValidationSchema";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setGoogleLoading(true);
      try {
        const token = tokenResponse.access_token;
        const authData = await authService.googleLogin(token, selectedRole);
        const role = authData.user?.role;
        window.dispatchEvent(new CustomEvent("user-logged-in"));

        if (role === "admin") router.push("/dashboard");
        else if (role === "teacher") router.push("/class");
        else if (role === "student") router.push("/overview");
        else router.push("/");
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Đăng ký bằng Google thất bại. Vui lòng thử lại."
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google Signup Error:", err);
      setError("Đăng ký bằng Google đã bị hủy hoặc xảy ra lỗi.");
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const raw = {
      username: String(formData.get("username") || ""),
      class_name: String(formData.get("class_name") || ""),
      school: String(formData.get("school") || ""),
      birthday: String(formData.get("birthday") || ""),
      province: String(formData.get("province") || ""),
      info: String(formData.get("info") || ""),
      role: String(formData.get("role") || ""),
      password: String(formData.get("password") || ""),
      "confirm-password": String(formData.get("confirm-password") || ""),
      terms: formData.get("terms") ? true : false,
    };

    const parsed = signupSchema.safeParse(raw);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      setError("Vui lòng kiểm tra và sửa các lỗi bên dưới.");
      setLoading(false);
      autoHideAlert();
      return;
    }

    const contact = raw.info;
    let email: string | undefined = undefined;
    let phone: string | undefined = undefined;
    if (contact.includes("@")) email = contact;
    else phone = contact;

    const data = {
      username: raw.username,
      class_name: raw.class_name,
      schoolname: raw.school,
      birthday: raw.birthday,
      address: raw.province,
      email,
      phone,
      role: raw.role,
      password: raw.password,
    };

    try {
      const response = await authService.signup(data);
      if (response) {
        setSuccess(true);
        form.reset();
        autoHideAlert();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";

      setError(errorMessage);
      autoHideAlert();
    } finally {
      setLoading(false);
    }

    function autoHideAlert() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setError(null);
        setSuccess(false);
      }, 4000);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-3 sm:p-6 overflow-hidden select-none">
      {/* Toast Alert */}
      {(error || success) && (
        <div
          className={`fixed top-4 right-4 z-50 transition-all duration-300 p-3.5 px-4 rounded-2xl shadow-xl flex items-center gap-2.5 border ${
            error
              ? "bg-white border-destructive/30 text-destructive"
              : "bg-white border-state-success/30 text-state-success"
          }`}
        >
          {error && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {success && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {error || "Đăng ký thành công! Bạn có thể đăng nhập ngay."}
          </span>
        </div>
      )}

      {/* Main Single Centered Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-7 space-y-3.5 my-auto">
        {/* Brand & Heading */}
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">DoCus</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
            Tạo mới tài khoản
          </h1>
          <p className="text-[11px] sm:text-xs text-secondary">
            Điền thông tin để bắt đầu học tập và quản lý lớp học
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Hàng 1: Họ tên & Vai trò */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-foreground mb-1">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
              />
              {fieldErrors.username && (
                <p className="mt-0.5 text-[11px] font-semibold text-destructive">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-bold text-foreground mb-1">
                Vai trò <span className="text-destructive">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs h-[38px] sm:h-[40px]"
              >
                <option value="">Chọn vai trò của bạn</option>
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
              {fieldErrors.role && (
                <p className="mt-0.5 text-[11px] font-semibold text-destructive">{fieldErrors.role}</p>
              )}
            </div>
          </div>

          {/* Hàng 2: Lớp học & Tên trường */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="class_name" className="block text-xs font-bold text-foreground mb-1">
                Lớp học
              </label>
              <input
                id="class_name"
                name="class_name"
                type="text"
                placeholder="Ví dụ: 10A1"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label htmlFor="school" className="block text-xs font-bold text-foreground mb-1">
                Tên trường học
              </label>
              <input
                id="school"
                name="school"
                type="text"
                placeholder="THPT Chuyên..."
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Hàng 3: Ngày sinh & Tỉnh / TP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="birthday" className="block text-xs font-bold text-foreground mb-1">
                Ngày sinh
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                autoComplete="bday"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs"
              />
            </div>

            <div>
              <label htmlFor="province" className="block text-xs font-bold text-foreground mb-1">
                Tỉnh / Thành phố
              </label>
              <ProvinceSelect />
            </div>
          </div>

          {/* Hàng 4: Email / SĐT */}
          <div>
            <label htmlFor="info" className="block text-xs font-bold text-foreground mb-1">
              Email hoặc Số điện thoại <span className="text-destructive">*</span>
            </label>
            <input
              id="info"
              name="info"
              type="text"
              placeholder="name@example.com hoặc SĐT"
              className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
            />
            {fieldErrors.info && (
              <p className="mt-0.5 text-[11px] font-semibold text-destructive">{fieldErrors.info}</p>
            )}
          </div>

          {/* Hàng 5: Mật khẩu & Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-foreground mb-1">
                Mật khẩu <span className="text-destructive">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
              />
              {fieldErrors.password && (
                <p className="mt-0.5 text-[11px] font-semibold text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-foreground mb-1">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
              />
              {fieldErrors["confirm-password"] && (
                <p className="mt-0.5 text-[11px] font-semibold text-destructive">{fieldErrors["confirm-password"]}</p>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="w-3.5 h-3.5 rounded-md accent-primary mt-0.5 cursor-pointer"
            />
            <label htmlFor="terms" className="text-[11px] text-secondary leading-tight cursor-pointer select-none">
              Tôi đồng ý với{" "}
              <Link href="#" className="text-primary font-semibold hover:underline">
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link href="#" className="text-primary font-semibold hover:underline">
                Chính sách bảo mật
              </Link>
              .
            </label>
          </div>
          {fieldErrors.terms && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.terms}</p>
          )}

          {/* Submit Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 sm:py-3 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Tạo ngay tài khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-medium">hoặc đăng ký bằng Google</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Role toggle for Google signup */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-[11px] font-bold text-foreground">Chọn vai trò:</span>
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === "student"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎓 Học sinh
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("teacher")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === "teacher"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👨‍🏫 Giáo viên
            </button>
          </div>
        </div>

        {/* Google Signup Button */}
        <button
          type="button"
          disabled={loading || googleLoading}
          onClick={() => loginWithGoogle()}
          className="w-full py-2.5 px-4 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-2xl transition-all shadow-2xs flex items-center justify-center gap-2.5 text-xs sm:text-sm active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Đang kết nối Google...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width={18} height={18}>
                <path d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z" fill="#EA4335" />
                <path d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z" fill="#FBBC05" />
                <path d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z" fill="#34A853" />
                <path d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z" fill="#4285F4" />
              </svg>
              <span>Đăng ký nhanh với Google</span>
            </>
          )}
        </button>

        {/* Link back to sign in */}
        <div className="pt-2 border-t border-border/60 text-center">
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-secondary hover:text-primary transition-colors inline-block"
          >
            Đã có tài khoản? <span className="text-primary underline font-bold">Đăng nhập ngay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
