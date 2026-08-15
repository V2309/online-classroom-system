import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { MessageActionDto, SendMessageDto } from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── GET /chat/class/:classCode/initial — Lấy dữ liệu chat ban đầu ──────
  @Get('class/:classCode/initial')
  getInitialChatData(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.getInitialChatData(classCode, user.id, user.role);
  }

  // ─── GET /chat/class/:classCode/pinned — Lấy tin nhắn đã ghim ───────────
  @Get('class/:classCode/pinned')
  getPinnedMessages(@Param('classCode') classCode: string) {
    return this.chatService.getPinnedMessages(classCode);
  }

  // ─── POST /chat/messages — Gửi tin nhắn ──────────────────────────────────
  @Post('messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, dto);
  }

  // ─── DELETE /chat/messages/:id — Xóa tin nhắn ─────────────────────────────
  @Delete('messages/:id')
  deleteMessage(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Query('classCode') classCode: string,
  ) {
    return this.chatService.deleteMessage(messageId, user.id, classCode);
  }

  // ─── POST /chat/messages/:id/recall — Thu hồi tin nhắn ────────────────────
  @Post('messages/:id/recall')
  @HttpCode(200)
  recallMessage(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MessageActionDto,
  ) {
    return this.chatService.recallMessage(messageId, user.id, dto.classCode);
  }

  // ─── POST /chat/messages/:id/pin — Ghim tin nhắn ──────────────────────────
  @Post('messages/:id/pin')
  @HttpCode(200)
  pinMessage(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MessageActionDto,
  ) {
    return this.chatService.pinMessage(messageId, user.id, dto.classCode);
  }

  // ─── POST /chat/messages/:id/unpin — Bỏ ghim tin nhắn ────────────────────
  @Post('messages/:id/unpin')
  @HttpCode(200)
  unpinMessage(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MessageActionDto,
  ) {
    return this.chatService.unpinMessage(messageId, user.id, dto.classCode);
  }
}
