'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, ArrowRight, Zap, Crown } from 'lucide-react';
import { PricingModal } from './PricingModal';
import { PlanType } from '@/services/payment.service';
import { useUser } from '@/hooks/useUser';

export const PricingSection: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('PRO');

  const handleAction = (plan: PlanType) => {
    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    setSelectedPlan(plan);
    setModalOpen(true);
  };


  return (
    <>
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bảng giá dịch vụ</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
            Chọn gói nâng cấp nâng tầm trải nghiệm
          </h2>
          <p className="text-sm sm:text-base text-secondary leading-relaxed">
            Thanh toán tiện lợi & bảo mật qua ví <strong>ZaloPay</strong> hoặc <strong>MoMo</strong>. Kích hoạt tức thì.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Gói Miễn phí */}
          <div className="bg-white rounded-3xl p-7 border border-border shadow-sm flex flex-col justify-between space-y-6 hover:border-primary/30 transition-all text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground">
                  Gói Miễn phí
                </h3>
                <span className="text-[11px] font-bold text-secondary bg-muted px-2.5 py-0.5 rounded-full">
                  Cơ bản
                </span>
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
            <Link
              href="/sign-up"
              className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-2xl text-center text-xs sm:text-sm transition-all"
            >
              Bắt đầu miễn phí
            </Link>
          </div>

          {/* 2. Gói Chuyên nghiệp (Pro) */}
          <div className="bg-white rounded-3xl p-7 border-2 border-primary shadow-lg relative flex flex-col justify-between space-y-6 hover:shadow-xl transition-all text-left">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-0.8 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>Phổ biến nhất</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-1.5">
                  <span>Gói Chuyên nghiệp</span>
                </h3>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Cá nhân / GV
                </span>
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
                  'Thanh toán qua ZaloPay / MoMo',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleAction('PRO')}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl text-center text-xs sm:text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Nâng cấp Pro ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Gói Cao cấp (Premium) */}
          <div className="bg-white rounded-3xl p-7 border border-amber-400/60 shadow-md relative flex flex-col justify-between space-y-6 hover:shadow-xl transition-all text-left bg-gradient-to-b from-amber-500/[0.03] to-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Gói Cao cấp</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Trường học / VIP
                </span>
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
            <button
              onClick={() => handleAction('PREMIUM')}
              className="w-full py-3.5 px-4 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-2xl text-center text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Nâng cấp Premium</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      </section>

      {/* Modal Thanh toán */}
      <PricingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlan={selectedPlan}
      />
    </>
  );
};
