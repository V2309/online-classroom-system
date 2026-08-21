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
import { GroupModule } from './module/group/group.module';
import { PusherModule } from './lib/pusher/pusher.module';
import { ChatModule } from './module/chat/chat.module';
import { CourseModule } from './module/course/course.module';
import { DocumentModule } from './module/document/document.module';
import { RealtimeModule } from './module/realtime/realtime.module';
import { R2Module } from './lib/r2/r2.module';
import { HomeworkModule } from './module/homework/homework.module';
import { AiModule } from './module/ai/ai.module';
import { PaymentModule } from './module/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // để mọi module khác dùng ConfigService mà không cần import lại
    }),
    PrismaModule,
    PusherModule,
    R2Module,
    AuthModule,
    UserModule,
    ClassModule,
    PostModule,
    UploadModule,
    NotificationModule,
    WhiteboardModule,
    ScheduleModule,
    GroupModule,
    ChatModule,
    CourseModule,
    DocumentModule,
    RealtimeModule,
    HomeworkModule,
    AiModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
