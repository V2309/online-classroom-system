import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { R2Service } from '../../lib/r2/r2.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../../lib/database/prisma.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly r2Service: R2Service,
    private readonly prisma: PrismaService,
  ) {}

  // ─── GET /upload/r2-file — Stream/tải file từ Cloudflare R2 ───────────────
  @Get('r2-file')
  async streamR2File(
    @Query('key') key: string,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('Key file không hợp lệ.');
    }
    const fileObj = await this.r2Service.getFileObject(key);

    if (fileObj.contentType) {
      res.setHeader('Content-Type', fileObj.contentType);
    }
    if (fileObj.contentLength) {
      res.setHeader('Content-Length', fileObj.contentLength);
    }
    res.setHeader('Content-Disposition', 'inline');
    fileObj.stream.pipe(res);
  }

  // ─── POST /upload — Upload tổng quát (ảnh/video/file) qua ImageKit ────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.uploadService.uploadFile(file, folder || '/general');
  }

  // ─── POST /upload/document — Upload tài liệu lên Cloudflare R2 ────────────
  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.r2Service.uploadFile(file, folder || 'documents');
  }

  // ─── POST /upload/class-image — Upload ảnh bìa lớp học ────────────────────
  @Post('class-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadClassImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, '/classes');
  }

  // ─── POST /upload/avatar — Upload avatar người dùng ───────────────────────
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadPostMedia(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, '/posts');
  }
}
