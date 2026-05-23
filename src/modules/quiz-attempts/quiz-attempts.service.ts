import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Quiz } from 'src/models/Quiz.model';
import { Question } from 'src/models/Question.model';
import { QuizAttempt } from 'src/models/QuizAttempt.model';
import { QuizAttemptAnswer } from 'src/models/QuizAttemptAnswer.model';
import { User } from 'src/models/User.model';
import { Notification } from 'src/models/Notification.model';
import { AiService } from 'src/modules/ai/ai.service';
import { MailService } from 'src/modules/mail/mail.service';
import { StartAttemptDto, SubmitAnswerDto } from './dto/attempt.dto';
import { Op } from 'sequelize';

@Injectable()
export class QuizAttemptsService {
  constructor(
    private readonly ai: AiService,
    private readonly mail: MailService,
  ) {}

  // ─── Start a new attempt ─────────────────────────────────────────────────────

  async start(dto: StartAttemptDto, user: User) {
    const quiz = await Quiz.findByPk(dto.quizId, {
      include: [{ model: Question, as: 'questions', order: [['orderIndex', 'ASC']] }],
    });

    if (!quiz) throw new NotFoundException('Quiz not found.');
    if (!quiz.isPublished) throw new ForbiddenException('This quiz is not published yet.');
    if (!quiz.questions?.length) throw new BadRequestException('This quiz has no questions.');

    // Check for existing in-progress attempt
    const existing = await QuizAttempt.findOne({
      where: { quizId: quiz.id, userId: user.id, status: 'in_progress' },
    });
    if (existing) {
      return this.getAttemptState(existing.id, user);
    }

    // Determine initial difficulty (from user's performance profile)
    const profile = (user.performanceProfile as any) || {};
    const initDifficulty = profile.preferredDifficulty === 'hard' ? 0.7
      : profile.preferredDifficulty === 'easy' ? 0.3 : 0.5;

    const attempt = await QuizAttempt.create({
      quizId: quiz.id,
      userId: user.id,
      status: 'in_progress',
      currentDifficulty: this.ai.scoreToLabel(initDifficulty),
      currentDifficultyScore: initDifficulty,
      totalQuestions: quiz.totalQuestions || quiz.questions.length,
      answeredQuestions: 0,
      correctAnswers: 0,
      startedAt: new Date(),
      aiInsights: {
        correctStreak: 0,
        wrongStreak: 0,
        difficultyHistory: [],
        performanceSummary: '',
      },
    });

    return this.getAttemptState(attempt.id, user);
  }

  // ─── Get attempt state + next question ───────────────────────────────────────

  async getAttemptState(attemptId: number, user: User) {
    const attempt = await this.loadAttempt(attemptId, user);
    const nextQuestion = await this.pickNextQuestion(attempt);

    return {
      attempt: this.serializeAttempt(attempt),
      nextQuestion: nextQuestion ? this.serializeQuestion(nextQuestion) : null,
      isComplete: !nextQuestion,
    };
  }

  // ─── Submit an answer ────────────────────────────────────────────────────────

  async submitAnswer(attemptId: number, dto: SubmitAnswerDto, user: User) {
    const attempt = await this.loadAttempt(attemptId, user);

    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('This attempt is already completed.');
    }

    const question = await Question.findByPk(dto.questionId);
    if (!question || question.quizId !== attempt.quizId) {
      throw new BadRequestException('Question does not belong to this quiz.');
    }

    // Check already answered
    const alreadyAnswered = await QuizAttemptAnswer.findOne({
      where: { attemptId, questionId: dto.questionId },
    });
    if (alreadyAnswered) {
      throw new BadRequestException('Question already answered in this attempt.');
    }

    // Grade the answer
    const isCorrect = this.gradeAnswer(question, dto.answer);
    const pointsEarned = isCorrect ? question.points : 0;

    // AI: compute next difficulty
    const insights = attempt.aiInsights || { correctStreak: 0, wrongStreak: 0, difficultyHistory: [] };
    const newCorrectStreak = isCorrect ? insights.correctStreak + 1 : 0;
    const newWrongStreak = isCorrect ? 0 : insights.wrongStreak + 1;

    const adaptive = await this.ai.getNextDifficulty({
      currentScore: attempt.currentDifficultyScore,
      isCorrect,
      correctStreak: newCorrectStreak,
      wrongStreak: newWrongStreak,
      difficultyHistory: insights.difficultyHistory || [],
      totalCorrect: attempt.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswered: attempt.answeredQuestions + 1,
    });

    // AI feedback for this answer
    const aiFeedback = await this.ai.generateAnswerFeedback({
      questionText: question.text,
      correctAnswer: question.correctAnswer,
      givenAnswer: dto.answer,
      isCorrect,
      explanation: question.explanation,
    });

