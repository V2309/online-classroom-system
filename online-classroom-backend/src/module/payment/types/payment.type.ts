export interface PaymentInitParams {
  orderId: string;
  orderCode: string;
  amount: number;
  description: string;
  returnUrl: string;
  ipnUrl: string;
  userId: string;
  extraData?: Record<string, any>;
}

export interface PaymentInitResult {
  appTransId: string;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  rawResponse: any;
}

export interface VerifyCallbackResult {
  isValid: boolean;
  isSuccess: boolean;
  appTransId: string;
  gatewayTransId?: string;
  amount: number;
  rawResponse: any;
  message?: string;
}

export const PLAN_PRICES = {
  PRO: {
    MONTHLY: 1000,
    YEARLY: 10000,
  },
  PREMIUM: {
    MONTHLY: 2000,
    YEARLY: 20000,
  },
};

