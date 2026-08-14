import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/database/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { ClassModule } from './module/class/class.module';
import { PostModule } from './module/post/post.module';
import { UploadModule } from './module/upload/upload.module';
import { NotificationModule } from './module/notification/notification.module';
import { WhiteboardModule } from './module/whiteboard/whiteboard.module';
import { ScheduleModule } from './module/schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // để mọi module khác dùng ConfigService mà không cần import lại
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ClassModule,
    PostModule,
    UploadModule,
    NotificationModule,
    WhiteboardModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
