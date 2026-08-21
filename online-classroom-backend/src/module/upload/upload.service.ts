import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

export interface UploadResult {
  url: string;
  filePath: string;
  fileId: string;
  name: string;
  height?: number;
  width?: number;
  fileType: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private imagekit: ImageKit;

  constructor(private readonly configService: ConfigService) {
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
    const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');

    if (publicKey && privateKey && urlEndpoint) {
      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
      this.logger.log('ImageKit initialized successfully.');
    } else {
      this.logger.warn('ImageKit credentials missing in environment config.');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = '/general',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để tải lên.');
    }

    // Giới hạn dung lượng 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Dung lượng file vượt quá giới hạn 10MB.');
    }

    if (!this.imagekit) {
      throw new BadRequestException(
        'Dịch vụ lưu trữ ImageKit chưa được cấu hình.',
      );
    }

    try {
      const response = await this.imagekit.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder,
      });

      return {
        url: response.url,
        filePath: response.filePath,
        fileId: response.fileId,
        name: response.name,
        height: response.height,
        width: response.width,
        fileType: response.fileType,
      };
    } catch (error: any) {
      this.logger.error('Upload to ImageKit failed:', error);
      throw new BadRequestException(
        error.message || 'Có lỗi xảy ra khi tải file lên máy chủ lưu trữ.',
      );
    }
  }
}
