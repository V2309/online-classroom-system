import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SaveWhiteboardDto } from './dto/whiteboard.dto';

@Controller('whiteboard')
@UseGuards(JwtAuthGuard)
export class WhiteboardController {
  constructor(private readonly whiteboardService: WhiteboardService) {}

  /**
   * GET /whiteboard/:classCode — Lấy dữ liệu bảng trắng
   */
  @Get(':classCode')
  getWhiteboardState(@Param('classCode') classCode: string) {
    return this.whiteboardService.getWhiteboardState(classCode);
  }

  /**
   * PUT /whiteboard/:classCode — Lưu/cập nhật dữ liệu bảng trắng
   */
  @Put(':classCode')
  saveWhiteboardState(
    @Param('classCode') classCode: string,
    @Body() dto: SaveWhiteboardDto,
  ) {
    return this.whiteboardService.saveWhiteboardState(classCode, dto.content);
  }
}
