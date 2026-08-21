import {
  PaymentInitParams,
  PaymentInitResult,
  VerifyCallbackResult,
} from '../types/payment.type';

export interface IPaymentGateway {
  createPaymentUrl(params: PaymentInitParams): Promise<PaymentInitResult>;
  verifyCallback(data: any): Promise<VerifyCallbackResult>;
}
