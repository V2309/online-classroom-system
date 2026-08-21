'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { OrderStatusResponse, paymentService } from '@/services/payment.service';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStatus = useCallback(async () => {
    if (!orderId) {
      setError('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Tự động xác thực và kích hoạt đơn hàng từ query parameters của VNPay/MoMo
      const paramsObj: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        paramsObj[key] = val;
      });

      if (paramsObj.vnp_ResponseCode || paramsObj.resultCode || paramsObj.status) {
        try {
          await paymentService.verifyPaymentReturn(paramsObj);
        } catch (vErr) {
          console.warn('Xác thực return parameters:', vErr);
        }
      }

      const data = await paymentService.getOrderStatus(orderId);
      setOrderData(data);
      setError(null);
    } catch (err: any) {
      console.error('Lỗi lấy trạng thái đơn hàng:', err);
      setError(
        err?.response?.data?.message ||
          'Không thể tải thông tin kết quả thanh toán.',
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, searchParams]);

  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-secondary">
          Đang kiểm tra kết quả giao dịch từ cổng thanh toán...
        </p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 border border-border text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            Không tìm thấy thông tin đơn hàng
          </h2>
          <p className="text-xs text-secondary">{error}</p>
          <div className="pt-2">
            <Link
              href="/overview"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full text-xs"
            >
              <span>Về bảng điều khiển</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid =
    orderData.status === 'PAID' ||
    orderData.payment?.status === 'SUCCESS' ||
    orderData.userPlan.plan === orderData.plan;

  const planName =
    orderData.plan === 'PREMIUM' ? 'Gói Cao cấp' : 'Gói Chuyên nghiệp';
  const cycleName =
    orderData.billingCycle === 'YEARLY' ? '1 Năm' : '1 Tháng';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-card rounded-3xl border border-border shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Status Icon */}
        {isPaid ? (
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {isPaid ? 'Nâng cấp tài khoản thành công!' : 'Đang xử lý giao dịch'}
          </h2>
          <p className="text-xs sm:text-sm text-secondary">
            {isPaid
              ? 'Tài khoản của bạn đã được nâng cấp với đầy đủ đặc quyền mới.'
              : 'Giao dịch đang được xử lý hoặc chờ xác nhận từ cổng thanh toán.'}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-muted/50 rounded-2xl p-5 border border-border text-left space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-secondary">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-foreground">
              {orderData.orderCode}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-secondary">Gói dịch vụ:</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {planName} ({cycleName})
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-secondary">Cổng thanh toán:</span>
            <span className="font-semibold text-foreground">
              {orderData.payment?.provider === 'VNPAY'
                ? 'Cổng VNPAY'
                : orderData.payment?.provider === 'ZALOPAY'
                ? 'Ví ZaloPay'
                : 'Ví MoMo'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-secondary">Tổng số tiền:</span>
            <span className="font-bold text-foreground">
              {Number(orderData.totalAmount).toLocaleString('vi-VN')}đ
            </span>
          </div>
          {orderData.userPlan.planExpiresAt && (
            <div className="flex justify-between items-center py-1">
              <span className="text-secondary">Thời hạn sử dụng đến:</span>
              <span className="font-semibold text-emerald-600">
                {new Date(orderData.userPlan.planExpiresAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isPaid && (
            <button
              onClick={fetchOrderStatus}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Kiểm tra lại trạng thái</span>
            </button>
          )}

          <Link
            href="/overview"
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Trải nghiệm tính năng ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Giao dịch bảo đảm bởi DoCus Education</span>
        </p>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-secondary">
            Đang tải thông tin kết quả thanh toán...
          </p>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
