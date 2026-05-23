import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
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
  ApiNotFoundResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';

const reflector = new Reflector();

@ApiTags('Admin')
@ApiCookieAuth('auth')
@Controller('admin')
@UseGuards(new AuthGuard(reflector), new RolesGuard(reflector))
@Roles('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  /** GET /admin/users */
  @Get('users')
  @ApiOperation({ summary: 'List all users with optional filters (admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'teacher', 'student'] })
  @ApiQuery({ name: 'status', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated list of users' })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listUsers({ role, status, search, page, limit });
  }

  /** GET /admin/users/:id */
  @Get('users/:id')
  @ApiOperation({ summary: 'Get a single user by ID (admin only)' })
  @ApiOkResponse({ description: 'User object (password excluded)' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUser(id);
  }

  /** GET /admin/users/:id/stats */
  @Get('users/:id/stats')
  @ApiOperation({ summary: 'Get a user\'s quiz stats and recent attempts (admin only)' })
  @ApiOkResponse({ description: 'User with stats object' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUserStats(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUserStats(id);
  }

  /** PATCH /admin/users/:id/toggle-status */
  @Patch('users/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate a user account (admin only)' })
  @ApiOkResponse({ description: 'Status toggled' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Cannot modify another admin or own account' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.toggleStatus(id, user);
  }

  /** DELETE /admin/users/:id */
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a user account (admin only)' })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Cannot delete another admin or own account' })
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.deleteUser(id, user);
  }
}
