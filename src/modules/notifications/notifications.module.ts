import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { QuizSchedulerService } from './quiz-scheduler.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, QuizSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
