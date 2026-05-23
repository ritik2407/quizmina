import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { Quiz } from 'src/models/Quiz.model';
import { User } from 'src/models/User.model';
import { QuizAttempt } from 'src/models/QuizAttempt.model';
import { Notification } from 'src/models/Notification.model';
import { MailService } from 'src/modules/mail/mail.service';

/**
 * QuizSchedulerService
 *
 * Runs cron jobs to:
 *  1. Send 30-minute email + in-app reminder for upcoming scheduled quizzes
 *  2. Mark overdue in-progress attempts as abandoned (optional cleanup)
 */
@Injectable()
export class QuizSchedulerService {
  private readonly logger = new Logger(QuizSchedulerService.name);

  constructor(private readonly mail: MailService) {}

  /**
   * Runs every 5 minutes.
   * Finds quizzes scheduled to start within the next 30–35 minutes and sends
   * reminder emails + in-app notifications to all students who have not yet
   * started an attempt.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendScheduledReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 30 * 60 * 1000); // +30 min
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);   // +35 min

    const upcomingQuizzes = await Quiz.findAll({
      where: {
        scheduledAt: { [Op.between]: [windowStart, windowEnd] },
        isPublished: true,
      },
    });

    if (!upcomingQuizzes.length) return;

    this.logger.log(`Found ${upcomingQuizzes.length} quiz(zes) starting in ~30 min`);

    for (const quiz of upcomingQuizzes) {
      // Find students who have NOT yet started this quiz
      const attemptedUserIds = (
        await QuizAttempt.findAll({
          where: { quizId: quiz.id },
          attributes: ['userId'],
        })
      ).map(a => a.userId);

      // Get all students
      const students = await User.findAll({
        include: [{ association: 'role', where: { name: 'student' } }],
        where: {
          status: true,
          ...(attemptedUserIds.length > 0 ? { id: { [Op.notIn]: attemptedUserIds } } : {}),
        },
      });

      for (const student of students) {
        // Avoid duplicate notifications: check if one was already sent
        const alreadyNotified = await Notification.findOne({
          where: {
            userId: student.id,
            type: 'quiz_reminder',
            data: { quizId: quiz.id } as any,
          },
        });

        if (alreadyNotified) continue;

        // In-app notification
        await Notification.create({
          userId: student.id,
          type: 'quiz_reminder',
          title: `⏰ Quiz Starting Soon: "${quiz.title}"`,
          message: `"${quiz.title}" starts at ${quiz.scheduledAt!.toLocaleTimeString()}. Log in and be ready!`,
          data: { quizId: quiz.id, scheduledAt: quiz.scheduledAt },
        });

        // Email reminder
        await this.mail.sendQuizReminder(
          student.email,
          `${student.firstName} ${student.lastName}`,
          quiz.title,
          quiz.scheduledAt!,
        );
      }

      this.logger.log(`Sent reminders for quiz "${quiz.title}" to ${students.length} student(s)`);
    }
  }

  /**
   * Runs every hour.
   * Cleans up in-progress attempts that started more than 24 hours ago
   * (handles cases where students left without completing/abandoning).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleAttempts() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stale = await QuizAttempt.findAll({
      where: {
        status: 'in_progress',
        startedAt: { [Op.lt]: cutoff },
      },
    });

    if (!stale.length) return;

    await QuizAttempt.update(
      { status: 'abandoned' },
      {
        where: {
          id: { [Op.in]: stale.map(a => a.id) },
        },
      },
    );

    this.logger.log(`Cleaned up ${stale.length} stale in-progress attempt(s)`);
  }
}
