import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { join } from 'path';
import { AppModule } from './../src/app.module';
import { MailService } from 'src/modules/mail/mail.service';
import { AiService } from 'src/modules/ai/ai.service';
import { QuizSchedulerService } from 'src/modules/notifications/quiz-scheduler.service';
import { AppValidationPipe } from './../src/utility/pips/validationFormatPips';
import { Quiz } from 'src/models/Quiz.model';
import { User } from 'src/models/User.model';
import { Role } from 'src/models/Role.model';

describe('QuizMinia Application (e2e & integration)', () => {
  let app: INestApplication<App>;
  let mailService: MailService;
  let aiService: AiService;
  let schedulerService: QuizSchedulerService;

  const mockMailService = {
    sendMail: jest.fn().mockResolvedValue(true),
    sendQuizReminder: jest.fn().mockResolvedValue(true),
    sendQuizResult: jest.fn().mockResolvedValue(true),
    sendWelcome: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    // Set view engine and global pipes to match main.ts runtime settings
    app.setBaseViewsDir(join(process.cwd(), 'views'));
    app.setViewEngine('ejs');
    app.useGlobalPipes(AppValidationPipe);

    await app.init();

    mailService = moduleFixture.get<MailService>(MailService);
    aiService = moduleFixture.get<AiService>(AiService);
    schedulerService = moduleFixture.get<QuizSchedulerService>(QuizSchedulerService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Page Routing (e2e)', () => {
    it('/ (GET) - redirects anonymous user to /login', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(302);
      expect(response.headers.location).toBe('/login');
    });

    it('/login (GET) - serves the login template page', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200);
      expect(response.text).toContain('<title>Login | QuizMinia</title>');
    });

    it('/register (GET) - serves the registration template page', async () => {
      const response = await request(app.getHttpServer())
        .get('/register')
        .expect(200);
      expect(response.text).toContain('<title>Register | QuizMinia</title>');
    });
  });

  describe('Auth Integration (e2e)', () => {
    it('rejects login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('rejects registration with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password@12345',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student'
        })
        .expect(400);
    });
  });

  describe('AI Service Logic (integration)', () => {
    it('falls back gracefully to rule-based difficulty when Bedrock call fails', async () => {
      // Force Bedrock invocation to throw an error by temporarily replacing client command execution
      const client = (aiService as any).client;
      const originalSend = client.send;
      client.send = jest.fn().mockRejectedValue(new Error('Network Timeout'));

      try {
        const result = await aiService.getNextDifficulty({
          currentScore: 0.5,
          isCorrect: true,
          correctStreak: 2,
          wrongStreak: 0,
          difficultyHistory: [0.5],
          totalCorrect: 2,
          totalAnswered: 2,
        });

        expect(result).toBeDefined();
        expect(result.nextDifficultyScore).toBeGreaterThan(0.5); // increased difficulty on correct streak
        expect(result.aiAdjusted).toBe(false); // falls back to local rules
        expect(result.insights).toBe('Good progress! Slightly increasing difficulty.');
      } finally {
        // Restore client send
        client.send = originalSend;
      }
    });

    it('determines easy difficulty label correctly from low score', () => {
      const label = aiService.scoreToLabel(0.2);
      expect(label).toBe('easy');
    });

    it('determines hard difficulty label correctly from high score', () => {
      const label = aiService.scoreToLabel(0.85);
      expect(label).toBe('hard');
    });
  });

  describe('Scheduler & Nodemailer Notifications (integration)', () => {
    it('runs scheduled reminder check and triggers Nodemailer email notifications', async () => {
      // Clear mocks to start clean
      mockMailService.sendQuizReminder.mockClear();

      // Find an active student for reference in db
      const studentRole = await Role.findOne({ where: { name: 'student' } });
      const student = await User.findOne({
        where: { roleId: studentRole?.id, status: true },
      });

      if (!student) {
        // Skip assertion if DB isn't seeded/running
        return;
      }

      // Create a quiz scheduled 32 minutes from now (falls into the 30-35 mins window)
      const scheduledTime = new Date(Date.now() + 32 * 60 * 1000);
      const tempQuiz = await Quiz.create({
        title: 'E2E Scheduled Physics Quiz',
        subject: 'Physics',
        difficulty: 'medium',
        isAdaptive: true,
        isPublished: true,
        scheduledAt: scheduledTime,
        createdByUserId: 1, // teacher/admin id
      });

      try {
        // Run scheduler job manually
        await schedulerService.sendScheduledReminders();

        // Verify it dispatched notifications and calls nodemailer wrapper
        expect(mockMailService.sendQuizReminder).toHaveBeenCalled();
      } finally {
        // Clean up created quiz
        await tempQuiz.destroy({ force: true });
      }
    });
  });
});
