# QuizMinia — AI-Adaptive Learning Platform

A web-based quiz application that adapts question difficulty in real-time using AI, enhancing student engagement and learning efficiency.

Built with **NestJS 11**, **Sequelize 6 / MySQL**, and **AWS Bedrock (Google Gemma 3 4B)**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [AI Adaptive Engine](#ai-adaptive-engine)
- [Authentication & Security](#authentication--security)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Project Workflow](#project-workflow)

---

## Features

- **AI-Adaptive Quizzes** — question difficulty adjusts in real-time based on each student's performance using AWS Bedrock
- **Role-Based Access** — separate portals for students, teachers, and admins
- **Quiz Management** — teachers create quizzes with manual or AI-generated questions
- **Live Dashboards** — per-role analytics with progress charts, pass rates, and AI insights
- **Notifications & Email Alerts** — in-app alerts and branded HTML emails using **Nodemailer** for registration welcome, quiz results, and AI learning insights
- **Scheduled Quiz Reminders** — automated cron job scans upcoming quizzes and emails/notifies students 30 minutes before start time
- **Responsive UI** — dark-themed, mobile-first EJS views with Chart.js analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (TypeScript 5.7) |
| HTTP Server | Express 5 |
| ORM | Sequelize 6 + sequelize-typescript |
| Database | MySQL 8 |
| AI Engine | AWS Bedrock — `google.gemma-3-4b-it` |
| Auth | Cookie-based sessions (AES-256-CBC) |
| Password Hashing | PBKDF2 / SHA-512 |
| Logging | Winston + DailyRotateFile |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI (`/api/docs`) |
| Testing | Jest + ts-jest |
| Templating | EJS |

---

## Project Structure

```
src/
├── config/           # Logger configuration
├── decorators/       # @CurrentUser, @Public, @Roles
├── guards/           # AuthGuard, RolesGuard
├── middleware/       # RequestMiddleware (session/token)
├── models/           # Sequelize models
├── modules/
│   ├── ai/           # AiService — AWS Bedrock integration
│   ├── auth/         # Login, register, logout
│   ├── dashboard/    # Role-specific analytics
│   ├── notifications/# User notification management
│   ├── quiz-attempts/# Attempt lifecycle + adaptive engine
│   └── quizzes/      # Quiz and question CRUD
├── provider/         # Hash, TokenManager (global)
├── types/            # Express type augmentations
└── utility/          # Helpers, validation pipe, decorators

views/                # EJS templates (login, register, student, teacher)
migrations/           # Sequelize CLI migrations
seeders/              # Sample data seeders
```

---

## Database Design

### Entity Relationship Overview

```
Role (1) ──── (N) User
User (1) ──── (N) Token
User (1) ──── (N) Quiz          [as creator]
User (1) ──── (N) QuizAttempt
User (1) ──── (N) Notification
Quiz (1) ──── (N) Question
Quiz (1) ──── (N) QuizAttempt
QuizAttempt (1) ── (N) QuizAttemptAnswer
Question (1) ───── (N) QuizAttemptAnswer
```

### Key Tables

| Table | Purpose |
|---|---|
| `roles` | admin, teacher, student |
| `users` | Accounts with profile, quiz stats, and AI performance profile |
| `tokens` | Session tokens (AES-256 encrypted cookie → DB record) |
| `quizzes` | Quiz metadata, adaptive flag, passing score |
| `questions` | Questions with `difficultyScore` (0–1 float) for AI targeting |
| `quiz_attempts` | Per-attempt state including AI difficulty tracking |
| `quiz_attempt_answers` | Per-answer record with difficulty snapshot and AI adjustment flag |
| `notifications` | User notifications (quiz results, AI insights, new quizzes) |

All major tables use **soft deletes** (`deletedAt` column, `paranoid: true`).

---

## AI Adaptive Engine

### Overview

The adaptive engine adjusts question difficulty in real-time as a student answers questions. The goal is to keep each student in their optimal learning zone — not too easy, not too hard.

### Difficulty Representation

Difficulty is stored as a **float score from 0.0 to 1.0**:

| Range | Label |
|---|---|
| 0.00 – 0.35 | Easy |
| 0.36 – 0.65 | Medium |
| 0.66 – 1.00 | Hard |

Every `Question` has a `difficultyScore` set by the teacher (or AI-generated). Every `QuizAttempt` tracks a `currentDifficultyScore` that updates after each answer.

### Per-Answer Flow

When a student submits an answer (`POST /quiz-attempts/:id/answer`):

1. **Grade the answer** — exact match for MCQ/true-false; partial string match for short answer
2. **Update streaks** — `correctStreak` and `wrongStreak` are tracked in `aiInsights` JSON
3. **Call AWS Bedrock** — `AiService.getNextDifficulty()` sends the student's current score, streaks, and difficulty history to `google.gemma-3-4b-it` and receives a new target score + insight message
4. **Pick next question** — `pickNextQuestion()` sorts all unanswered questions by `|difficultyScore - currentDifficultyScore|` and returns the closest match
5. **Generate feedback** — `AiService.generateAnswerFeedback()` produces a 1–2 sentence explanation for the student

### Rule-Based Fallback

If AWS Bedrock is unavailable, a deterministic fallback engine runs instead:

| Condition | Adjustment |
|---|---|
| Correct streak ≥ 3 | +0.20 (harder) |
| Correct streak = 2 | +0.10 |
| Single correct answer | +0.05 |
| Wrong streak ≥ 3 | −0.20 (easier) |
| Wrong streak = 2 | −0.10 |
| Single wrong answer | −0.05 |

The score is always clamped to `[0.0, 1.0]`.

### End-of-Quiz Summary

When a student completes a quiz (`POST /quiz-attempts/:id/complete`):

1. `AiService.generatePerformanceSummary()` analyzes all answers, topic tags, and difficulty history
2. Bedrock returns: overall summary, strength topics, weakness topics, and recommended difficulty
3. The student's `performanceProfile` on the `User` record is updated
4. Two notifications are created: `quiz_result` (score + pass/fail) and `ai_insight` (weaknesses + strengths)

### AI Question Generation

Teachers can set `generateAiQuestions: true` when creating a quiz. Bedrock generates 5 multiple-choice questions with options, correct answers, explanations, and topic tags based on the quiz title, subject, and difficulty.

---

## Authentication & Security

### Session Mechanism

Every request passes through `RequestMiddleware`:

1. Reads the `auth` cookie
2. Decrypts it using **AES-256-CBC** (`APP_KEY` environment variable)
3. Looks up the `Token` record in the database
4. Attaches `req.token` (and a `req.session` helper) to the request
5. If no cookie exists, a new anonymous `Token` is created

On login/register, `Token.userId` is set to bind the session to the user. On logout, it is set back to `null`.

### Password Security

- Algorithm: **PBKDF2** with **SHA-512**
- Salt: 32 random bytes (per-user, stored with the hash)
- Iterations: 1,000
- Output: 64 bytes (512 bits)
- Comparison: **constant-time** (`Buffer.equals`) to prevent timing attacks

### Guards & Decorators

| Guard / Decorator | Purpose |
|---|---|
| `AuthGuard` | Verifies `token.userId` is set; loads full user with role |
| `RolesGuard` | Checks `user.role.name` against `@Roles(...)` metadata |
| `@Public()` | Marks a route as unauthenticated (bypasses `AuthGuard`) |
| `@Roles(...roles)` | Restricts a route to specific role names |
| `@CurrentUser()` | Injects the authenticated `User` model instance |

---

## API Reference

Interactive API documentation is available at **`/api/docs`** (Swagger UI) when running in development mode.

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with email + password |
| POST | `/auth/register` | Public | Register as student or teacher |
| POST | `/auth/logout` | Required | Clear session |
| GET | `/auth/me` | Required | Get current user |

### Quizzes — `/quizzes`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/quizzes` | Any | List quizzes (role-filtered) |
| GET | `/quizzes/:id` | Any | Get quiz detail |
| POST | `/quizzes` | teacher, admin | Create quiz (optional AI question generation) |
| PATCH | `/quizzes/:id` | teacher, admin | Update quiz |
| DELETE | `/quizzes/:id` | teacher, admin | Soft-delete quiz |
| POST | `/quizzes/:id/questions` | teacher, admin | Add question |
| PATCH | `/quizzes/questions/:id` | teacher, admin | Update question |
| DELETE | `/quizzes/questions/:id` | teacher, admin | Remove question |

### Quiz Attempts — `/quiz-attempts`

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/quiz-attempts/start` | student | Start or resume an attempt |
| GET | `/quiz-attempts/history` | Any | My attempt history |
| GET | `/quiz-attempts/:id` | Any | Current attempt state + next question |
| GET | `/quiz-attempts/:id/detail` | Any | Full attempt with all answers |
| POST | `/quiz-attempts/:id/answer` | student | Submit answer → AI grades + picks next question |
| POST | `/quiz-attempts/:id/complete` | student | Finalize, grade, AI summary, notifications |
| POST | `/quiz-attempts/:id/abandon` | student | Abandon attempt |

### Notifications — `/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Required | Last 50 notifications |
| GET | `/notifications/unread-count` | Required | Unread count |
| PATCH | `/notifications/read-all` | Required | Mark all as read |
| PATCH | `/notifications/:id/read` | Required | Mark one as read |

### Dashboard — `/dashboard`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/dashboard/student` | student | Progress, stats, AI profile |
| GET | `/dashboard/teacher` | teacher, admin | Quiz analytics, attempt counts |
| GET | `/dashboard/teacher-attempts` | teacher, admin | All student attempts |
| GET | `/dashboard/admin` | admin | System-wide overview |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8
- AWS account with Bedrock access (optional — rule-based fallback works without it)

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npx sequelize-cli db:migrate

# Seed sample data (roles, users, quizzes, questions)
npx sequelize-cli db:seed:all
```

### Development

```bash
npm run start:dev
```

The app starts on `http://localhost:3000`.
API docs are available at `http://localhost:3000/api/docs`.

### Production

```bash
npm run build
npm run start:prod
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Application
PORT=3000
NODE_ENV=development

# AES-256-CBC key for session token encryption (REQUIRED)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APP_KEY=your_64_char_hex_key_here

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=quizminia
DB_LOGGING=false

# AWS Bedrock (optional — app falls back to rule-based engine if not set)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Nodemailer / SMTP Settings
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=test
SMTP_PASSWORD=test
SMTP_FROM=no-reply@quizminia.com
SMTP_NAME=QuizMinia
```

> **Important:** `APP_KEY` must be exactly 64 hexadecimal characters (32 bytes). The app will refuse to start if this is missing or invalid.

---

## Running Tests

```bash
# Run all unit tests
npm run test

# Run with coverage report
npm run test:cov

# Run in watch mode during development
npm run test:watch

# Run E2E & integration tests (checks page routing, authentication rejection, AI fallback rules, and scheduler/nodemailer integration)
npm run test:e2e
```
```

### Test Coverage

| Module | Tests |
|---|---|
| `AiService` | scoreToLabel, rule-based adaptive engine, answer feedback, question generation |
| `AuthService` | login (valid/invalid), register (duplicate/missing role), logout, me |
| `QuizAttemptsService` | start, submitAnswer (correct/incorrect/duplicate), abandon, history |

---

## Project Workflow

### Student Flow

```
Register → Login → Browse Published Quizzes
  → Start Attempt → Answer Questions (AI adjusts difficulty each answer)
  → Complete Attempt → View Score + AI Summary
  → Check Dashboard (progress chart, strengths/weaknesses)
  → Check Notifications (result + AI insight)
```

### Teacher Flow

```
Register → Login → Create Quiz (manual or AI-generated questions)
  → Publish Quiz → Students attempt it
  → View Dashboard (per-quiz stats, student results)
  → Review AI insights per student attempt
```

### Adaptive Difficulty Lifecycle

```
Attempt starts at student's preferredDifficulty (from performanceProfile)
  ↓
Student answers question
  ↓
AiService.getNextDifficulty() → new difficultyScore
  ↓
pickNextQuestion() → closest unanswered question to new score
  ↓
Repeat until all questions answered
  ↓
AiService.generatePerformanceSummary() → update user.performanceProfile
```
