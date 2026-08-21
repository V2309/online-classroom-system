import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay, ProductCode, VnpLocale, VerifyReturnUrl } from 'vnpay';
import { IPaymentGateway } from './payment-gateway.interface';
import {
  PaymentInitParams,
  PaymentInitResult,
  VerifyCallbackResult,
} from '../types/payment.type';

@Injectable()
export class VNPayGateway implements IPaymentGateway {
  private readonly logger = new Logger(VNPayGateway.name);
  private vnpayInstance: VNPay;

  constructor(private readonly configService: ConfigService) {
    const tmnCode =
      this.configService.get<string>('VNPAY_TMN_CODE') || 'IAD62PHV';
    const secureSecret =
      this.configService.get<string>('VNPAY_HASH_SECRET') ||
      'CVUHOTTPACPYDGAUPELNVJFFRJTPHKHZ';

    this.vnpayInstance = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      enableLog: true,
    });
  }

  async createPaymentUrl(
    params: PaymentInitParams,
  ): Promise<PaymentInitResult> {
    await Promise.resolve();
    const orderId = `${params.orderCode}_${Date.now()}`;
    const cleanOrderInfo = (params.description || 'Thanh toan goi DoCus')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const paymentUrl = this.vnpayInstance.buildPaymentUrl({
        vnp_Amount: Math.round(params.amount),
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: cleanOrderInfo,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: params.returnUrl,
        vnp_Locale: VnpLocale.VN,
      });

      this.logger.log(`Created VNPay payment URL for order ${orderId}`);

      return {
        appTransId: orderId,
        payUrl: paymentUrl,
        rawResponse: { paymentUrl, orderId },
      };
    } catch (error) {
      this.logger.error(`Failed to build VNPay URL: ${error.message}`);
      throw error;
    }
  }

  async verifyCallback(data: any): Promise<VerifyCallbackResult> {
    await Promise.resolve();
    try {
      // Chỉ lấy các trường bắt đầu bằng vnp_ để tính toán chữ ký số chính xác

      const cleanData: Record<string, any> = {};
      for (const key in data) {
        if (key.startsWith('vnp_')) {
          cleanData[key] = data[key];
        }
      }

      const verifyResult: VerifyReturnUrl = this.vnpayInstance.verifyReturnUrl(
        cleanData as any,
      );

      const appTransId = String(
        verifyResult.vnp_TxnRef || cleanData.vnp_TxnRef || '',
      );
      const amount = Number(
        verifyResult.vnp_Amount || cleanData.vnp_Amount || 0,
      );
      const isSuccess =
        verifyResult.isSuccess && cleanData.vnp_ResponseCode === '00';
      const isVerified = verifyResult.isVerified;

      this.logger.log(
        `VNPay Verify Result: isSuccess=${isSuccess}, isVerified=${isVerified}, message=${verifyResult.message}`,
      );

      if (!isVerified) {
        return {
          isValid: false,
          isSuccess: false,
          appTransId,
          amount,
          rawResponse: cleanData,
          message: 'Chữ ký không hợp lệ',
        };
      }

      return {
        isValid: true,
        isSuccess,
        appTransId,
        gatewayTransId: String(
          verifyResult.vnp_TransactionNo || cleanData.vnp_TransactionNo || '',
        ),
        amount,
        rawResponse: cleanData,
        message:
          verifyResult.message || (isSuccess ? 'Thành công' : 'Thất bại'),
      };
    } catch (error) {
      this.logger.error(`Error verifying VNPay callback: ${error.message}`);
      return {
        isValid: false,
        isSuccess: false,
        appTransId: data?.vnp_TxnRef || '',
        amount: 0,
        rawResponse: data,
        message: error.message,
      };
    }
  }
}
