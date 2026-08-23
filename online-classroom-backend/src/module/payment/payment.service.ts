import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { ZaloPayGateway } from './gateways/zalopay.gateway';
import { MoMoGateway } from './gateways/momo.gateway';
import { VNPayGateway } from './gateways/vnpay.gateway';
import { IPaymentGateway } from './gateways/payment-gateway.interface';
import {
  BillingCycle,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  PlanType,
} from '../../generated/prisma/enums';
import { PLAN_PRICES } from './types/payment.type';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly zaloPayGateway: ZaloPayGateway,
    private readonly moMoGateway: MoMoGateway,
    private readonly vnPayGateway: VNPayGateway,
  ) {}

  private get frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  private get backendUrl(): string {
    const port = this.configService.get<string>('PORT') || '8081';
    return (
      this.configService.get<string>('BACKEND_PUBLIC_URL') ||
      `http://localhost:${port}`
    );
  }

  // ─── Tạo đơn hàng & liên kết thanh toán ────────────────────────────────────
  async createSubscriptionPayment(
    userId: string,
    dto: CreateSubscriptionPaymentDto,
  ) {
    if (dto.plan === PlanType.FREE) {
      throw new BadRequestException('Gói Free không yêu cầu thanh toán.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng.');
    }

    const priceMap = PLAN_PRICES[dto.plan];
    if (!priceMap || !priceMap[dto.billingCycle]) {
      throw new BadRequestException('Gói dịch vụ hoặc chu kỳ không hợp lệ.');
    }

    const amount = priceMap[dto.billingCycle];
    const orderCode = `SUB${Date.now().toString().slice(-8)}${Math.floor(
      100 + Math.random() * 900,
    )}`;

    // Tạo Order trong Database
    const order = await this.prisma.order.create({
      data: {
        orderCode,
        userId: user.id,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        totalAmount: amount,
        status: OrderStatus.PENDING,
      },
    });

    const returnUrl = `${this.frontendUrl}/payment/result?orderId=${order.id}`;
    let ipnUrl = `${this.backendUrl}/api/payment/zalopay/callback`;
    let gateway: IPaymentGateway = this.zaloPayGateway;

    if (dto.provider === PaymentProvider.MOMO) {
      ipnUrl = `${this.backendUrl}/api/payment/momo/callback`;
      gateway = this.moMoGateway;
    } else if (dto.provider === PaymentProvider.VNPAY) {
      ipnUrl = `${this.backendUrl}/api/payment/vnpay/callback`;
      gateway = this.vnPayGateway;
    }

    const cycleText =
      dto.billingCycle === BillingCycle.YEARLY ? 'nam' : 'thang';
    const planText = dto.plan === PlanType.PREMIUM ? 'Premium' : 'Pro';
    const description = `DoCus - Nang cap goi ${planText} (${cycleText})`;

    const gatewayResult = await gateway.createPaymentUrl({
      orderId: order.id,
      orderCode: order.orderCode,
      amount,
      description,
      returnUrl,
      ipnUrl,
      userId: user.id,
      extraData: {
        plan: dto.plan,
        billingCycle: dto.billingCycle,
      },
    });

    // Lưu thông tin Payment
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: dto.provider,
        appTransId: gatewayResult.appTransId,
        amount,
        status: PaymentStatus.PENDING,
        payUrl: gatewayResult.payUrl,
        deeplink: gatewayResult.deeplink || null,
        qrCodeUrl: gatewayResult.qrCodeUrl || null,
        rawResponse: gatewayResult.rawResponse || {},
      },
    });

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      plan: order.plan,
      billingCycle: order.billingCycle,
      amount,
      provider: dto.provider,
      payUrl: payment.payUrl,
      deeplink: payment.deeplink,
      qrCodeUrl: payment.qrCodeUrl,
    };
  }

  // ─── Kích hoạt gói sau khi thanh toán thành công ──────────────────────────
  private async activateOrderSubscription(
    appTransId: string,
    gatewayTransId?: string,
    rawResponse?: any,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { appTransId },
      include: {
        order: {
          include: { user: true },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for appTransId: ${appTransId}`);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(`Payment ${payment.id} is already marked as SUCCESS.`);
      return;
    }

    const { order } = payment;
    const now = new Date();

    // Tính hạn sử dụng: Nếu đang còn hạn cùng gói thì cộng nối tiếp, ngược lại tính từ bây giờ
    const currentExpiry =
      order.user.plan === order.plan &&
      order.user.planExpiresAt &&
      new Date(order.user.planExpiresAt) > now
        ? new Date(order.user.planExpiresAt)
        : now;

    const daysToAdd = order.billingCycle === BillingCycle.YEARLY ? 365 : 30;
    const newExpiresAt = new Date(
      currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          gatewayTransId: gatewayTransId || payment.gatewayTransId,
          rawResponse: rawResponse || payment.rawResponse,
        },
      });

      // 2. Cập nhật Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
        },
      });

      // 3. Cập nhật User Plan
      await tx.user.update({
        where: { id: order.userId },
        data: {
          plan: order.plan,
          planExpiresAt: newExpiresAt,
        },
      });

      // 4. Lưu Subscription record
      await tx.subscription.upsert({
        where: { orderId: order.id },
        create: {
          userId: order.userId,
          orderId: order.id,
          plan: order.plan,
          startDate: now,
          endDate: newExpiresAt,
          isActive: true,
        },
        update: {
          plan: order.plan,
          endDate: newExpiresAt,
          isActive: true,
        },
      });
    });

    this.logger.log(
      `Successfully upgraded user ${order.userId} to ${order.plan} until ${newExpiresAt.toISOString()}`,
    );
  }

  // ─── Xử lý ZaloPay IPN Callback ──────────────────────────────────────────
  async handleZaloPayCallback(callbackData: any) {
    const verifyResult = await this.zaloPayGateway.verifyCallback(callbackData);

    if (!verifyResult.isValid) {
      return { return_code: -1, return_message: 'Invalid MAC' };
    }

    if (verifyResult.isSuccess && verifyResult.appTransId) {
      await this.activateOrderSubscription(
        verifyResult.appTransId,
        verifyResult.gatewayTransId,
        verifyResult.rawResponse,
      );
    }

    return { return_code: 1, return_message: 'success' };
  }

  // ─── Xử lý MoMo IPN Callback ──────────────────────────────────────────────
  async handleMoMoCallback(callbackData: any) {
    const verifyResult = await this.moMoGateway.verifyCallback(callbackData);

    if (!verifyResult.isValid) {
      this.logger.warn('MoMo IPN signature invalid');
      return { message: 'Invalid signature' };
    }

    if (verifyResult.isSuccess && verifyResult.appTransId) {
      await this.activateOrderSubscription(
        verifyResult.appTransId,
        verifyResult.gatewayTransId,
        verifyResult.rawResponse,
      );
    }

    return {
      message: 'success',
      resultCode: 0,
    };
  }

  // ─── Xử lý VNPay IPN / Callback ──────────────────────────────────────────
  async handleVNPayCallback(queryData: any) {
    this.logger.log(`Received VNPay Callback: ${JSON.stringify(queryData)}`);
    const verifyResult = await this.vnPayGateway.verifyCallback(queryData);

    if (!verifyResult.isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    if (verifyResult.isSuccess && verifyResult.appTransId) {
      await this.activateOrderSubscription(
        verifyResult.appTransId,
        verifyResult.gatewayTransId,
        verifyResult.rawResponse,
      );
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // ─── Xác thực Return URL từ Browser (Dành cho môi trường Localhost & IPN) ───
  async verifyPaymentReturn(query: Record<string, any>) {
    this.logger.log(
      `Verifying Payment Return from browser: ${JSON.stringify(query)}`,
    );

    // 1. Kiểm tra nếu là VNPay
    if (query.vnp_ResponseCode !== undefined) {
      const verifyResult = await this.vnPayGateway.verifyCallback(query);
      if (
        verifyResult.isValid &&
        verifyResult.isSuccess &&
        verifyResult.appTransId
      ) {
        await this.activateOrderSubscription(
          verifyResult.appTransId,
          verifyResult.gatewayTransId,
          verifyResult.rawResponse,
        );
      }
      return verifyResult;
    }

    // 2. Kiểm tra nếu là MoMo
    if (
      query.resultCode !== undefined &&
      (query.orderId !== undefined || query.requestId !== undefined)
    ) {
      const verifyResult = await this.moMoGateway.verifyCallback(query);
      if (
        verifyResult.isValid &&
        verifyResult.isSuccess &&
        verifyResult.appTransId
      ) {
        await this.activateOrderSubscription(
          verifyResult.appTransId,
          verifyResult.gatewayTransId,
          verifyResult.rawResponse,
        );
      }
      return verifyResult;
    }

    return { isValid: true, message: 'No specific gateway return data' };
  }

  // ─── Lấy trạng thái Order (cho trang kết quả Frontend) ────────────────────

  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            username: true,
            plan: true,
            planExpiresAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    const latestPayment = order.payments[0] || null;

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      plan: order.plan,
      billingCycle: order.billingCycle,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      payment: latestPayment
        ? {
            provider: latestPayment.provider,
            status: latestPayment.status,
            payUrl: latestPayment.payUrl,
          }
        : null,
      userPlan: {
        plan: order.user.plan,
        planExpiresAt: order.user.planExpiresAt,
      },
    };
  }
}
