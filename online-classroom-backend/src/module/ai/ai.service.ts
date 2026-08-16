import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRequestDto } from './dto/chat-request.dto';
import { PodcastRequestDto } from './dto/podcast-request.dto';
import { GenerateEssayDto } from './dto/generate-essay.dto';
import { ShuffleQuizDto } from './dto/shuffle-quiz.dto';
import { DownloadQuizDto } from './dto/download-quiz.dto';

@Injectable()
export class AiService {
  private readonly aiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.aiBaseUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  // ─── POST /upload-documents (Proxy sang FastAPI) ───────────────────────────
  async uploadDocuments(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 file PDF.');
    }

    try {
      const formData = new FormData();
      for (const file of files) {
        const blob = new Blob([file.buffer as any], {
          type: file.mimetype || 'application/pdf',
        });
        formData.append('files', blob, file.originalname);
      }

      const response = await fetch(`${this.aiBaseUrl}/upload-documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi xử lý tài liệu trên AI service',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── POST /chat (Proxy sang FastAPI) ───────────────────────────────────────
  async chat(dto: ChatRequestDto) {
    try {
      const response = await fetch(`${this.aiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi gửi tin nhắn đến AI agent',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── GET /session/:sessionId/info (Proxy sang FastAPI) ─────────────────────
  async getSessionInfo(sessionId: string) {
    try {
      const response = await fetch(
        `${this.aiBaseUrl}/session/${sessionId}/info`,
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Không tìm thấy session',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── GET /session/:sessionId/history (Proxy sang FastAPI) ──────────────────
  async getSessionHistory(sessionId: string) {
    try {
      const response = await fetch(
        `${this.aiBaseUrl}/session/${sessionId}/history`,
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Không tìm thấy lịch sử chat của session',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── POST /generate-podcast (Proxy sang FastAPI) ───────────────────────────
  async generatePodcast(dto: PodcastRequestDto) {
    try {
      const response = await fetch(`${this.aiBaseUrl}/generate-podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi tạo podcast',
          response.status,
        );
      }

      const result = await response.json();
      // Chuyển audio_url từ `/audio/xxx` sang `/api/ai/audio/xxx` để FE gọi qua gateway
      if (result.audio_url && result.audio_url.startsWith('/audio/')) {
        const filename = result.audio_url.replace('/audio/', '');
        result.audio_url = `/api/ai/audio/${filename}`;
      }

      return result;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── GET /audio/:filename (Proxy stream sang FastAPI) ──────────────────────
  async getAudio(filename: string) {
    try {
      const response = await fetch(`${this.aiBaseUrl}/audio/${filename}`);

      if (!response.ok) {
        throw new HttpException('File audio không tồn tại', response.status);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể tải file audio: ${error.message}`,
      );
    }
  }

  // ─── POST /api/generate-essay-questions (Proxy sang FastAPI) ───────────────
  async generateEssayQuestions(dto: GenerateEssayDto) {
    try {
      const response = await fetch(
        `${this.aiBaseUrl}/api/generate-essay-questions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi tạo câu hỏi tự luận',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── POST /api/extract-quiz (Proxy sang FastAPI) ───────────────────────────
  async extractQuiz(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để trích xuất đề thi.');
    }

    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer as any], {
        type: file.mimetype || 'application/octet-stream',
      });
      formData.append('file', blob, file.originalname);

      const response = await fetch(`${this.aiBaseUrl}/api/extract-quiz`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi trích xuất câu hỏi từ file',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── POST /api/shuffle-quiz (Proxy sang FastAPI) ───────────────────────────
  async shuffleQuiz(dto: ShuffleQuizDto) {
    try {
      const response = await fetch(`${this.aiBaseUrl}/api/shuffle-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi đảo đề thi',
          response.status,
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }

  // ─── POST /api/download-quiz (Proxy stream sang FastAPI) ───────────────────
  async downloadQuiz(dto: DownloadQuizDto) {
    try {
      const response = await fetch(`${this.aiBaseUrl}/api/download-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new HttpException(
          err.detail || 'Lỗi khi tạo file đề thi',
          response.status,
        );
      }

      const contentType =
        response.headers.get('content-type') ||
        (dto.format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      const contentDisposition =
        response.headers.get('content-disposition') ||
        `attachment; filename="${dto.filename || 'quiz'}.${dto.format}"`;

      const arrayBuffer = await response.arrayBuffer();

      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
        contentDisposition,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Không thể kết nối đến AI service: ${error.message}`,
      );
    }
  }
}
