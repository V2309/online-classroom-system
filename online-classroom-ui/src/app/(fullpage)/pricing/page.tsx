'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  ArrowRight,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { PricingModal } from '@/components/pricing/PricingModal';
import { PlanType } from '@/services/payment.service';

export default function FullPagePricing() {
  const { user } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('PRO');

  const currentPlan = (user?.plan as PlanType) || 'FREE';
  const planExpiresAt = user?.planExpiresAt;

  const handleOpenModal = (plan: PlanType) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const getPlanBadge = (plan: PlanType) => {
    switch (plan) {
      case 'PREMIUM':
        return {
          label: 'Gói Cao cấp (Premium)',
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          icon: Crown,
        };
      case 'PRO':
        return {
          label: 'Gói Chuyên nghiệp (Pro)',
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: Zap,
        };
      default:
        return {
          label: 'Gói Miễn phí (Free)',
          color: 'bg-muted text-secondary border-border',
          icon: Sparkles,
        };
    }
  };

  const currentBadge = getPlanBadge(currentPlan);
  const CurrentIcon = currentBadge.icon;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white pb-20">
      {/* ── TOP NAVIGATION ── */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/70 z-40 h-[70px]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-secondary hover:text-foreground transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Quay lại bảng điều khiển</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-heading font-bold text-foreground tracking-tight">
              DoCus
            </span>
          </Link>

          <div className="text-right">
            {user && (
              <span className="text-xs font-semibold text-secondary hidden sm:inline">
                Đăng nhập: <strong>{user.username}</strong>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent/70 border border-primary/20 text-primary rounded-full font-bold text-xs shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nâng cấp tính năng giảng dạy & học tập</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-bold text-foreground tracking-tight">
            Chọn gói dịch vụ phù hợp cho bạn
          </h1>

          <p className="text-sm sm:text-base text-secondary max-w-xl mx-auto leading-relaxed">
            Mở khóa toàn bộ sức mạnh của nền tảng DoCus. Thanh toán tức thì qua ví{' '}
            <strong>ZaloPay</strong> hoặc <strong>MoMo</strong>.
          </p>
        </div>

        {/* Current Plan Status Card (If user logged in) */}
        {user && (
          <div className="bg-card rounded-3xl p-6 sm:p-7 border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-2xs">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Gói tài khoản hiện tại:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentBadge.color}`}
                  >
                    {currentBadge.label}
                  </span>
                </div>
                <p className="text-xs text-secondary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {planExpiresAt
                      ? `Thời hạn sử dụng đến: ${new Date(
                          planExpiresAt,
                        ).toLocaleDateString('vi-VN')}`
                      : 'Gói vĩnh viễn (Không giới hạn thời gian)'}
                  </span>
                </p>
              </div>
            </div>

            {currentPlan !== 'PREMIUM' && (
              <button
                onClick={() => handleOpenModal('PRO')}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Nâng cấp ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── 3 PRICING TIERS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Gói Miễn phí */}
          <div
            className={`bg-card rounded-3xl p-7 border transition-all flex flex-col justify-between space-y-6 text-left ${
              currentPlan === 'FREE'
                ? 'border-primary/40 shadow-sm'
                : 'border-border shadow-2xs hover:border-primary/30'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground">
                  Gói Miễn phí
                </h3>
                {currentPlan === 'FREE' && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Đang sử dụng
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">
                Dành cho người mới bắt đầu trải nghiệm dạy & học trực tuyến.
              </p>
              <div className="pt-2">
                <span className="text-3xl font-heading font-bold text-foreground">
                  0đ
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ vĩnh viễn</span>
              </div>
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                {[
                  'Quản lý tối đa 5 lớp học',
                  'Giao bài tập & nộp bài cơ bản',
                  'Tích hợp bảng trắng & phòng họp',
                  'Báo cáo điểm số tiêu chuẩn',
                  'Hỗ trợ qua cộng đồng',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                disabled
                className="w-full py-3 px-4 bg-muted text-muted-foreground font-semibold rounded-2xl text-center text-xs sm:text-sm cursor-not-allowed"
              >
                {currentPlan === 'FREE' ? 'Gói hiện tại' : 'Gói cơ bản'}
              </button>
            </div>
          </div>

          {/* 2. Gói Chuyên nghiệp (Pro) */}
          <div className="bg-card rounded-3xl p-7 border-2 border-primary shadow-xl relative flex flex-col justify-between space-y-6 hover:shadow-2xl transition-all text-left">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-0.8 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>Phổ biến nhất</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-1.5">
                  <span>Gói Chuyên nghiệp</span>
                </h3>
                {currentPlan === 'PRO' ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Đang kích hoạt
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Cá nhân / GV
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">
                Dành cho giáo viên và học sinh muốn học tập & giảng dạy chuyên sâu.
              </p>
              <div className="pt-2">
                <span className="text-3xl font-heading font-bold text-primary">
                  1.000đ
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ tháng</span>
              </div>
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                {[
                  'Không giới hạn số lớp học & học sinh',
                  'Trợ lý AI tạo Quiz & Podcast không giới hạn',
                  'Bảng trắng tương tác thời gian thực',
                  'Xuất báo cáo điểm thi Excel & PDF',
                  'Tải lên tài liệu dung lượng lớn',
                  'Hỗ trợ thanh toán ZaloPay / MoMo',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleOpenModal('PRO')}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl text-center text-xs sm:text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{currentPlan === 'PRO' ? 'Gia hạn gói Pro' : 'Nâng cấp Pro ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Gói Cao cấp (Premium) */}
          <div className="bg-card rounded-3xl p-7 border border-amber-400/60 shadow-md relative flex flex-col justify-between space-y-6 hover:shadow-xl transition-all text-left bg-gradient-to-b from-amber-500/[0.04] to-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Gói Cao cấp</span>
                </h3>
                {currentPlan === 'PREMIUM' ? (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    Đang kích hoạt
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    Trường học / VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">
                Dành cho các cơ sở giáo dục, trung tâm và trường học quy mô lớn.
              </p>
              <div className="pt-2">
                <span className="text-3xl font-heading font-bold text-foreground">
                  2.000đ
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ tháng</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-border/60">
                {[
                  'Mọi đặc quyền của gói Chuyên nghiệp',
                  'Lưu trữ đám mây Cloudflare R2 dung lượng cao',
                  'Họp trực tuyến HD không giới hạn thời lượng',
                  'Tùy chỉnh thương hiệu riêng cho lớp học',
                  'Hỗ trợ kỹ thuật 24/7 ưu tiên từ chuyên gia',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleOpenModal('PREMIUM')}
                className="w-full py-3.5 px-4 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-2xl text-center text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {currentPlan === 'PREMIUM'
                    ? 'Gia hạn gói Premium'
                    : 'Nâng cấp Premium'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── FAQ SECTION ── */}
        <div className="bg-card rounded-3xl p-8 border border-border text-left space-y-6">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Câu hỏi thường gặp</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">
                Tôi có thể thanh toán bằng phương thức nào?
              </h4>
              <p className="text-secondary leading-relaxed">
                DoCus hỗ trợ thanh toán qua <strong>Ví ZaloPay</strong> và <strong>Ví MoMo</strong> (bao gồm quét mã QR, thẻ ATM nội địa và thẻ quốc tế Visa/Mastercard).
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">
                Tài khoản được kích hoạt trong bao lâu?
              </h4>
              <p className="text-secondary leading-relaxed">
                Hệ thống tự động kích hoạt gói dịch vụ và gia hạn thời gian sử dụng ngay khi giao dịch thành công (thường dưới 5 giây).
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">
                Tôi gia hạn trước khi hết hạn có bị mất ngày cũ không?
              </h4>
              <p className="text-secondary leading-relaxed">
                Không. Hệ thống sẽ tự động cộng nối tiếp thời hạn mới vào ngày hết hạn hiện tại của bạn.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">
                Giao dịch có an toàn không?
              </h4>
              <p className="text-secondary leading-relaxed flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Toàn bộ giao dịch được mã hóa SSL chuẩn quốc tế từ cổng thanh toán.</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlan={selectedPlan}
      />
    </div>
  );
}