    // Record the answer
    await QuizAttemptAnswer.create({
      attemptId,
      questionId: dto.questionId,
      userAnswer: dto.answer,
      isCorrect,
      pointsEarned,
      timeTaken: dto.timeTaken ?? null,
      difficultyAtTime: attempt.currentDifficultyScore,
      aiAdjustedNext: adaptive.aiAdjusted,
      answeredAt: new Date(),
    });

    // Update attempt progress and AI state
    const newAnswered = attempt.answeredQuestions + 1;
    const newCorrect = attempt.correctAnswers + (isCorrect ? 1 : 0);
    const newHistory = [...(insights.difficultyHistory || []), attempt.currentDifficultyScore];

    await attempt.update({
      answeredQuestions: newAnswered,
      correctAnswers: newCorrect,
      currentDifficulty: adaptive.nextDifficultyLabel,
      currentDifficultyScore: adaptive.nextDifficultyScore,
      aiInsights: {
        correctStreak: newCorrectStreak,
        wrongStreak: newWrongStreak,
        difficultyHistory: newHistory.slice(-10), // Keep last 10
        performanceSummary: adaptive.insights,
      },
    });

    await attempt.reload();

    // Pick next question
    const nextQuestion = await this.pickNextQuestion(attempt);

    return {
      isCorrect,
      pointsEarned,
      correctAnswer: question.correctAnswer,
      aiFeedback,
      difficultyAdjustment: {
        previous: this.ai.scoreToLabel(attempt.currentDifficultyScore),
        next: adaptive.nextDifficultyLabel,
        aiAdjusted: adaptive.aiAdjusted,
        insight: adaptive.insights,
      },
      attempt: this.serializeAttempt(attempt),
      nextQuestion: nextQuestion ? this.serializeQuestion(nextQuestion) : null,
      isComplete: !nextQuestion,
    };
  }

  // ─── Complete attempt ────────────────────────────────────────────────────────

  async complete(attemptId: number, user: User) {
    const attempt = await this.loadAttempt(attemptId, user);

    if (attempt.status === 'completed') {
      return this.getCompletedResult(attempt);
    }

    const quiz = await Quiz.findByPk(attempt.quizId);
    const allAnswers = await QuizAttemptAnswer.findAll({
      where: { attemptId },
      include: [{ model: Question, as: 'question' }],
    });

    const totalPoints = allAnswers.reduce((s, a) => s + (a.question?.points || 0), 0);
    const earnedPoints = allAnswers.reduce((s, a) => s + a.pointsEarned, 0);
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= (quiz?.passingScore || 60);

    const timeTaken = attempt.startedAt
      ? Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
      : null;

    // AI performance summary
    const tags = allAnswers.map(a => (a.question?.tags as string[]) || []);
    const correctFlags = allAnswers.map(a => a.isCorrect === true);
    const diffHistory = (attempt.aiInsights?.difficultyHistory || []);

    const summary = await this.ai.generatePerformanceSummary({
      quizTitle: quiz?.title || 'Quiz',
      totalQuestions: allAnswers.length,
      correctAnswers: attempt.correctAnswers,
      percentage,
      difficultyHistory: diffHistory,
      tags,
      correctFlags,
    });

    await attempt.update({
      status: 'completed',
      score: earnedPoints,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      completedAt: new Date(),
      timeTaken,
      aiInsights: {
        ...attempt.aiInsights,
        performanceSummary: summary.summary,
      },
    });

    // Update user stats
    await this.updateUserStats(user, percentage, summary);

    // Send result notification
    await Notification.create({
      userId: user.id,
      type: 'quiz_result',
      title: `Quiz Result: ${quiz?.title}`,
      message: `You scored ${percentage.toFixed(1)}%. ${passed ? '✅ Passed!' : '❌ Not passed. Keep practicing!'}`,
      data: {
        quizId: attempt.quizId,
        attemptId: attempt.id,
        score: percentage,
        passed,
        summary: summary.summary,
      },
    });

    // AI insight notification if meaningful
    if (summary.weaknesses.length > 0) {
      await Notification.create({
        userId: user.id,
        type: 'ai_insight',
        title: '🤖 AI Learning Insight',
        message: `Areas to improve: ${summary.weaknesses.join(', ')}. ${summary.strengths.length > 0 ? `You're strong in: ${summary.strengths.join(', ')}.` : ''}`,
        data: { attemptId: attempt.id, ...summary },
      });
    }

    await attempt.reload();

    // Result email (fire-and-forget)
    this.mail.sendQuizResult(
      user.email,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      quiz?.title || 'Quiz',
      percentage,
      passed,
      summary.summary,
    ).catch(() => {});

    return this.getCompletedResult(attempt);
  }

  // ─── Abandon attempt ─────────────────────────────────────────────────────────

  async abandon(attemptId: number, user: User) {
    const attempt = await this.loadAttempt(attemptId, user);
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('Attempt is not in progress.');
    }
    await attempt.update({ status: 'abandoned' });
    return { message: 'Attempt abandoned.' };
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async myHistory(user: User) {
    return QuizAttempt.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'subject', 'passingScore'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async attemptDetail(attemptId: number, user: User) {
    const attempt = await this.loadAttempt(attemptId, user);
    const answers = await QuizAttemptAnswer.findAll({
      where: { attemptId },
      include: [{ model: Question, as: 'question' }],
      order: [['answeredAt', 'ASC']],
    });
    return { attempt, answers };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async loadAttempt(id: number, user: User): Promise<QuizAttempt> {
    const attempt = await QuizAttempt.findByPk(id, {
      include: [{ model: Quiz, as: 'quiz' }],
    });
    if (!attempt) throw new NotFoundException('Attempt not found.');
    if (attempt.userId !== user.id && user.role?.name === 'student') {
      throw new ForbiddenException('Access denied.');
    }
    return attempt;
  }

  /**
   * Pick the next unanswered question closest to the current difficulty score.
   */
  private async pickNextQuestion(attempt: QuizAttempt): Promise<Question | null> {
    const answeredIds = (
      await QuizAttemptAnswer.findAll({
        where: { attemptId: attempt.id },
        attributes: ['questionId'],
      })
    ).map(a => a.questionId);

    const whereClause: any = {
      quizId: attempt.quizId,
      ...(answeredIds.length > 0 ? { id: { [Op.notIn]: answeredIds } } : {}),
    };

    // Get all remaining questions
    const remaining = await Question.findAll({
      where: whereClause,
      order: [['orderIndex', 'ASC']],
    });

    if (!remaining.length) return null;

    // For adaptive quizzes, pick the question with the closest difficultyScore
    const quiz = attempt.quiz;
    if (quiz?.isAdaptive) {
      const target = attempt.currentDifficultyScore;
      remaining.sort(
        (a, b) =>
          Math.abs(a.difficultyScore - target) - Math.abs(b.difficultyScore - target),
      );
    }

    return remaining[0];
  }

  private gradeAnswer(question: Question, givenAnswer: string): boolean {
    const correct = question.correctAnswer.trim().toLowerCase();
    const given = givenAnswer.trim().toLowerCase();

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return correct === given;
    }

    // Short answer: allow partial match with at least 80% similarity
    return correct === given || given.includes(correct) || correct.includes(given);
  }

  private serializeAttempt(attempt: QuizAttempt) {
    return {
      id: attempt.id,
      quizId: attempt.quizId,
      status: attempt.status,
      answeredQuestions: attempt.answeredQuestions,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      currentDifficulty: attempt.currentDifficulty,
      currentDifficultyScore: attempt.currentDifficultyScore,
      startedAt: attempt.startedAt,
      aiInsights: attempt.aiInsights,
      quiz: attempt.quiz ? {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        subject: attempt.quiz.subject,
        totalQuestions: attempt.quiz.totalQuestions,
        passingScore: attempt.quiz.passingScore,
      } : undefined,
    };
  }

  private serializeQuestion(q: Question) {
    return {
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      difficulty: q.difficulty,
      points: q.points,
      // NOTE: correctAnswer is intentionally omitted for students
    };
  }

  private async getCompletedResult(attempt: QuizAttempt) {
    const answers = await QuizAttemptAnswer.findAll({
      where: { attemptId: attempt.id },
      include: [{ model: Question, as: 'question' }],
      order: [['answeredAt', 'ASC']],
    });

    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        status: attempt.status,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt,
        aiInsights: attempt.aiInsights,
      },
      answers: answers.map(a => ({
        questionId: a.questionId,
        questionText: a.question?.text,
        userAnswer: a.userAnswer,
        correctAnswer: a.question?.correctAnswer,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        difficultyAtTime: a.difficultyAtTime,
        aiAdjustedNext: a.aiAdjustedNext,
      })),
    };
  }

  private async updateUserStats(
    user: User,
    percentage: number,
    summary: any,
  ) {
    const newTotal = user.totalQuizzesTaken + 1;
    const newAvg =
      (user.totalScore * user.totalQuizzesTaken + percentage) / newTotal;

    await user.update({
      totalQuizzesTaken: newTotal,
      totalScore: Math.round(newAvg * 100) / 100,
      performanceProfile: {
        avgScore: Math.round(newAvg * 100) / 100,
        strengths: summary.strengths || [],
        weaknesses: summary.weaknesses || [],
        preferredDifficulty: summary.recommendedDifficulty || 'medium',
      },
    });
  }
}
