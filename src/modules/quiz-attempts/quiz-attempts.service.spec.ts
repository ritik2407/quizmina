import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuizAttemptsService } from './quiz-attempts.service';
import { AiService } from 'src/modules/ai/ai.service';
import { Quiz } from 'src/models/Quiz.model';
import { Question } from 'src/models/Question.model';
import { QuizAttempt } from 'src/models/QuizAttempt.model';
import { QuizAttemptAnswer } from 'src/models/QuizAttemptAnswer.model';
import { User } from 'src/models/User.model';
import { Notification } from 'src/models/Notification.model';

/**
 * Unit tests for QuizAttemptsService
 *
 * All Sequelize model calls and AiService calls are mocked.
 */
describe('QuizAttemptsService', () => {
  let service: QuizAttemptsService;
  let aiService: AiService;

  // ─── Fixtures ────────────────────────────────────────────────────────────────

  const mockRole = { id: 3, name: 'student' };

  const mockUser = {
    id: 1,
    email: 'student@quizminia.com',
    firstName: 'John',
    lastName: 'Doe',
    role: mockRole,
    totalQuizzesTaken: 0,
    totalScore: 0,
    performanceProfile: { preferredDifficulty: 'medium' },
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as User;

  const mockQuestion = {
    id: 10,
    quizId: 5,
    text: 'What is 2+2?',
    type: 'multiple_choice',
    difficulty: 'easy',
    difficultyScore: 0.2,
    correctAnswer: 'B',
    points: 1,
    options: [
      { label: 'A', text: '3' },
      { label: 'B', text: '4' },
    ],
    explanation: 'Two plus two equals four.',
    tags: ['math'],
  } as unknown as Question;

  const mockQuiz = {
    id: 5,
    title: 'Math Quiz',
    subject: 'Mathematics',
    isPublished: true,
    isAdaptive: true,
    totalQuestions: 1,
    passingScore: 60,
    questions: [mockQuestion],
  } as unknown as Quiz;

  const mockAttempt = {
    id: 100,
    quizId: 5,
    userId: 1,
    status: 'in_progress',
    score: null,
    percentage: null,
    passed: null,
    currentDifficulty: 'medium',
    currentDifficultyScore: 0.5,
    totalQuestions: 1,
    answeredQuestions: 0,
    correctAnswers: 0,
    startedAt: new Date(),
    completedAt: null,
    timeTaken: null,
    aiInsights: {
      correctStreak: 0,
      wrongStreak: 0,
      difficultyHistory: [],
      performanceSummary: '',
    },
    quiz: mockQuiz,
    update: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn().mockResolvedValue(undefined),
  } as unknown as QuizAttempt;

  const mockAdaptiveResult = {
    nextDifficultyScore: 0.55,
    nextDifficultyLabel: 'medium' as const,
    aiAdjusted: false,
    insights: 'Slight difficulty increase.',
  };

  // ─── Setup ───────────────────────────────────────────────────────────────────

  beforeEach(() => {
    aiService = new AiService();
    service = new QuizAttemptsService(aiService);
    jest.clearAllMocks();

    // Default AI mocks
    jest.spyOn(aiService, 'getNextDifficulty').mockResolvedValue(mockAdaptiveResult);
    jest.spyOn(aiService, 'generateAnswerFeedback').mockResolvedValue('Great job!');
    jest.spyOn(aiService, 'generatePerformanceSummary').mockResolvedValue({
      summary: 'Good performance.',
      strengths: ['math'],
      weaknesses: [],
      recommendedDifficulty: 'medium',
      avgScore: 100,
    });
    jest.spyOn(aiService, 'scoreToLabel').mockImplementation((score: number) => {
      if (score <= 0.35) return 'easy';
      if (score <= 0.65) return 'medium';
      return 'hard';
    });
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── start ───────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('throws NotFoundException when quiz does not exist', async () => {
      jest.spyOn(Quiz, 'findByPk').mockResolvedValue(null);

      await expect(service.start({ quizId: 999 }, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when quiz is not published', async () => {
      jest.spyOn(Quiz, 'findByPk').mockResolvedValue({
        ...mockQuiz,
        isPublished: false,
      } as any);

      await expect(service.start({ quizId: 5 }, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when quiz has no questions', async () => {
      jest.spyOn(Quiz, 'findByPk').mockResolvedValue({
        ...mockQuiz,
        questions: [],
      } as any);

      await expect(service.start({ quizId: 5 }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('resumes an existing in-progress attempt', async () => {
      jest.spyOn(Quiz, 'findByPk').mockResolvedValue(mockQuiz);
      jest.spyOn(QuizAttempt, 'findOne').mockResolvedValue(mockAttempt);
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue(mockAttempt);
      jest.spyOn(QuizAttemptAnswer, 'findAll').mockResolvedValue([]);
      jest.spyOn(Question, 'findAll').mockResolvedValue([mockQuestion]);

      const result = await service.start({ quizId: 5 }, mockUser);

      expect(result).toHaveProperty('attempt');
      expect(QuizAttempt.findOne).toHaveBeenCalledTimes(1);
    });

    it('creates a new attempt when none is in progress', async () => {
      jest.spyOn(Quiz, 'findByPk').mockResolvedValue(mockQuiz);
      jest.spyOn(QuizAttempt, 'findOne').mockResolvedValue(null);
      jest.spyOn(QuizAttempt, 'create').mockResolvedValue(mockAttempt);
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue(mockAttempt);
      jest.spyOn(QuizAttemptAnswer, 'findAll').mockResolvedValue([]);
      jest.spyOn(Question, 'findAll').mockResolvedValue([mockQuestion]);

      const result = await service.start({ quizId: 5 }, mockUser);

      expect(QuizAttempt.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('attempt');
      expect(result).toHaveProperty('nextQuestion');
    });
  });

  // ─── submitAnswer ────────────────────────────────────────────────────────────

  describe('submitAnswer', () => {
    beforeEach(() => {
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue(mockAttempt);
      jest.spyOn(Question, 'findByPk').mockResolvedValue(mockQuestion);
      jest.spyOn(QuizAttemptAnswer, 'findOne').mockResolvedValue(null);
      jest.spyOn(QuizAttemptAnswer, 'create').mockResolvedValue({} as any);
      jest.spyOn(QuizAttemptAnswer, 'findAll').mockResolvedValue([]);
      jest.spyOn(Question, 'findAll').mockResolvedValue([]);
    });

    it('throws BadRequestException when attempt is already completed', async () => {
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
      } as any);

      await expect(
        service.submitAnswer(100, { questionId: 10, answer: 'B' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when question was already answered', async () => {
      jest.spyOn(QuizAttemptAnswer, 'findOne').mockResolvedValue({} as any);

      await expect(
        service.submitAnswer(100, { questionId: 10, answer: 'B' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('grades a correct answer and returns isCorrect: true', async () => {
      const result = await service.submitAnswer(
        100,
        { questionId: 10, answer: 'B' },
        mockUser,
      );

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(1);
    });

    it('grades an incorrect answer and returns isCorrect: false', async () => {
      const result = await service.submitAnswer(
        100,
        { questionId: 10, answer: 'A' },
        mockUser,
      );

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });

    it('calls AI service to compute next difficulty', async () => {
      await service.submitAnswer(100, { questionId: 10, answer: 'B' }, mockUser);

      expect(aiService.getNextDifficulty).toHaveBeenCalledTimes(1);
    });

    it('calls AI service to generate answer feedback', async () => {
      await service.submitAnswer(100, { questionId: 10, answer: 'B' }, mockUser);

      expect(aiService.generateAnswerFeedback).toHaveBeenCalledTimes(1);
    });

    it('returns difficultyAdjustment in the response', async () => {
      const result = await service.submitAnswer(
        100,
        { questionId: 10, answer: 'B' },
        mockUser,
      );

      expect(result).toHaveProperty('difficultyAdjustment');
      expect(result.difficultyAdjustment).toHaveProperty('next');
      expect(result.difficultyAdjustment).toHaveProperty('aiAdjusted');
    });

    it('does not expose correctAnswer in nextQuestion', async () => {
      jest.spyOn(Question, 'findAll').mockResolvedValue([mockQuestion]);

      const result = await service.submitAnswer(
        100,
        { questionId: 10, answer: 'B' },
        mockUser,
      );

      if (result.nextQuestion) {
        expect(result.nextQuestion).not.toHaveProperty('correctAnswer');
      }
    });
  });

  // ─── abandon ─────────────────────────────────────────────────────────────────

  describe('abandon', () => {
    it('marks the attempt as abandoned', async () => {
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue(mockAttempt);

      const result = await service.abandon(100, mockUser);

      expect(mockAttempt.update).toHaveBeenCalledWith({ status: 'abandoned' });
      expect(result).toHaveProperty('message');
    });

    it('throws BadRequestException when attempt is not in progress', async () => {
      jest.spyOn(QuizAttempt, 'findByPk').mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
      } as any);

      await expect(service.abandon(100, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── myHistory ───────────────────────────────────────────────────────────────

  describe('myHistory', () => {
    it('returns all attempts for the current user', async () => {
      jest.spyOn(QuizAttempt, 'findAll').mockResolvedValue([mockAttempt]);

      const result = await service.myHistory(mockUser);

      expect(result).toHaveLength(1);
      expect(QuizAttempt.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        }),
      );
    });
  });
});
