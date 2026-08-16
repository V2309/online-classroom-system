"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Lock, Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const authData = await authService.login({ email, password });
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
          "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ── Left panel: brand ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden bg-primary text-primary-foreground">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md shadow-sm">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-3xl font-heading font-bold text-white tracking-tight">DoCus</span>
          </div>

          <div className="space-y-2.5">
            <h2 className="text-2xl font-heading font-bold text-white">
              Nền tảng lớp học trực tuyến
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Quản lý lớp học, bài tập và trao đổi học tập trong một môi trường hiện đại và liền mạch.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { icon: "📚", text: "Quản lý lớp học thông minh" },
              { icon: "✏️", text: "Giao & chấm bài tập tức thì" },
              { icon: "💬", text: "Nhóm chat & thảo luận thời gian thực" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-white/15 backdrop-blur-md text-white shadow-2xs text-left"
              >
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-2xl font-heading font-bold text-foreground">DoCus</span>
        </div>

        <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-border shadow-sm">
          {/* Heading */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-1.5">
              Đăng nhập tài khoản
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Nhập thông tin đăng nhập để tiếp tục vào hệ thống
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium rounded-2xl p-3.5 flex items-center gap-2.5 mb-6 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-foreground mb-1.5">
                Email hoặc Số điện thoại
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  placeholder="name@example.com hoặc SĐT"
                  required
                  className="w-full bg-card text-foreground border border-border rounded-2xl px-4 py-3 pl-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-foreground">
                  Mật khẩu
                </label>
                <Link
                  href="#"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-card text-foreground border border-border rounded-2xl px-4 py-3 pl-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">hoặc</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={() => console.log("Đăng nhập Google")}
            className="w-full py-3 px-4 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-2xl transition-all shadow-2xs flex items-center justify-center gap-2.5 text-xs sm:text-sm active:scale-95 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width={18} height={18}>
              <path d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z" fill="#EA4335" />
              <path d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z" fill="#FBBC05" />
              <path d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z" fill="#34A853" />
              <path d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z" fill="#4285F4" />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          {/* Footer link to sign up */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/sign-up"
              className="block w-full py-3 px-4 bg-muted/60 hover:bg-muted border border-border/80 text-foreground font-semibold rounded-2xl transition-all text-xs sm:text-sm text-center shadow-2xs"
            >
              Chưa có tài khoản? Đăng ký ngay
            </Link>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <span className="text-primary font-semibold">Điều khoản dịch vụ</span> và{" "}
              <span className="text-primary font-semibold">Chính sách bảo mật</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}