import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../../lib/database/prisma.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── POST /upload — Upload tổng quát (ảnh/video/file) ──────────────────────
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.uploadService.uploadFile(file, folder || '/general');
  }

  // ─── POST /upload/class-image — Upload ảnh bìa lớp học ────────────────────
  @Post('class-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadClassImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, '/classes');
  }

  // ─── POST /upload/avatar — Upload avatar người dùng ───────────────────────
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.uploadService.uploadFile(file, '/avatars');
    if (user?.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { img: result.url },
      });
    }
    return result;
  }

  // ─── POST /upload/posts — Upload media cho bài viết ───────────────────────
  @Post('posts')
  @UseInterceptors(FileInterceptor('file'))
  uploadPostMedia(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, '/posts');
  }
}
