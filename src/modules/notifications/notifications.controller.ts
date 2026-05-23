import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/models/User.model';
import { Reflector } from '@nestjs/core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiCookieAuth('auth')
@Controller('notifications')
@UseGuards(new AuthGuard(new Reflector()))
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** GET /notifications */
  @Get()
  @ApiOperation({ summary: 'Get the last 50 notifications for the current user' })
  @ApiOkResponse({ description: 'Array of notifications ordered by newest first' })
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  /** GET /notifications/unread-count */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread notifications' })
  @ApiOkResponse({ description: '{ unread: number }' })
  unreadCount(@CurrentUser() user: User) {
    return this.service.unreadCount(user);
  }

  /** PATCH /notifications/read-all */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'All notifications marked as read' })
  markAllRead(@CurrentUser() user: User) {
    return this.service.markAllRead(user);
  }

  /** PATCH /notifications/:id/read */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.markRead(id, user);
  }
}
