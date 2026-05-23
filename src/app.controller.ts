import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { User } from './models/User.model';

@Controller()
export class AppController {
  @Get()
  async index(@Req() req: Request, @Res() res: Response) {
    const userId = req.token?.getDataValue('userId');
    if (userId) {
      return res.redirect('/dashboard');
    }
    return res.redirect('/login');
  }

  @Get('login')
  async login(@Req() req: Request, @Res() res: Response) {
    const userId = req.token?.getDataValue('userId');
    if (userId) {
      return res.redirect('/dashboard');
    }
    return res.render('login');
  }

  @Get('register')
  async register(@Req() req: Request, @Res() res: Response) {
    const userId = req.token?.getDataValue('userId');
    if (userId) {
      return res.redirect('/dashboard');
    }
    return res.render('register');
  }

  @Get('dashboard')
  async dashboard(@Req() req: Request, @Res() res: Response) {
    const userId = req.token?.getDataValue('userId');
    if (!userId) {
      return res.redirect('/login');
    }

    const user = await User.findByPk(userId, { include: ['role'] });
    if (!user || !user.status) {
      res.clearCookie('auth');
      return res.redirect('/login');
    }

    if (user.role?.name === 'teacher' || user.role?.name === 'admin') {
      return res.render('teacher', { user });
    }
    return res.render('student', { user });
  }
}
