import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { Token } from 'src/models/Token.model';
import { TokenManager } from 'src/provider/token-manager/token-manager';
import { randomString } from 'src/utility/helpers';

declare module 'express-serve-static-core' {
  interface Request {
    accessToken?: string;
  }
}

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authToken = req.cookies?.auth;

      if (authToken) {
        req.accessToken = authToken;
        const existingToken = await this.validateAndGetToken(authToken);
        req.token = existingToken || await this.createAndSetNewToken(res);
      } else {
        req.token = await this.createAndSetNewToken(res);
      }

      this.attachSessionMethods(req);
    } catch (error) {
      req.token = await this.createAndSetNewToken(res);
      this.attachSessionMethods(req);
      Logger.error(`Issue during validate or cookies token create new token`, 'RequestMiddleware');
      Logger.error(error.stack, 'RequestMiddleware');
    }

    const headerTz = req.headers['x-timezone'] as string;
    const headerGmt = req.headers['x-gmt'] as string;
    let shouldSave = false;

    if (headerTz && req.token.timeZone !== headerTz) {
      req.token.timeZone = headerTz;
      shouldSave = true;
    }

    if (headerGmt && req.token.gmt !== headerGmt) {
      req.token.gmt = headerGmt;
      shouldSave = true;
    }

    if (shouldSave) {
      await req.token.save();
    }

    next();
  }

  private async validateAndGetToken(authToken: string): Promise<Token | null> {
    const payload = TokenManager.verify(authToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    return await Token.findOne({
      where: { token: payload.token },
      attributes: ['id', 'token', 'userId', 'payload'],
    });
  }

  private async createAndSetNewToken(res: Response): Promise<Token> {
    const tokenData = await Token.create({
      token: randomString(32),
      payload: {},
    });

    const signedToken = TokenManager.create(tokenData);
    res.cookie('auth', signedToken);

    return tokenData;
  }

  private attachSessionMethods(req: Request): void {
    req.session = {
      set: (key: string, value: any) => this.setSession(key, value, req),
      get: (key: string) => this.getSession(req, key),
      remove: (key: string) => this.removeSession(key, req),
      clear: () => this.clearSession(req),
    };
  }

  private async setSession(key: string, value: any, req: Request): Promise<void> {
    const prev = req.token.getDataValue('payload');
    const base = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};
    base[key] = value;
    req.token.setDataValue('payload', base);

    await Token.update(
      { payload: base },
      {
        where: {
          id: req.token.getDataValue('id'),
        },
      },
    );

    return;
  }

  private getSession(req: Request, key?: string): any {
    const payload = req.token.getDataValue('payload');
    if (key) {
      if (!payload || typeof payload !== 'object') return undefined;
      return (payload as Record<string, unknown>)[key];
    }
    return payload;
  }

  private async removeSession(key: string, req: Request): Promise<void> {
    const prev = req.token.getDataValue('payload');
    const payload =
      prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};
    delete payload[key];
    req.token.setDataValue('payload', payload);

    await Token.update(
      { payload },
      {
        where: {
          id: req.token.getDataValue('id'),
        },
      },
    );

    await req.token.save();
  }

  private async clearSession(req: Request): Promise<void> {
    req.token.setDataValue('payload', {});
    await req.token.save();
  }
}
