import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/models/User.model';
import { Role } from 'src/models/Role.model';
import { Quiz } from 'src/models/Quiz.model';
import { QuizAttempt } from 'src/models/QuizAttempt.model';
import { Op } from 'sequelize';

@Injectable()
export class AdminService {
  // ─── List Users ───────────────────────────────────────────────────────────────

  async listUsers(query: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (query.role) {
      const role = await Role.findOne({ where: { name: query.role } });
      if (role) where.roleId = role.id;
    }

    if (query.status !== undefined) {
      where.status = query.status === 'true' || query.status === '1';
    }

    if (query.search) {
      where[Op.or as any] = [
        { firstName: { [Op.like]: `%${query.search}%` } },
        { lastName: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // ─── Get User ─────────────────────────────────────────────────────────────────

  async getUser(id: number) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // ─── Toggle User Status ───────────────────────────────────────────────────────

  async toggleStatus(id: number, requestingUser: User) {
    if (id === requestingUser.id) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) throw new NotFoundException('User not found.');

    // Prevent deactivating another admin
    if (user.role?.name === 'admin') {
      throw new ForbiddenException('Cannot change the status of another admin account.');
    }

    await user.update({ status: !user.status });

    return {
      message: `User ${user.status ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  // ─── Delete User (soft) ───────────────────────────────────────────────────────

  async deleteUser(id: number, requestingUser: User) {
    if (id === requestingUser.id) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) throw new NotFoundException('User not found.');

    if (user.role?.name === 'admin') {
      throw new ForbiddenException('Cannot delete another admin account.');
    }

    await user.destroy(); // soft delete (paranoid: true)
    return { message: 'User deleted successfully.' };
  }

  // ─── User Stats ───────────────────────────────────────────────────────────────

  async getUserStats(id: number) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
    if (!user) throw new NotFoundException('User not found.');

    const attempts = await QuizAttempt.findAll({
      where: { userId: id, status: 'completed' },
      include: [{ model: Quiz, as: 'quiz', attributes: ['id', 'title', 'subject'] }],
      order: [['completedAt', 'DESC']],
      limit: 10,
    });

    const quizzesCreated =
      user.role?.name === 'teacher'
        ? await Quiz.count({ where: { createdByUserId: id } })
        : 0;

    return {
      user,
      stats: {
        totalAttempts: attempts.length,
        quizzesCreated,
        recentAttempts: attempts.map(a => ({
          id: a.id,
          quiz: (a as any).quiz,
          score: a.percentage,
          passed: a.passed,
          completedAt: a.completedAt,
        })),
      },
    };
  }
}
