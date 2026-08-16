import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { PodcastRequestDto } from './dto/podcast-request.dto';
import { GenerateEssayDto } from './dto/generate-essay.dto';
import { ShuffleQuizDto } from './dto/shuffle-quiz.dto';
import { DownloadQuizDto } from './dto/download-quiz.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─── POST /ai/upload-documents ─────────────────────────────────────────────
  @Post('upload-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
    return this.aiService.uploadDocuments(files);
  }

  // ─── POST /ai/chat ─────────────────────────────────────────────────────────
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  chat(@Body() dto: ChatRequestDto) {
    return this.aiService.chat(dto);
  }

  // ─── GET /ai/session/:sessionId/info ───────────────────────────────────────
  @Get('session/:sessionId/info')
  @UseGuards(JwtAuthGuard)
  getSessionInfo(@Param('sessionId') sessionId: string) {
    return this.aiService.getSessionInfo(sessionId);
  }

  // ─── GET /ai/session/:sessionId/history ────────────────────────────────────
  @Get('session/:sessionId/history')
  @UseGuards(JwtAuthGuard)
  getSessionHistory(@Param('sessionId') sessionId: string) {
    return this.aiService.getSessionHistory(sessionId);
  }

  // ─── POST /ai/generate-podcast ─────────────────────────────────────────────
  @Post('generate-podcast')
  @UseGuards(JwtAuthGuard)
  generatePodcast(@Body() dto: PodcastRequestDto) {
    return this.aiService.generatePodcast(dto);
  }

  // ─── GET /ai/audio/:filename ───────────────────────────────────────────────
  @Get('audio/:filename')
  async getAudio(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const buffer = await this.aiService.getAudio(filename);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  // ─── POST /ai/generate-essay-questions ─────────────────────────────────────
  @Post('generate-essay-questions')
  @UseGuards(JwtAuthGuard)
  generateEssayQuestions(@Body() dto: GenerateEssayDto) {
    return this.aiService.generateEssayQuestions(dto);
  }

  // ─── POST /ai/extract-quiz ─────────────────────────────────────────────────
  @Post('extract-quiz')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  extractQuiz(@UploadedFile() file: Express.Multer.File) {
    return this.aiService.extractQuiz(file);
  }

  // ─── POST /ai/shuffle-quiz ─────────────────────────────────────────────────
  @Post('shuffle-quiz')
  @UseGuards(JwtAuthGuard)
  shuffleQuiz(@Body() dto: ShuffleQuizDto) {
    return this.aiService.shuffleQuiz(dto);
  }

  // ─── POST /ai/download-quiz ────────────────────────────────────────────────
  @Post('download-quiz')
  @UseGuards(JwtAuthGuard)
  async downloadQuiz(
    @Body() dto: DownloadQuizDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, contentDisposition } =
      await this.aiService.downloadQuiz(dto);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}
