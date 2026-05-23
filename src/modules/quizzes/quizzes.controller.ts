import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/models/User.model';
import { Reflector } from '@nestjs/core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';

const reflector = new Reflector();

@ApiTags('Quizzes')
@ApiCookieAuth('auth')
@Controller('quizzes')
@UseGuards(new AuthGuard(reflector), new RolesGuard(reflector))
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  /** GET /quizzes */
  @Get()
  @ApiOperation({ summary: 'List quizzes (students: published only; teachers: own quizzes)' })
  @ApiQuery({ name: 'subject', required: false })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ description: 'Array of quizzes' })
  findAll(
    @CurrentUser() user: User,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('search') search?: string,
  ) {
    return this.quizzesService.findAll(user, { subject, difficulty, search });
  }

  /** GET /quizzes/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single quiz with questions (correct answers hidden for students)' })
  @ApiOkResponse({ description: 'Quiz detail' })
  @ApiNotFoundResponse({ description: 'Quiz not found' })
  @ApiForbiddenResponse({ description: 'Quiz not published (student access)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.quizzesService.findOne(id, user);
  }

  /** POST /quizzes — teacher only */
  @Post()
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a new quiz. Set generateAiQuestions: true to auto-generate questions via AI.' })
  @ApiCreatedResponse({ description: 'Quiz created' })
  @ApiForbiddenResponse({ description: 'Requires teacher or admin role' })
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: User) {
    return this.quizzesService.create(dto, user);
  }

  /** PATCH /quizzes/:id — teacher/admin */
  @Patch(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update a quiz. Publishing triggers student notifications.' })
  @ApiOkResponse({ description: 'Updated quiz' })
  @ApiNotFoundResponse({ description: 'Quiz not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.update(id, dto, user);
  }

  /** DELETE /quizzes/:id — teacher/admin */
  @Delete(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Soft-delete a quiz' })
  @ApiOkResponse({ description: 'Quiz deleted' })
  @ApiNotFoundResponse({ description: 'Quiz not found' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.quizzesService.remove(id, user);
  }

  // ─── Questions ────────────────────────────────────────────────────────────────

  /** POST /quizzes/:id/questions */
  @Post(':id/questions')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Add a question to a quiz' })
  @ApiCreatedResponse({ description: 'Question created' })
  addQuestion(
    @Param('id', ParseIntPipe) quizId: number,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.addQuestion(quizId, dto, user);
  }

  /** PATCH /quizzes/questions/:questionId */
  @Patch('questions/:questionId')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update a question' })
  @ApiOkResponse({ description: 'Updated question' })
  updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.updateQuestion(questionId, dto, user);
  }

  /** DELETE /quizzes/questions/:questionId */
  @Delete('questions/:questionId')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Remove a question from a quiz' })
  @ApiOkResponse({ description: 'Question removed' })
  removeQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.removeQuestion(questionId, user);
  }
}
