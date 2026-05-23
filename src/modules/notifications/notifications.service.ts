import { Injectable } from '@nestjs/common';
import { Notification } from 'src/models/Notification.model';
import { User } from 'src/models/User.model';

@Injectable()
export class NotificationsService {
  async findAll(user: User) {
    return Notification.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  async unreadCount(user: User) {
    const count = await Notification.count({
      where: { userId: user.id, isRead: false },
    });
    return { unread: count };
  }

  async markRead(id: number, user: User) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id, userId: user.id } },
    );
    return { message: 'Notification marked as read.' };
  }

  async markAllRead(user: User) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: user.id, isRead: false } },
    );
    return { message: 'All notifications marked as read.' };
  }
}
