import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ZaloPayGateway } from './gateways/zalopay.gateway';
import { MoMoGateway } from './gateways/momo.gateway';
import { VNPayGateway } from './gateways/vnpay.gateway';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, ZaloPayGateway, MoMoGateway, VNPayGateway],
  exports: [PaymentService],
})
export class PaymentModule {}

