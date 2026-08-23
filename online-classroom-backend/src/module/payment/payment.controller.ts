import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PLAN_PRICES } from './types/payment.type';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * GET /payment/plans — Lấy danh sách bảng giá các gói
   */
  @Get('plans')
  getPlans() {
    return {
      plans: [
        {
          id: 'FREE',
          name: 'Gói Miễn phí',
          description: 'Hoàn hảo cho người học và lớp học quy mô vừa.',
          prices: {
            MONTHLY: 0,
            YEARLY: 0,
          },
          features: [
            'Quản lý tối đa 5 lớp học',
            'Không giới hạn số lượng bài tập',
            'Tích hợp bảng trắng & phòng họp',
            'Báo cáo điểm số cơ bản',
          ],
        },
        {
          id: 'PRO',
          name: 'Gói Chuyên nghiệp',
          description:
            'Dành cho giáo viên và học sinh muốn học tập chuyên sâu.',
          isPopular: true,
          prices: PLAN_PRICES.PRO,
          features: [
            'Không giới hạn số lượng lớp học & học sinh',
            'Trợ lý AI tạo Quiz & Podcast không giới hạn',
            'Bảng trắng tương tác thời gian thực',
            'Xuất báo cáo điểm thi Excel/PDF chuyên nghiệp',
            'Ưu tiên kết nối phòng họp trực tuyến',
          ],
        },
        {
          id: 'PREMIUM',
          name: 'Gói Cao cấp',
          description: 'Dành cho trường học và tổ chức giáo dục quy mô lớn.',
          prices: PLAN_PRICES.PREMIUM,
          features: [
            'Mọi tính năng của gói Chuyên nghiệp',
            'Lưu trữ đám mây Cloudflare R2 dung lượng cao',
            'Họp trực tuyến HD không giới hạn thời lượng',
            'Tùy chỉnh thương hiệu riêng cho lớp học',
            'Hỗ trợ kỹ thuật ưu tiên 24/7 từ chuyên viên',
          ],
        },
      ],
    };
  }

  /**
   * POST /payment/create-subscription — Tạo đơn hàng & lấy link thanh toán
   */
  @Post('create-subscription')
  @UseGuards(JwtAuthGuard)
  createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionPaymentDto,
  ) {
    return this.paymentService.createSubscriptionPayment(user.id, dto);
  }

  /**
   * POST /payment/zalopay/callback — Webhook IPN từ ZaloPay
   */
  @Post('zalopay/callback')
  @HttpCode(HttpStatus.OK)
  handleZaloPayCallback(@Body() body: any) {
    return this.paymentService.handleZaloPayCallback(body);
  }

  /**
   * POST /payment/momo/callback — Webhook IPN từ MoMo
   */
  @Post('momo/callback')
  @HttpCode(HttpStatus.OK)
  handleMoMoCallback(@Body() body: any) {
    return this.paymentService.handleMoMoCallback(body);
  }

  /**
   * GET /payment/vnpay/callback — Webhook IPN / Redirect từ VNPay
   */
  @Get('vnpay/callback')
  @HttpCode(HttpStatus.OK)
  handleVNPayCallbackGet(@Query() query: any) {
    return this.paymentService.handleVNPayCallback(query);
  }

  /**
   * POST /payment/vnpay/callback — Webhook IPN từ VNPay
   */
  @Post('vnpay/callback')
  @HttpCode(HttpStatus.OK)
  handleVNPayCallbackPost(@Body() body: any) {
    return this.paymentService.handleVNPayCallback(body);
  }

  /**
   * POST /payment/verify-return — Xác thực dữ liệu trả về từ trình duyệt (Localhost & Webhook)
   */
  @Post('verify-return')
  @UseGuards(JwtAuthGuard)
  verifyPaymentReturn(@Body() body: any) {
    return this.paymentService.verifyPaymentReturn(body);
  }

  /**
   * GET /payment/order-status/:orderId — Kiểm tra trạng thái đơn hàng
   */

  @Get('order-status/:orderId')
  @UseGuards(JwtAuthGuard)
  getOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentService.getOrderStatus(orderId, user.id);
  }
}
