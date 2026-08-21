import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RealtimeService } from './realtime.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  // ─── POST /realtime/pusher/auth — Xác thực Pusher Channel / Presence / User ─
  @Post('pusher/auth')
  authenticatePusher(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const socketId = body?.socket_id || (req.body && req.body.socket_id);
    const channelName =
      body?.channel_name || (req.body && req.body.channel_name);

    return this.realtimeService.authenticatePusher(user, socketId, channelName);
  }

  // ─── GET /realtime/stream/token — Cấp GetStream Video Token ────────────────
  @Get('stream/token')
  getStreamToken(@CurrentUser() user: AuthenticatedUser) {
    return this.realtimeService.getStreamToken(user);
  }
}
