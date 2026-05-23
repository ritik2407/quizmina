import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
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
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

const reflector = new Reflector();

@ApiTags('Dashboard')
@ApiCookieAuth('auth')
@Controller('dashboard')
@UseGuards(new AuthGuard(reflector), new RolesGuard(reflector))
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /** GET /dashboard/student — student progress & analytics */
  @Get('student')
  @Roles('student')
  @ApiOperation({ summary: 'Student dashboard: progress stats, AI profile, difficulty breakdown' })
  @ApiOkResponse({ description: 'Student analytics object' })
  @ApiForbiddenResponse({ description: 'Requires student role' })
  studentDashboard(@CurrentUser() user: User) {
    return this.service.studentDashboard(user);
  }

  /** GET /dashboard/teacher — teacher analytics */
  @Get('teacher')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Teacher dashboard: per-quiz stats, attempt counts, pass rates' })
  @ApiOkResponse({ description: 'Teacher analytics object' })
  @ApiForbiddenResponse({ description: 'Requires teacher or admin role' })
  teacherDashboard(@CurrentUser() user: User) {
    return this.service.teacherDashboard(user);
  }

  /** GET /dashboard/teacher-attempts — list of attempts for teacher's quizzes */
  @Get('teacher-attempts')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'All completed student attempts for the teacher\'s quizzes' })
  @ApiOkResponse({ description: 'Array of completed attempts with user and quiz info' })
  teacherAttempts(@CurrentUser() user: User) {
    return this.service.teacherAttempts(user);
  }

  /** GET /dashboard/admin — system-wide overview */
  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin dashboard: system-wide totals, role breakdown, recent attempts' })
  @ApiOkResponse({ description: 'Admin analytics object' })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  adminDashboard() {
    return this.service.adminDashboard();
  }
}
