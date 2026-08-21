'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ShieldCheck, Zap, Sparkles, Loader2 } from 'lucide-react';
import {
  BillingCycle,
  PaymentProvider,
  PlanType,
  paymentService,
} from '@/services/payment.service';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: PlanType;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'PRO',
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    initialPlan === 'FREE' ? 'PRO' : initialPlan,
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [provider, setProvider] = useState<PaymentProvider>('ZALOPAY');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedPlan(initialPlan === 'FREE' ? 'PRO' : initialPlan);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialPlan]);

  if (!isOpen || !mounted) return null;

  const planInfo = {
    PRO: {
      name: 'Gói Chuyên nghiệp',
      badge: 'Phổ biến nhất',
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      monthlyPriceFormatted: '1.000đ',
      yearlyPriceFormatted: '10.000đ',
      features: [
        'Không giới hạn số lượng lớp học & học sinh',
        'Trợ lý AI tạo Quiz & Podcast không giới hạn',
        'Bảng trắng cộng tác thời gian thực',
        'Xuất bảng điểm Excel & thống kê chi tiết',
      ],
    },
    PREMIUM: {
      name: 'Gói Cao cấp',
      badge: 'Doanh nghiệp / Trường học',
      monthlyPrice: 2000,
      yearlyPrice: 20000,
      monthlyPriceFormatted: '2.000đ',
      yearlyPriceFormatted: '20.000đ',
      features: [
        'Mọi đặc quyền của gói Chuyên nghiệp',
        'Lưu trữ đám mây Cloudflare R2 dung lượng cao',
        'Họp trực tuyến HD không giới hạn thời lượng',
        'Tùy biến thương hiệu lớp học & hỗ trợ 24/7',
      ],
    },
  };


  const currentPlan = planInfo[selectedPlan as 'PRO' | 'PREMIUM'];
  const currentAmount =
    billingCycle === 'MONTHLY'
      ? currentPlan.monthlyPrice
      : currentPlan.yearlyPrice;
  const currentAmountFormatted =
    billingCycle === 'MONTHLY'
      ? currentPlan.monthlyPriceFormatted
      : currentPlan.yearlyPriceFormatted;

  const handleCheckout = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await paymentService.createSubscription({
        plan: selectedPlan,
        billingCycle,
        provider,
      });

      if (result?.payUrl) {
        window.location.href = result.payUrl;
      } else {
        throw new Error('Không nhận được đường dẫn thanh toán.');
      }
    } catch (error: any) {
      console.error('Lỗi tạo đơn thanh toán:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Đã có lỗi xảy ra khi khởi tạo thanh toán.';
      if (error?.response?.status === 401) {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(
          window.location.pathname,
        )}`;
      } else {
        setErrorMessage(msg);
      }
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] w-screen h-screen overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-card rounded-3xl border border-border shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 my-auto text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nâng cấp tài khoản DoCus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
            Chọn gói dịch vụ phù hợp với bạn
          </h2>
          <p className="text-xs sm:text-sm text-secondary">
            Kích hoạt các tính năng giảng dạy và học tập nâng cao tức thì.
          </p>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-2 gap-3">
          {(['PRO', 'PREMIUM'] as PlanType[]).map((plan) => {
            const isSelected = selectedPlan === plan;
            const item = planInfo[plan as 'PRO' | 'PREMIUM'];
            return (
              <div
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all text-left relative ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border bg-background hover:border-primary/40'
                }`}
              >
                {plan === 'PRO' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {plan === 'PREMIUM' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <h4 className="font-heading font-bold text-sm sm:text-base text-foreground mt-1.5">
                  {item.name}
                </h4>
                <p className="text-xs font-bold text-primary mt-1">
                  {billingCycle === 'MONTHLY'
                    ? `${item.monthlyPriceFormatted}/tháng`
                    : `${item.yearlyPriceFormatted}/năm`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/60 rounded-2xl border border-border">
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            Chu kỳ thanh toán:
          </span>
          <div className="flex items-center gap-1.5 bg-white dark:bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              Hàng tháng
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              <span>Hàng năm</span>
              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Provider Selection */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Phương thức thanh toán
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* VNPAY */}
            <div
              onClick={() => setProvider('VNPAY')}
              className={`cursor-pointer rounded-2xl p-3 border flex sm:flex-col items-center sm:items-start gap-2.5 transition-all ${
                provider === 'VNPAY'
                  ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-border bg-white dark:bg-background hover:border-blue-400'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0 text-blue-600 font-black text-[11px]">
                VNP
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">
                  Cổng VNPAY
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  QR / 40+ Ngân hàng
                </p>
              </div>
            </div>

            {/* ZaloPay */}
            <div
              onClick={() => setProvider('ZALOPAY')}
              className={`cursor-pointer rounded-2xl p-3 border flex sm:flex-col items-center sm:items-start gap-2.5 transition-all ${
                provider === 'ZALOPAY'
                  ? 'border-emerald-600 bg-emerald-600/5 ring-2 ring-emerald-600/20 shadow-xs'
                  : 'border-border bg-white dark:bg-background hover:border-emerald-400'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold text-xs">
                Zalo
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">
                  Ví ZaloPay
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  QR / Thẻ ATM / Visa
                </p>
              </div>
            </div>

            {/* MoMo */}
            <div
              onClick={() => setProvider('MOMO')}
              className={`cursor-pointer rounded-2xl p-3 border flex sm:flex-col items-center sm:items-start gap-2.5 transition-all ${
                provider === 'MOMO'
                  ? 'border-pink-500 bg-pink-500/5 ring-2 ring-pink-500/20 shadow-xs'
                  : 'border-border bg-white dark:bg-background hover:border-pink-400'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0 text-pink-600 font-bold text-xs">
                MoMo
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">
                  Ví MoMo
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Quét mã QR MoMo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Summary & Submit Button */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary font-medium">Tổng thanh toán:</span>
            <span className="text-xl font-heading font-bold text-primary">
              {currentAmountFormatted}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70 text-sm sm:text-base cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối cổng thanh toán...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Thanh toán ngay qua{' '}
                  {provider === 'VNPAY'
                    ? 'VNPAY'
                    : provider === 'ZALOPAY'
                    ? 'ZaloPay'
                    : 'MoMo'}
                </span>
              </>
            )}
          </button>


          <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Thanh toán an toàn, bảo mật tiêu chuẩn mã hóa SSL</span>
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

