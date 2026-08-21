import { api } from '@/lib/api';

export type PlanType = 'FREE' | 'PRO' | 'PREMIUM';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type PaymentProvider = 'ZALOPAY' | 'MOMO' | 'VNPAY';


export interface PlanItem {
  id: PlanType;
  name: string;
  description: string;
  isPopular?: boolean;
  prices: {
    MONTHLY: number;
    YEARLY: number;
  };
  features: string[];
}

export interface CreateSubscriptionRequest {
  plan: PlanType;
  billingCycle: BillingCycle;
  provider: PaymentProvider;
}

export interface CreateSubscriptionResponse {
  orderId: string;
  orderCode: string;
  plan: PlanType;
  billingCycle: BillingCycle;
  amount: number;
  provider: PaymentProvider;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface OrderStatusResponse {
  orderId: string;
  orderCode: string;
  plan: PlanType;
  billingCycle: BillingCycle;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
  createdAt: string;
  payment: {
    provider: PaymentProvider;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    payUrl?: string;
  } | null;
  userPlan: {
    plan: PlanType;
    planExpiresAt: string | null;
  };
}

export const paymentService = {
  // Lấy danh sách bảng giá các gói
  async getPlans(): Promise<{ plans: PlanItem[] }> {
    const response = await api.get<{ plans: PlanItem[] }>('/payment/plans');
    return response.data;
  },

  // Tạo đơn thanh toán nâng cấp gói
  async createSubscription(
    data: CreateSubscriptionRequest,
  ): Promise<CreateSubscriptionResponse> {
    const response = await api.post<CreateSubscriptionResponse>(
      '/payment/create-subscription',
      data,
    );
    return response.data;
  },

  // Lấy trạng thái đơn hàng sau khi thanh toán
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    const response = await api.get<OrderStatusResponse>(
      `/payment/order-status/${orderId}`,
    );
    return response.data;
  },

  // Xác thực kết quả thanh toán từ URL trả về (Localhost & Webhook)
  async verifyPaymentReturn(params: Record<string, any>): Promise<any> {
    const response = await api.post('/payment/verify-return', params);
    return response.data;
  },
};

