import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BillingCycle,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  PlanType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../lib/database/prisma.service';
import { ZaloPayGateway } from './gateways/zalopay.gateway';
import { MoMoGateway } from './gateways/momo.gateway';
import { VNPayGateway } from './gateways/vnpay.gateway';
import { PaymentService } from './payment.service';

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-id-1',
  username: 'testuser',
  plan: PlanType.FREE,
  planExpiresAt: null,
};

const mockOrder = {
  id: 'order-id-1',
  orderCode: 'SUB12345678',
  userId: mockUser.id,
  plan: PlanType.PRO,
  billingCycle: BillingCycle.MONTHLY,
  totalAmount: 1000,
  status: OrderStatus.PENDING,
  createdAt: new Date(),
  payments: [],
  user: mockUser,
};

const mockPayment = {
  id: 'payment-id-1',
  orderId: mockOrder.id,
  provider: PaymentProvider.ZALOPAY,
  appTransId: 'ZALOPAY_TRANS_001',
  amount: 1000,
  status: PaymentStatus.PENDING,
  payUrl: 'https://zalopay.vn/pay?token=xxx',
  deeplink: null,
  qrCodeUrl: null,
  rawResponse: {},
};

const mockGatewayResult = {
  appTransId: 'ZALOPAY_TRANS_001',
  payUrl: 'https://zalopay.vn/pay?token=xxx',
  deeplink: null,
  qrCodeUrl: null,
  rawResponse: {},
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    order: { create: jest.fn(), findFirst: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    subscription: { upsert: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'PORT') return '8081';
      if (key === 'BACKEND_PUBLIC_URL') return 'http://localhost:8081';
      return null;
    }),
  };

  const mockZaloPayGateway = {
    createPaymentUrl: jest.fn(),
    verifyCallback: jest.fn(),
  };

  const mockMoMoGateway = {
    createPaymentUrl: jest.fn(),
    verifyCallback: jest.fn(),
  };

  const mockVNPayGateway = {
    createPaymentUrl: jest.fn(),
    verifyCallback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ZaloPayGateway, useValue: mockZaloPayGateway },
        { provide: MoMoGateway, useValue: mockMoMoGateway },
        { provide: VNPayGateway, useValue: mockVNPayGateway },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createSubscriptionPayment()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createSubscriptionPayment()', () => {
    const dto = {
      plan: PlanType.PRO,
      billingCycle: BillingCycle.MONTHLY,
      provider: PaymentProvider.ZALOPAY,
    };

    it('tạo đơn hàng ZaloPay thành công và trả về payUrl', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockZaloPayGateway.createPaymentUrl.mockResolvedValue(mockGatewayResult);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.createSubscriptionPayment(mockUser.id, dto);

      expect(result.payUrl).toBe('https://zalopay.vn/pay?token=xxx');
      expect(result.plan).toBe(PlanType.PRO);
      expect(result.billingCycle).toBe(BillingCycle.MONTHLY);
      expect(mockPrisma.order.create).toHaveBeenCalled();
      expect(mockZaloPayGateway.createPaymentUrl).toHaveBeenCalled();
    });

    it('tạo đơn hàng MoMo thành công', async () => {
      const momoDto = { ...dto, provider: PaymentProvider.MOMO };
      const momoPayment = { ...mockPayment, provider: PaymentProvider.MOMO };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockMoMoGateway.createPaymentUrl.mockResolvedValue(mockGatewayResult);
      mockPrisma.payment.create.mockResolvedValue(momoPayment);

      const result = await service.createSubscriptionPayment(mockUser.id, momoDto);

      expect(result.payUrl).toBe('https://zalopay.vn/pay?token=xxx');
      expect(mockMoMoGateway.createPaymentUrl).toHaveBeenCalled();
    });

    it('tạo đơn hàng VNPay thành công', async () => {
      const vnpayDto = { ...dto, provider: PaymentProvider.VNPAY };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockVNPayGateway.createPaymentUrl.mockResolvedValue(mockGatewayResult);
      mockPrisma.payment.create.mockResolvedValue({ ...mockPayment, provider: PaymentProvider.VNPAY });

      const result = await service.createSubscriptionPayment(mockUser.id, vnpayDto);

      expect(mockVNPayGateway.createPaymentUrl).toHaveBeenCalled();
    });

    it('tính đúng giá cho gói PRO MONTHLY', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockZaloPayGateway.createPaymentUrl.mockResolvedValue(mockGatewayResult);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createSubscriptionPayment(mockUser.id, dto);

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1000, // PLAN_PRICES.PRO.MONTHLY = 1000
            plan: PlanType.PRO,
          }),
        }),
      );
    });

    it('tính đúng giá cho gói PREMIUM YEARLY', async () => {
      const premiumYearlyDto = {
        ...dto,
        plan: PlanType.PREMIUM,
        billingCycle: BillingCycle.YEARLY,
      };
      const premiumOrder = { ...mockOrder, plan: PlanType.PREMIUM, totalAmount: 20000 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.create.mockResolvedValue(premiumOrder);
      mockZaloPayGateway.createPaymentUrl.mockResolvedValue(mockGatewayResult);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createSubscriptionPayment(mockUser.id, premiumYearlyDto);

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 20000, // PLAN_PRICES.PREMIUM.YEARLY = 20000
          }),
        }),
      );
    });

    it('throw BadRequestException khi plan là FREE', async () => {
      const freeDto = { ...dto, plan: PlanType.FREE };

      await expect(
        service.createSubscriptionPayment(mockUser.id, freeDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createSubscriptionPayment(mockUser.id, freeDto),
      ).rejects.toThrow('Gói Free không yêu cầu thanh toán.');
    });

    it('throw NotFoundException khi user không tồn tại', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createSubscriptionPayment('nonexistent', dto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createSubscriptionPayment('nonexistent', dto),
      ).rejects.toThrow('Không tìm thấy thông tin người dùng.');
    });

    it('throw BadRequestException khi plan hoặc billingCycle không hợp lệ', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const invalidDto = { ...dto, billingCycle: 'INVALID_CYCLE' as BillingCycle };

      await expect(
        service.createSubscriptionPayment(mockUser.id, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // handleZaloPayCallback()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('handleZaloPayCallback()', () => {
    it('trả về return_code=1 khi callback hợp lệ và thanh toán thành công', async () => {
      mockZaloPayGateway.verifyCallback.mockResolvedValue({
        isValid: true,
        isSuccess: true,
        appTransId: 'ZALOPAY_TRANS_001',
        gatewayTransId: 'GW_001',
        rawResponse: {},
      });

      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        order: {
          ...mockOrder,
          user: { ...mockUser, plan: PlanType.FREE, planExpiresAt: null },
        },
      };
      mockPrisma.payment.findFirst.mockResolvedValue(paymentWithOrder);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        await cb({
          payment: { update: jest.fn() },
          order: { update: jest.fn() },
          user: { update: jest.fn() },
          subscription: { upsert: jest.fn() },
        });
      });

      const result = await service.handleZaloPayCallback({ data: 'mock_data' });

      expect(result.return_code).toBe(1);
      expect(result.return_message).toBe('success');
    });

    it('trả về return_code=-1 khi chữ ký không hợp lệ', async () => {
      mockZaloPayGateway.verifyCallback.mockResolvedValue({
        isValid: false,
        isSuccess: false,
        appTransId: '',
        rawResponse: {},
      });

      const result = await service.handleZaloPayCallback({ data: 'invalid_data' });

      expect(result.return_code).toBe(-1);
      expect(result.return_message).toBe('Invalid MAC');
    });

    it('trả về return_code=1 nhưng không activate khi thanh toán thất bại', async () => {
      mockZaloPayGateway.verifyCallback.mockResolvedValue({
        isValid: true,
        isSuccess: false, // thanh toán thất bại
        appTransId: 'ZALOPAY_TRANS_001',
        rawResponse: {},
      });

      const result = await service.handleZaloPayCallback({ data: 'fail_data' });

      expect(result.return_code).toBe(1);
      expect(mockPrisma.payment.findFirst).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // handleMoMoCallback()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('handleMoMoCallback()', () => {
    it('xử lý MoMo callback thành công', async () => {
      mockMoMoGateway.verifyCallback.mockResolvedValue({
        isValid: true,
        isSuccess: true,
        appTransId: 'MOMO_TRANS_001',
        gatewayTransId: 'GW_MOMO_001',
        rawResponse: {},
      });

      const paymentWithOrder = {
        ...mockPayment,
        appTransId: 'MOMO_TRANS_001',
        status: PaymentStatus.PENDING,
        order: {
          ...mockOrder,
          user: { ...mockUser, plan: PlanType.FREE, planExpiresAt: null },
        },
      };
      mockPrisma.payment.findFirst.mockResolvedValue(paymentWithOrder);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        await cb({
          payment: { update: jest.fn() },
          order: { update: jest.fn() },
          user: { update: jest.fn() },
          subscription: { upsert: jest.fn() },
        });
      });

      const result = await service.handleMoMoCallback({ resultCode: 0 });

      expect(result.resultCode).toBe(0);
      expect(result.message).toBe('success');
    });

    it('trả về Invalid signature khi MoMo chữ ký không đúng', async () => {
      mockMoMoGateway.verifyCallback.mockResolvedValue({
        isValid: false,
        isSuccess: false,
        appTransId: '',
        rawResponse: {},
      });

      const result = await service.handleMoMoCallback({ resultCode: 99 });

      expect(result.message).toBe('Invalid signature');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // handleVNPayCallback()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('handleVNPayCallback()', () => {
    it('xử lý VNPay callback thành công', async () => {
      mockVNPayGateway.verifyCallback.mockResolvedValue({
        isValid: true,
        isSuccess: true,
        appTransId: 'VNPAY_TRANS_001',
        gatewayTransId: 'GW_VNPAY_001',
        rawResponse: {},
      });

      const paymentWithOrder = {
        ...mockPayment,
        appTransId: 'VNPAY_TRANS_001',
        status: PaymentStatus.PENDING,
        order: {
          ...mockOrder,
          user: { ...mockUser, plan: PlanType.FREE, planExpiresAt: null },
        },
      };
      mockPrisma.payment.findFirst.mockResolvedValue(paymentWithOrder);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        await cb({
          payment: { update: jest.fn() },
          order: { update: jest.fn() },
          user: { update: jest.fn() },
          subscription: { upsert: jest.fn() },
        });
      });

      const result = await service.handleVNPayCallback({ vnp_ResponseCode: '00' });

      expect(result.RspCode).toBe('00');
      expect(result.Message).toBe('Confirm Success');
    });

    it('trả về RspCode=97 khi VNPay checksum không hợp lệ', async () => {
      mockVNPayGateway.verifyCallback.mockResolvedValue({
        isValid: false,
        isSuccess: false,
        appTransId: '',
        rawResponse: {},
      });

      const result = await service.handleVNPayCallback({ vnp_ResponseCode: '01' });

      expect(result.RspCode).toBe('97');
      expect(result.Message).toBe('Invalid Checksum');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getOrderStatus()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getOrderStatus()', () => {
    it('trả về thông tin đơn hàng thành công', async () => {
      const orderWithPayment = {
        ...mockOrder,
        payments: [mockPayment],
        user: mockUser,
      };
      mockPrisma.order.findFirst.mockResolvedValue(orderWithPayment);

      const result = await service.getOrderStatus(mockOrder.id, mockUser.id);

      expect(result.orderId).toBe(mockOrder.id);
      expect(result.plan).toBe(PlanType.PRO);
      expect(result.payment).not.toBeNull();
      expect(result.payment?.provider).toBe(PaymentProvider.ZALOPAY);
      expect(result.userPlan.plan).toBe(PlanType.FREE);
    });

    it('trả về payment = null khi đơn hàng chưa có payment', async () => {
      const orderWithoutPayment = { ...mockOrder, payments: [], user: mockUser };
      mockPrisma.order.findFirst.mockResolvedValue(orderWithoutPayment);

      const result = await service.getOrderStatus(mockOrder.id, mockUser.id);

      expect(result.payment).toBeNull();
    });

    it('throw NotFoundException khi đơn hàng không tồn tại hoặc không thuộc user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.getOrderStatus('nonexistent-order', mockUser.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getOrderStatus('nonexistent-order', mockUser.id),
      ).rejects.toThrow('Không tìm thấy đơn hàng.');
    });
  });
});
