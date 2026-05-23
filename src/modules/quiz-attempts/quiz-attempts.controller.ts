import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuizAttemptsService } from './quiz-attempts.service';
import { StartAttemptDto, SubmitAnswerDto } from './dto/attempt.dto';
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
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

const reflector = new Reflector();

@ApiTags('Quiz Attempts')
@ApiCookieAuth('auth')
@Controller('quiz-attempts')
@UseGuards(new AuthGuard(reflector), new RolesGuard(reflector))
export class QuizAttemptsController {
  constructor(private readonly service: QuizAttemptsService) {}

  /** POST /quiz-attempts/start — student starts a quiz */
  @Post('start')
  @Roles('student')
  @ApiOperation({ summary: 'Start a new quiz attempt (resumes if one is already in progress)' })
  @ApiCreatedResponse({ description: 'Attempt state with first question' })
  @ApiForbiddenResponse({ description: 'Quiz not published or requires student role' })
  @ApiNotFoundResponse({ description: 'Quiz not found' })
  start(@Body() dto: StartAttemptDto, @CurrentUser() user: User) {
    return this.service.start(dto, user);
  }

  /** GET /quiz-attempts/history — my attempt history */
  @Get('history')
  @ApiOperation({ summary: 'Get all quiz attempts for the current user' })
  @ApiOkResponse({ description: 'Array of attempts with quiz info' })
  myHistory(@CurrentUser() user: User) {
    return this.service.myHistory(user);
  }

  /** GET /quiz-attempts/:id — current attempt state */
  @Get(':id')
  @ApiOperation({ summary: 'Get current attempt state and next question' })
  @ApiOkResponse({ description: 'Attempt state + next question (null if complete)' })
  @ApiNotFoundResponse({ description: 'Attempt not found' })
  getAttemptState(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.getAttemptState(id, user);
  }

  /** GET /quiz-attempts/:id/detail — full attempt with answers */
  @Get(':id/detail')
  @ApiOperation({ summary: 'Get full attempt detail including all submitted answers' })
  @ApiOkResponse({ description: 'Attempt + answers array' })
  attemptDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.attemptDetail(id, user);
  }

  /** POST /quiz-attempts/:id/answer — submit one answer, get next question */
  @Post(':id/answer')
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit an answer. AI grades it, adjusts difficulty, and returns the next question.',
  })
  @ApiOkResponse({ description: 'Grade result, AI feedback, difficulty adjustment, and next question' })
  @ApiBadRequestResponse({ description: 'Attempt not in progress or question already answered' })
  submitAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.service.submitAnswer(id, dto, user);
  }

  /** POST /quiz-attempts/:id/complete — finish and grade the attempt */
  @Post(':id/complete')
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete the attempt. Triggers AI performance summary and notifications.' })
  @ApiOkResponse({ description: 'Final result with score, pass/fail, and AI summary' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.complete(id, user);
  }

  /** POST /quiz-attempts/:id/abandon */
  @Post(':id/abandon')
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abandon an in-progress attempt' })
  @ApiOkResponse({ description: 'Attempt marked as abandoned' })
  abandon(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.abandon(id, user);
  }
}
