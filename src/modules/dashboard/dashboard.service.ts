import { Injectable } from '@nestjs/common';
import { User } from 'src/models/User.model';
import { Quiz } from 'src/models/Quiz.model';
import { QuizAttempt } from 'src/models/QuizAttempt.model';
import { QuizAttemptAnswer } from 'src/models/QuizAttemptAnswer.model';
import { Question } from 'src/models/Question.model';
import { Role } from 'src/models/Role.model';
import { Op } from 'sequelize';

@Injectable()
export class DashboardService {
  // ─── Student Dashboard ───────────────────────────────────────────────────────

  async studentDashboard(user: User) {
    const attempts = await QuizAttempt.findAll({
      where: { userId: user.id },
      include: [{ model: Quiz, as: 'quiz', attributes: ['id', 'title', 'subject'] }],
      order: [['createdAt', 'DESC']],
    });

    const completed = attempts.filter(a => a.status === 'completed');
    const avgScore =
      completed.length > 0
        ? completed.reduce((s, a) => s + (a.percentage || 0), 0) / completed.length
        : 0;

    const recentAttempts = completed.slice(0, 5).map(a => ({
      id: a.id,
      quiz: (a as any).quiz,
      score: a.percentage,
      passed: a.passed,
      completedAt: a.completedAt,
      difficulty: a.currentDifficulty,
    }));

    // Difficulty distribution from answers
    const answers = await QuizAttemptAnswer.findAll({
      where: { attemptId: { [Op.in]: completed.map(a => a.id) } },
      attributes: ['difficultyAtTime', 'isCorrect'],
    });

    const difficultyBreakdown = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    };

    answers.forEach(a => {
      const score = a.difficultyAtTime ?? 0.5;
      const label = score <= 0.35 ? 'easy' : score <= 0.65 ? 'medium' : 'hard';
      difficultyBreakdown[label].total++;
      if (a.isCorrect) difficultyBreakdown[label].correct++;
    });

    const profile = (user.performanceProfile as any) || {};

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        grade: user.grade,
        totalQuizzesTaken: user.totalQuizzesTaken,
        avgScore: Math.round(avgScore * 100) / 100,
      },
      stats: {
        totalAttempts: attempts.length,
        completedAttempts: completed.length,
        passedAttempts: completed.filter(a => a.passed).length,
        avgScore: Math.round(avgScore * 100) / 100,
        passRate:
          completed.length > 0
            ? Math.round((completed.filter(a => a.passed).length / completed.length) * 100)
            : 0,
      },
      performanceProfile: {
        strengths: profile.strengths || [],
        weaknesses: profile.weaknesses || [],
        preferredDifficulty: profile.preferredDifficulty || 'medium',
      },
      difficultyBreakdown,
      recentAttempts,
      progressOverTime: completed.slice(0, 10).reverse().map(a => ({
        date: a.completedAt,
        score: a.percentage,
        difficulty: a.currentDifficulty,
      })),
    };
  }

  // ─── Teacher Dashboard ───────────────────────────────────────────────────────

  async teacherDashboard(user: User) {
    const quizzes = await Quiz.findAll({
      where: { createdByUserId: user.id },
      include: [{ model: Question, as: 'questions', attributes: ['id', 'difficulty'] }],
      order: [['createdAt', 'DESC']],
    });

    const quizIds = quizzes.map(q => q.id);

    const attempts = await QuizAttempt.findAll({
      where: { quizId: { [Op.in]: quizIds }, status: 'completed' },
      attributes: ['quizId', 'percentage', 'passed', 'userId'],
    });

    // Per-quiz stats
    const quizStats = quizzes.map(quiz => {
      const qAttempts = attempts.filter(a => a.quizId === quiz.id);
      const avgScore =
        qAttempts.length > 0
          ? qAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / qAttempts.length
          : 0;
      const passRate =
        qAttempts.length > 0
          ? (qAttempts.filter(a => a.passed).length / qAttempts.length) * 100
          : 0;

      return {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        isPublished: quiz.isPublished,
        isAdaptive: quiz.isAdaptive,
        totalQuestions: quiz.totalQuestions,
        totalAttempts: qAttempts.length,
        uniqueStudents: new Set(qAttempts.map(a => a.userId)).size,
        avgScore: Math.round(avgScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      };
    });

    return {
      teacher: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        subject: user.subject,
      },
      summary: {
        totalQuizzes: quizzes.length,
        publishedQuizzes: quizzes.filter(q => q.isPublished).length,
        totalAttempts: attempts.length,
        uniqueStudents: new Set(attempts.map(a => a.userId)).size,
        avgPassRate:
          quizStats.length > 0
            ? Math.round(
                quizStats.reduce((s, q) => s + q.passRate, 0) / quizStats.length,
              )
            : 0,
      },
      quizzes: quizStats,
    };
  }

  async teacherAttempts(user: User) {
    const quizzes = await Quiz.findAll({
      where: { createdByUserId: user.id },
      attributes: ['id'],
    });

    const quizIds = quizzes.map(q => q.id);

    return QuizAttempt.findAll({
      where: { quizId: { [Op.in]: quizIds }, status: 'completed' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Quiz, as: 'quiz', attributes: ['id', 'title'] },
      ],
      order: [['completedAt', 'DESC']],
    });
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────────────

  async adminDashboard() {
    const [totalUsers, totalQuizzes, totalAttempts] = await Promise.all([
      User.count({ where: { deletedAt: null } }),
      Quiz.count({ where: { deletedAt: null } }),
      QuizAttempt.count({ where: { status: 'completed' } }),
    ]);

    // Role breakdown: count users per role
    const roles = await Role.findAll({ attributes: ['id', 'name'] });
    const roleBreakdown = await Promise.all(
      roles.map(async (role) => ({
        role: role.name,
        count: await User.count({ where: { roleId: role.id, deletedAt: null } }),
      })),
    );

    const recentAttempts = await QuizAttempt.findAll({
      where: { status: 'completed' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Quiz, as: 'quiz', attributes: ['id', 'title'] },
      ],
      order: [['completedAt', 'DESC']],
      limit: 10,
    });

    const completedAttempts = await QuizAttempt.findAll({
      where: { status: 'completed' },
      attributes: ['percentage'],
    });
    const systemAvgScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / completedAttempts.length
        : 0;

    return {
      summary: {
        totalUsers,
        totalQuizzes,
        totalAttempts,
        systemAvgScore: Math.round(systemAvgScore * 100) / 100,
      },
      roleBreakdown,
      recentAttempts: recentAttempts.map(a => ({
        id: a.id,
        user: (a as any).user,
        quiz: (a as any).quiz,
        score: a.percentage,
        passed: a.passed,
        completedAt: a.completedAt,
      })),
    };
  }
}
