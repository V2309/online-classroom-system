import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private pusher: Pusher | null = null;

  constructor(private readonly config: ConfigService) {
    const appId = this.config.get<string>('PUSHER_APP_ID');
    const key = this.config.get<string>('PUSHER_KEY');
    const secret = this.config.get<string>('PUSHER_SECRET');
    const cluster = this.config.get<string>('PUSHER_CLUSTER', 'ap1');

    if (appId && key && secret) {
      this.pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
      this.logger.log('Pusher initialized successfully.');
    } else {
      this.logger.warn('Pusher credentials missing. Pusher is disabled.');
    }
  }

  async trigger(channel: string, event: string, data: any): Promise<void> {
    if (!this.pusher) {
      this.logger.warn(
        `Pusher is not initialized. Event ${event} on channel ${channel} skipped.`,
      );
      return;
    }
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      this.logger.error(
        `Failed to trigger Pusher event ${event} on channel ${channel}:`,
        error,
      );
    }
  }

  authorizeChannel(socketId: string, channelName: string, presenceData?: any) {
    if (!this.pusher) {
      throw new Error('Pusher not initialized');
    }
    return this.pusher.authorizeChannel(socketId, channelName, presenceData);
  }

  authenticateUser(socketId: string, userData: any) {
    if (!this.pusher) {
      throw new Error('Pusher not initialized');
    }
    return this.pusher.authenticateUser(socketId, userData);
  }
}
