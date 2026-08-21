import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IPaymentGateway } from './payment-gateway.interface';
import {
  PaymentInitParams,
  PaymentInitResult,
  VerifyCallbackResult,
} from '../types/payment.type';

@Injectable()
export class MoMoGateway implements IPaymentGateway {
  private readonly logger = new Logger(MoMoGateway.name);

  constructor(private readonly configService: ConfigService) {}

  private get partnerCode(): string {
    return this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO';
  }

  private get accessKey(): string {
    return this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85';
  }

  private get secretKey(): string {
    return (
      this.configService.get<string>('MOMO_SECRET_KEY') ||
      'K951B6PE1wa8ngfBWR6a1Prjw0BmHQmZ'
    );
  }

  private get endpoint(): string {
    return (
      this.configService.get<string>('MOMO_ENDPOINT') ||
      'https://test-payment.momo.vn/v2/gateway/api/create'
    );
  }

  async createPaymentUrl(params: PaymentInitParams): Promise<PaymentInitResult> {
    const requestId = `${params.orderCode}_${Date.now()}`;
    const orderId = `${params.orderCode}_${Date.now()}`;
    const orderInfo = params.description;
    const amount = Math.round(params.amount);
    const redirectUrl = params.returnUrl;
    const ipnUrl = params.ipnUrl;
    const requestType = 'captureWallet';
    const extraData = Buffer.from(
      JSON.stringify({ orderId: params.orderId, ...params.extraData }),
    ).toString('base64');
    const lang = 'vi';

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'DoCus Education',
      storeId: 'DoCusStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    this.logger.log(`Calling MoMo Create Order: ${JSON.stringify(requestBody)}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const resData = await response.json();
      this.logger.log(`MoMo Response: ${JSON.stringify(resData)}`);

      if (resData.resultCode !== 0) {
        throw new Error(resData.message || 'MoMo API Error');
      }

      return {
        appTransId: orderId,
        payUrl: resData.payUrl,
        deeplink: resData.deeplink,
        qrCodeUrl: resData.qrCodeUrl,
        rawResponse: resData,
      };
    } catch (error) {
      this.logger.error(`Failed to create MoMo payment: ${error.message}`);
      throw error;
    }
  }

  async verifyCallback(data: any): Promise<VerifyCallbackResult> {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
      } = data;

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      if (signature !== expectedSignature) {
        this.logger.warn(
          `MoMo Callback Invalid Signature: expected ${expectedSignature}, received ${signature}`,
        );
        return {
          isValid: false,
          isSuccess: false,
          appTransId: orderId,
          amount: Number(amount),
          rawResponse: data,
          message: 'Invalid signature',
        };
      }

      const isSuccess = Number(resultCode) === 0;

      return {
        isValid: true,
        isSuccess,
        appTransId: orderId,
        gatewayTransId: String(transId || ''),
        amount: Number(amount),
        rawResponse: data,
        message,
      };
    } catch (error) {
      this.logger.error(`Error verifying MoMo callback: ${error.message}`);
      return {
        isValid: false,
        isSuccess: false,
        appTransId: data?.orderId || '',
        amount: 0,
        rawResponse: data,
        message: error.message,
      };
    }
  }
}
