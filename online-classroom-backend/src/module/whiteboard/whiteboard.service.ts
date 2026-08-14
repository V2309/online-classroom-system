import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';

@Injectable()
export class WhiteboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy trạng thái bảng trắng theo mã lớp
   */
  async getWhiteboardState(classCode: string) {
    const board = await this.prisma.whiteboard.findUnique({
      where: { classCode },
    });
    return board?.content || null;
  }

  /**
   * Lưu trạng thái bảng trắng (upsert)
   */
  async saveWhiteboardState(classCode: string, content: any) {
    const board = await this.prisma.whiteboard.upsert({
      where: { classCode },
      update: { content },
      create: {
        classCode,
        content,
      },
    });
    return { success: true, data: board };
  }
}
