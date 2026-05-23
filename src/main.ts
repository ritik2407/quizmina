import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppValidationPipe } from './utility/pips/validationFormatPips';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from './config/logger.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

// ─── Startup Validation ───────────────────────────────────────────────────────

/**
 * Validate critical environment variables before the app starts.
 * Failing fast here prevents the app from running with insecure defaults.
 */
function validateEnv(): void {
  const appKey = process.env.APP_KEY;

  if (!appKey) {
    throw new Error(
      '[FATAL] APP_KEY environment variable is not set. ' +
      'Generate a 32-byte hex key and add it to your .env file: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  // AES-256-CBC requires exactly 32 bytes → 64 hex characters
  if (appKey.length !== 64) {
    throw new Error(
      `[FATAL] APP_KEY must be exactly 64 hex characters (32 bytes). ` +
      `Current length: ${appKey.length}. ` +
      'Generate a valid key: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  // Validate it is valid hex
  if (!/^[0-9a-fA-F]{64}$/.test(appKey)) {
    throw new Error(
      '[FATAL] APP_KEY must be a valid hexadecimal string (0-9, a-f).',
    );
  }
}

async function bootstrap() {
  // Validate env before anything else
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(createLoggerConfig()),
  });

  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('ejs');

  app.use(cookieParser());
  app.use(bodyParser.json({}));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.useGlobalPipes(AppValidationPipe);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const express = app.getHttpAdapter().getInstance();
  if (process.env.NODE_ENV === 'production') {
    express.set('view cache', true);
  }

  // ─── Swagger / OpenAPI ──────────────────────────────────────────────────────
  // Only expose API docs in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('QuizMinia API')
      .setDescription(
        'REST API for the QuizMinia AI-Adaptive Learning Platform.\n\n' +
        '**Authentication:** Cookie-based session. Call `POST /auth/login` first — ' +
        'the `auth` cookie is set automatically and sent with subsequent requests.',
      )
      .setVersion('1.0.0')
      .addTag('Auth', 'Login, register, logout, and current user')
      .addTag('Quizzes', 'Quiz and question management')
      .addTag('Quiz Attempts', 'Attempt lifecycle and adaptive quiz engine')
      .addTag('Notifications', 'User notification management')
      .addTag('Dashboard', 'Role-specific analytics and progress tracking')
      .addTag('Admin', 'User management — admin only')
      .addCookieAuth('auth')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'QuizMinia API Docs',
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
