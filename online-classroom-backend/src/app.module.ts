import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/database/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { ClassModule } from './module/class/class.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // để mọi module khác dùng ConfigService mà không cần import lại
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ClassModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
