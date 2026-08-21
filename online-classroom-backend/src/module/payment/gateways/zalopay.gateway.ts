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
export class ZaloPayGateway implements IPaymentGateway {
  private readonly logger = new Logger(ZaloPayGateway.name);

  constructor(private readonly configService: ConfigService) {}

  private get appId(): number {
    return Number(this.configService.get<string>('ZALOPAY_APP_ID') || 2553);
  }

  private get key1(): string {
    return (
      this.configService.get<string>('ZALOPAY_KEY1') ||
      'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'
    );
  }

  private get key2(): string {
    return (
      this.configService.get<string>('ZALOPAY_KEY2') ||
      'kLtgPl8HHhfvMuD2wKfgccY4YqZatOKd'
    );
  }

  private get endpoint(): string {
    return (
      this.configService.get<string>('ZALOPAY_ENDPOINT') ||
      'https://sb-openapi.zalopay.vn/v2/create'
    );
  }

  // Tạo định dạng app_trans_id: yyMMdd_xxxx
  private generateAppTransId(orderCode: string): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const cleanCode = orderCode.replace(/[^a-zA-Z0-9]/g, '');
    return `${yy}${mm}${dd}_${cleanCode}`;
  }

  async createPaymentUrl(params: PaymentInitParams): Promise<PaymentInitResult> {
    const appTransId = this.generateAppTransId(params.orderCode);
    const appTime = Date.now();
    const appUser = params.userId || 'docus_user';
    const amount = Math.round(params.amount);

    const embedData = JSON.stringify({
      redirecturl: params.returnUrl,
      orderId: params.orderId,
      ...params.extraData,
    });

    const items = JSON.stringify([
      {
        itemid: params.orderId,
        itemname: params.description,
        itemprice: amount,
        itemquantity: 1,
      },
    ]);

    // Chuỗi mã hóa: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const rawData = `${this.appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${items}`;
    const mac = crypto
      .createHmac('sha256', this.key1)
      .update(rawData)
      .digest('hex');

    const body = {
      app_id: this.appId,
      app_user: appUser,
      app_time: appTime,
      amount,
      app_trans_id: appTransId,
      embed_data: embedData,
      item: items,
      description: params.description,
      bank_code: '',
      callback_url: params.ipnUrl,
      mac,
    };

    this.logger.log(`Calling ZaloPay Create Order: ${JSON.stringify(body)}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const resData = await response.json();
      this.logger.log(`ZaloPay Response: ${JSON.stringify(resData)}`);

      if (resData.return_code !== 1) {
        throw new Error(
          resData.return_message || resData.sub_return_message || 'ZaloPay Error',
        );
      }

      return {
        appTransId,
        payUrl: resData.order_url,
        deeplink: resData.deeplink,
        qrCodeUrl: resData.qr_code,
        rawResponse: resData,
      };
    } catch (error) {
      this.logger.error(`Failed to create ZaloPay order: ${error.message}`);
      throw error;
    }
  }

  async verifyCallback(data: any): Promise<VerifyCallbackResult> {
    try {
      const dataStr = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
      const reqMac = data.mac;

      const expectedMac = crypto
        .createHmac('sha256', this.key2)
        .update(dataStr)
        .digest('hex');

      if (reqMac !== expectedMac) {
        this.logger.warn(`ZaloPay Callback Invalid MAC: expected ${expectedMac}, received ${reqMac}`);
        return {
          isValid: false,
          isSuccess: false,
          appTransId: '',
          amount: 0,
          rawResponse: data,
          message: 'Invalid MAC signature',
        };
      }

      const parsedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

      return {
        isValid: true,
        isSuccess: true,
        appTransId: parsedData.app_trans_id,
        gatewayTransId: String(parsedData.zp_trans_id || ''),
        amount: Number(parsedData.amount),
        rawResponse: parsedData,
        message: 'Success',
      };
    } catch (error) {
      this.logger.error(`Error verifying ZaloPay callback: ${error.message}`);
      return {
        isValid: false,
        isSuccess: false,
        appTransId: '',
        amount: 0,
        rawResponse: data,
        message: error.message,
      };
    }
  }
}
