import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '../../lib/pusher/pusher.service';
import { StreamClient } from '@stream-io/node-sdk';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private streamClient: StreamClient | null = null;
  private streamApiKey: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly pusherService: PusherService,
  ) {
    const apiKey = this.config.get<string>('STREAM_API_KEY');
    const apiSecret = this.config.get<string>('STREAM_SECRET_KEY');

    this.streamApiKey = apiKey;
    if (apiKey && apiSecret) {
      this.streamClient = new StreamClient(apiKey, apiSecret);
      this.logger.log('GetStream Client initialized successfully.');
    } else {
      this.logger.warn(
        'GetStream credentials missing. Video calls will be unavailable.',
      );
    }
  }

  // ─── Pusher Channel & User Authentication ────────────────────────────────
  authenticatePusher(
    user: AuthenticatedUser,
    socketId: string,
    channelName?: string,
  ) {
    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập.');
    }
    if (!socketId) {
      throw new BadRequestException('socket_id is required');
    }

    try {
      if (channelName) {
        if (channelName.startsWith('presence-')) {
          const presenceData = {
            user_id: user.id,
            user_info: {
              id: user.id,
              username: user.username,
              name: user.username,
              role: user.role,
              img: user.img || null,
            },
          };
          return this.pusherService.authorizeChannel(
            socketId,
            channelName,
            presenceData,
          );
        }

        // Private channel
        return this.pusherService.authorizeChannel(socketId, channelName);
      }

      // User Authentication (signin)
      const userData = {
        id: user.id,
        user_info: {
          id: user.id,
          username: user.username,
          name: user.username,
          role: user.role,
          img: user.img || null,
        },
      };
      return this.pusherService.authenticateUser(socketId, userData);
    } catch (error: any) {
      this.logger.error('Pusher authentication error:', error);
      throw new BadRequestException(error.message || 'Lỗi xác thực Pusher.');
    }
  }

  // ─── GetStream Video Token Provider ──────────────────────────────────────
  getStreamToken(user: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập.');
    }
    if (!this.streamClient || !this.streamApiKey) {
      throw new BadRequestException('Dịch vụ GetStream chưa được cấu hình.');
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 giờ
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    const token = this.streamClient.createToken(
      user.id,
      expirationTime,
      issuedAt,
    );

    return {
      token,
      apiKey: this.streamApiKey,
      userId: user.id,
      name: user.username,
    };
  }
}
