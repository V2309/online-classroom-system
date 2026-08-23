import { IsEnum, IsNotEmpty } from 'class-validator';
import {
  BillingCycle,
  PaymentProvider,
  PlanType,
} from '../../../generated/prisma/enums';

export class CreateSubscriptionPaymentDto {
  @IsNotEmpty({ message: 'Vui lòng chọn gói tài khoản (PRO hoặc PREMIUM).' })
  @IsEnum(PlanType, { message: 'Gói tài khoản không hợp lệ.' })
  plan: PlanType;

  @IsNotEmpty({
    message: 'Vui lòng chọn chu kỳ thanh toán (MONTHLY hoặc YEARLY).',
  })
  @IsEnum(BillingCycle, { message: 'Chu kỳ thanh toán không hợp lệ.' })
  billingCycle: BillingCycle;

  @IsNotEmpty({
    message: 'Vui lòng chọn cổng thanh toán (ZALOPAY, MOMO hoặc VNPAY).',
  })
  @IsEnum(PaymentProvider, { message: 'Cổng thanh toán không hợp lệ.' })
  provider: PaymentProvider;
}
