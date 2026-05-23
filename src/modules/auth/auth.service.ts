import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { User } from 'src/models/User.model';
import { Role } from 'src/models/Role.model';
import { Hash } from 'src/provider/hash/hash';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Token } from 'src/models/Token.model';
import { Notification } from 'src/models/Notification.model';
import { MailService } from 'src/modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private readonly mail: MailService) {}
  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, req: Request) {
    const user = await User.findOne({
      where: { email: dto.email.toLowerCase() },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!Hash.compare(user.password, dto.password)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.status) {
      throw new UnauthorizedException('Your account has been deactivated. Contact support.');
    }

    // Bind session token to this user
    await Token.update(
      { userId: user.id },
      { where: { id: req.token.id } },
    );
    req.token.setDataValue('userId', user.id);
    req.user = user;

    return this.safeUser(user);
  }

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, req: Request) {
    const existing = await User.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const role = await Role.findOne({ where: { name: dto.role } });
    if (!role) {
      throw new BadRequestException(`Role '${dto.role}' not found.`);
    }

    const user = await User.create({
      email: dto.email.toLowerCase(),
      password: Hash.make(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleId: role.id,
      grade: dto.grade ?? null,
      subject: dto.subject ?? null,
      status: true,
      totalQuizzesTaken: 0,
      totalScore: 0,
      performanceProfile: {
        avgScore: 0,
        strengths: [],
        weaknesses: [],
        preferredDifficulty: 'medium',
      },
    });

    // Auto-login after registration
    await Token.update(
      { userId: user.id },
      { where: { id: req.token.id } },
    );
    req.token.setDataValue('userId', user.id);

    // Welcome notification
    await Notification.create({
      userId: user.id,
      type: 'general',
      title: 'Welcome to QuizMinia! 🎉',
      message: `Hi ${user.firstName}, your account is ready. ${
        dto.role === 'teacher'
          ? 'Start creating adaptive quizzes for your students!'
          : 'Start taking adaptive quizzes and track your progress!'
      }`,
      data: { role: dto.role },
    });

    // Welcome email (fire-and-forget)
    this.mail.sendWelcome(user.email, user.firstName ?? 'there', dto.role).catch(() => {});

    return this.safeUser(await User.findByPk(user.id, { include: ['role'] }));
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(req: Request, res: Response) {
    // Unbind user from token (session remains but anonymous)
    await Token.update(
      { userId: null, payload: {} },
      { where: { id: req.token.id } },
    );
    res.clearCookie('auth');
    return { message: 'Logged out successfully.' };
  }

  // ─── Me ──────────────────────────────────────────────────────────────────────

  async me(req: Request) {
    return this.safeUser(req.user);
  }

  // ─── Update Profile ───────────────────────────────────────────────────────────

  async updateProfile(dto: UpdateProfileDto, user: User) {
    // Handle password change
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password.');
      }
      if (!Hash.compare(user.password, dto.currentPassword)) {
        throw new UnauthorizedException('Current password is incorrect.');
      }
    }

    await user.update({
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.grade !== undefined && { grade: dto.grade }),
      ...(dto.subject !== undefined && { subject: dto.subject }),
      ...(dto.newPassword && { password: Hash.make(dto.newPassword) }),
    });

    return this.safeUser(await User.findByPk(user.id, { include: ['role'] }));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private safeUser(user: User | null | undefined) {
    if (!user) return null;
    const { password, ...safe } = user.toJSON() as any;
    return safe;
  }
}
