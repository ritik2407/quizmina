import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { Public } from 'src/decorators/public.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/models/User.model';
import { Reflector } from '@nestjs/core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(new AuthGuard(new Reflector()))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /auth/login */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns the authenticated user (password excluded)' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or deactivated account' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  /** POST /auth/register */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student or teacher account' })
  @ApiCreatedResponse({ description: 'Account created and auto-logged in' })
  @ApiBadRequestResponse({ description: 'Email already exists or role not found' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  /** POST /auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('auth')
  @ApiOperation({ summary: 'Logout and clear session cookie' })
  @ApiOkResponse({ description: 'Session cleared successfully' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  /** GET /auth/me */
  @Get('me')
  @ApiCookieAuth('auth')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiOkResponse({ description: 'Current user object (password excluded)' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  me(@Req() req: Request) {
    return this.authService.me(req);
  }

  /** PATCH /auth/profile */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('auth')
  @ApiOperation({ summary: 'Update the current user\'s profile (name, bio, grade, subject, password)' })
  @ApiOkResponse({ description: 'Updated user object (password excluded)' })
  @ApiBadRequestResponse({ description: 'Validation error or wrong current password' })
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: User) {
    return this.authService.updateProfile(dto, user);
  }
}
