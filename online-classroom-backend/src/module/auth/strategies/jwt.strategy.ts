import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../lib/database/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
}

const cookieExtractor = (request: Request): string | null => {
  return request?.cookies?.session ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET_KEY');
    if (!secret) {
      throw new Error('JWT_SECRET_KEY is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
