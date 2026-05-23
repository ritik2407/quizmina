import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { User } from 'src/models/User.model';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

/**
 * Custom Auth Guard — uses the session-based Token already attached by
 * RequestMiddleware (AES-256-CBC encrypted cookie → DB lookup).
 * If req.token.userId is set the request is authenticated.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow routes decorated with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();

    const userId = req.token?.getDataValue('userId');
    if (!userId) {
      throw new UnauthorizedException('Not authenticated. Please log in.');
    }

    // Attach full user to request
    const user = await User.findByPk(userId, {
      include: ['role'],
    });

    if (!user || !user.status) {
      throw new UnauthorizedException('Account inactive or not found.');
    }

    req.user = user;
    return true;
  }
}
