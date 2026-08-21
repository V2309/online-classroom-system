import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface R2UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private backendUrl: string;
  private publicUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'class-file';
    this.backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:8080';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('Cloudflare R2 Client initialized successfully.');
    } else {
      this.logger.warn(
        'Cloudflare R2 credentials missing in environment config.',
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<R2UploadResult> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để tải lên.');
    }

    const maxSizeBytes = 20 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Dung lượng file vượt quá giới hạn 20MB.');
    }

    if (!this.s3Client) {
      throw new BadRequestException(
        'Dịch vụ lưu trữ Cloudflare R2 chưa được cấu hình.',
      );
    }

    const cleanFileName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    const key = `${folder}/${Date.now()}-${cleanFileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Nếu có R2_PUBLIC_URL thì dùng URL đó, nếu không thì dùng endpoint proxy stream an toàn qua backend
      const fileUrl = this.publicUrl
        ? `${this.publicUrl.replace(/\/$/, '')}/${key}`
        : `${this.backendUrl}/api/upload/r2-file?key=${encodeURIComponent(key)}`;

      this.logger.log(`Uploaded file to R2 successfully: ${key}`);

      return {
        url: fileUrl,
        key,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      };
    } catch (error: any) {
      this.logger.error('Upload to Cloudflare R2 failed:', error);
      throw new BadRequestException(
        error.message || 'Có lỗi xảy ra khi tải file lên Cloudflare R2.',
      );
    }
  }

  async getPresignedUrl(
    key: string,
    expiresInSeconds: number = 7200,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException('Cloudflare R2 chưa được cấu hình.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async getFileObject(key: string): Promise<{
    stream: Readable;
    contentType?: string;
    contentLength?: number;
  }> {
    if (!this.s3Client) {
      throw new NotFoundException('Cloudflare R2 client không khả dụng.');
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error: any) {
      this.logger.error(`Error reading file from R2 (${key}):`, error);
      throw new NotFoundException('Không tìm thấy file trên Cloudflare R2.');
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client || !key) return;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file from R2: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from R2 (${key}):`, error);
    }
  }
}
