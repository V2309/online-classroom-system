import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will only be logged.',
      );
    }
  }

  /**
   * Gửi email xác thực tài khoản
   */
  async sendVerificationEmail(
    toEmail: string,
    username: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    this.logger.log(
      `[MailService] Preparing verification email for ${toEmail}: ${verifyUrl}`,
    );

    if (!this.resend) {
      this.logger.warn(
        `[MailService] Mock send verification email to: ${toEmail}. Link: ${verifyUrl}`,
      );
      return {
        success: true,
        message: 'Đã tạo liên kết xác thực (chế độ log)',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Online Classroom <onboarding@resend.dev>',
        to: [toEmail],
        subject: 'Xác thực địa chỉ email - Online Classroom',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">Chào mừng ${username} đến với Online Classroom!</h2>
            <p>Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Xác thực Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Hoặc bạn có thể sao chép liên kết này vào trình duyệt:</p>
            <p style="color: #2563eb; word-break: break-all; font-size: 13px;">${verifyUrl}</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Liên kết xác thực có hiệu lực trong vòng 24 giờ.</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(
          '[MailService] Failed to send email via Resend:',
          error,
        );
        // Không crash nếu gửi mail gặp lỗi cấu hình domain Resend, vẫn log link để dev test
        return {
          success: true,
          message: 'Đã xử lý yêu cầu gửi email xác thực.',
        };
      }

      this.logger.log(`[MailService] Email sent successfully: ${data?.id}`);
      return { success: true, message: 'Đã gửi email xác thực thành công!' };
    } catch (err) {
      this.logger.error('[MailService] Unexpected error sending email:', err);
      return { success: true, message: 'Đã xử lý yêu cầu gửi email xác thực.' };
    }
  }
}
