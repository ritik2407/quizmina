import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Quiz } from 'src/models/Quiz.model';
import { Question } from 'src/models/Question.model';
import { User } from 'src/models/User.model';
import { Role } from 'src/models/Role.model';
import { Notification } from 'src/models/Notification.model';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { Op } from 'sequelize';
import { AiService } from '../ai/ai.service';

@Injectable()
export class QuizzesService {
  constructor(private readonly aiService: AiService) {}

  // ─── Quiz CRUD ────────────────────────────────────────────────────────────────

  async findAll(user: User, query: { subject?: string; difficulty?: string; search?: string }) {
    const where: any = {};

    // Students only see published quizzes; teachers see their own
    if (user.role?.name === 'student') {
      where.isPublished = true;
    } else if (user.role?.name === 'teacher') {
      where.createdByUserId = user.id;
    }

    if (query.subject) where.subject = query.subject;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.search) {
      where[Op.or as any] = [
        { title: { [Op.like]: `%${query.search}%` } },
        { subject: { [Op.like]: `%${query.search}%` } },
      ];
    }

    return Quiz.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number, user: User) {
    const quiz = await Quiz.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: Question,
          as: 'questions',
          order: [['orderIndex', 'ASC']],
        },
      ],
    });

    if (!quiz) throw new NotFoundException('Quiz not found.');

    // Students can only view published quizzes
    if (user.role?.name === 'student' && !quiz.isPublished) {
      throw new ForbiddenException('This quiz is not available yet.');
    }

    // Hide correct answers from students in question listing
    if (user.role?.name === 'student') {
      const safeQuestions = quiz.questions?.map(q => {
        const { correctAnswer, ...rest } = q.toJSON() as any;
        return rest;
      });
      return { ...quiz.toJSON(), questions: safeQuestions };
    }

    return quiz;
  }

  async create(dto: CreateQuizDto, user: User) {
    const quiz = await Quiz.create({
      title: dto.title,
      description: dto.description ?? null,
      subject: dto.subject ?? null,
      difficulty: dto.difficulty ?? 'medium',
      timeLimit: dto.timeLimit ?? null,
      passingScore: dto.passingScore ?? 60,
      isAdaptive: dto.isAdaptive ?? true,
      isPublished: false,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      createdByUserId: user.id,
      totalQuestions: 0,
    });

    if (dto.generateAiQuestions) {
      const generated = await this.aiService.generateQuestionsForQuiz({
        title: dto.title,
        description: dto.description ?? null,
        subject: dto.subject ?? null,
        difficulty: dto.difficulty ?? 'medium',
        count: 5,
        questionType: dto.aiQuestionType,
      });

      let orderIdx = 1;
      for (const item of generated) {
        const qType = item.type || dto.aiQuestionType || 'multiple_choice';
        let mappedType: 'multiple_choice' | 'true_false' | 'short_answer' = 'multiple_choice';
        if (qType === 'true_false' || qType === 'tf') {
          mappedType = 'true_false';
        } else if (qType === 'short_answer' || qType === 'sa') {
          mappedType = 'short_answer';
        }

        let finalOptions = null;
        let finalCorrectAnswer = 'A';

        if (mappedType === 'multiple_choice' || mappedType === 'true_false') {
          const rawOptions = Array.isArray(item.options) ? item.options : (mappedType === 'true_false' ? ['A) True', 'B) False'] : ['Option A', 'Option B', 'Option C', 'Option D']);
          finalOptions = rawOptions.map((opt: string, index: number) => {
            const letter = ['A', 'B', 'C', 'D'][index] || 'A';
            const text = opt.replace(/^[A-D]\)\s*/i, '');
            return { label: letter, text };
          });

          let correctLetter = String(item.correctAnswer || 'A').toUpperCase().trim();
          if (correctLetter.length > 1) {
            const matchedIdx = rawOptions.findIndex((opt: string) => opt.toLowerCase().includes(correctLetter.toLowerCase()));
            if (matchedIdx !== -1) {
              correctLetter = ['A', 'B', 'C', 'D'][matchedIdx];
            } else {
              correctLetter = 'A';
            }
          }
          finalCorrectAnswer = correctLetter;
        } else {
          // short_answer
          finalOptions = null;
          finalCorrectAnswer = String(item.correctAnswer || 'Answer').trim();
        }

        const difficultyScore = item.difficultyScore ?? (item.difficulty === 'easy' ? 0.2 : item.difficulty === 'hard' ? 0.8 : 0.5);

        await Question.create({
          quizId: quiz.id,
          text: item.text || 'Sample Question',
          type: mappedType,
          difficulty: item.difficulty || 'medium',
          difficultyScore,
          options: finalOptions,
          correctAnswer: finalCorrectAnswer,
          explanation: item.explanation || null,
          points: item.points || 1,
          orderIndex: orderIdx++,
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',') : null),
          aiGenerated: true,
        });
      }

      await quiz.update({ totalQuestions: generated.length });
    }

    return quiz;
  }

  async update(id: number, dto: UpdateQuizDto, user: User) {
    const quiz = await this.findOwnedQuiz(id, user);

    await quiz.update({
      title: dto.title ?? quiz.title,
      description: dto.description ?? quiz.description,
      subject: dto.subject ?? quiz.subject,
      difficulty: dto.difficulty ?? quiz.difficulty,
      timeLimit: dto.timeLimit ?? quiz.timeLimit,
      passingScore: dto.passingScore ?? quiz.passingScore,
      isAdaptive: dto.isAdaptive ?? quiz.isAdaptive,
      isPublished: dto.isPublished ?? quiz.isPublished,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : quiz.scheduledAt,
    });

    // Notify students when a quiz is published
    if (dto.isPublished && !quiz.isPublished) {
      await this.notifyPublished(quiz);
    }

    return quiz.reload({ include: [{ model: Question, as: 'questions' }] });
  }

  async remove(id: number, user: User) {
    const quiz = await this.findOwnedQuiz(id, user);
    await quiz.destroy();
    return { message: 'Quiz deleted successfully.' };
  }

  // ─── Questions ────────────────────────────────────────────────────────────────

  async addQuestion(quizId: number, dto: CreateQuestionDto, user: User) {
    const quiz = await this.findOwnedQuiz(quizId, user);

    // Infer difficultyScore from label if not provided
    const difficultyScore =
      dto.difficultyScore ??
      (dto.difficulty === 'easy' ? 0.2 : dto.difficulty === 'hard' ? 0.8 : 0.5);

    const question = await Question.create({
      quizId: quiz.id,
      text: dto.text,
      type: dto.type ?? 'multiple_choice',
      difficulty: dto.difficulty ?? 'medium',
      difficultyScore,
      options: dto.options ?? null,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation ?? null,
      points: dto.points ?? 1,
      orderIndex: dto.orderIndex ?? (quiz.totalQuestions + 1),
      tags: dto.tags ?? null,
      aiGenerated: false,
    });

    // Update totalQuestions count
    await quiz.update({ totalQuestions: quiz.totalQuestions + 1 });

    return question;
  }

  async updateQuestion(questionId: number, dto: UpdateQuestionDto, user: User) {
    const question = await Question.findByPk(questionId, {
      include: [{ model: Quiz, as: 'quiz' }],
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (question.quiz.createdByUserId !== user.id) {
      throw new ForbiddenException('You do not own this question.');
    }

    const difficultyScore =
      dto.difficultyScore ??
      (dto.difficulty === 'easy' ? 0.2 : dto.difficulty === 'hard' ? 0.8 : question.difficultyScore);

    await question.update({
      text: dto.text ?? question.text,
      type: dto.type ?? question.type,
      difficulty: dto.difficulty ?? question.difficulty,
      difficultyScore,
      options: dto.options ?? question.options,
      correctAnswer: dto.correctAnswer ?? question.correctAnswer,
      explanation: dto.explanation ?? question.explanation,
      points: dto.points ?? question.points,
      orderIndex: dto.orderIndex ?? question.orderIndex,
      tags: dto.tags ?? question.tags,
    });

    return question;
  }

  async removeQuestion(questionId: number, user: User) {
    const question = await Question.findByPk(questionId, {
      include: [{ model: Quiz, as: 'quiz' }],
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (question.quiz.createdByUserId !== user.id) {
      throw new ForbiddenException('You do not own this question.');
    }

    await question.destroy();
    await question.quiz.update({
      totalQuestions: Math.max(0, question.quiz.totalQuestions - 1),
    });

    return { message: 'Question removed.' };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async findOwnedQuiz(id: number, user: User): Promise<Quiz> {
    const quiz = await Quiz.findByPk(id);
    if (!quiz) throw new NotFoundException('Quiz not found.');
    if (user.role?.name !== 'admin' && quiz.createdByUserId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this quiz.');
    }
    return quiz;
  }

  /**
   * Fan-out a "quiz published" notification to all students.
   *
   * Queries every active student user and creates a notification record for
   * each one so they know a new quiz is available.  The operation is
   * fire-and-forget from the caller's perspective — errors are logged but
   * do not bubble up and fail the publish request.
   */
  private async notifyPublished(quiz: Quiz) {
    try {
      const studentRole = await Role.findOne({ where: { name: 'student' } });
      if (!studentRole) return;

      const students = await User.findAll({
        where: { roleId: studentRole.id, status: true },
        attributes: ['id'],
      });

      if (!students.length) return;

      await Promise.all(
        students.map((student) =>
          Notification.create({
            userId: student.id,
            type: 'quiz_scheduled',
            title: `New Quiz Available: ${quiz.title}`,
            message: `A new quiz "${quiz.title}"${quiz.subject ? ` on ${quiz.subject}` : ''} has just been published. Start it now and challenge yourself!`,
            data: {
              quizId: quiz.id,
              subject: quiz.subject,
              difficulty: quiz.difficulty,
              isAdaptive: quiz.isAdaptive,
            },
          }),
        ),
      );
    } catch (error) {
      // Non-critical: log and continue — the quiz is already published
      console.error(`[QuizzesService] Failed to fan-out publish notifications for quiz ${quiz.id}:`, error);
    }
  }
}
