import { Module } from '@nestjs/common';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';

@Module({
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
