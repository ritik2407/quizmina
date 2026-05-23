import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './User.model';

export type NotificationType =
  | 'quiz_scheduled'
  | 'quiz_result'
  | 'quiz_reminder'
  | 'ai_insight'
  | 'achievement'
  | 'general';

@Table({ tableName: 'notifications', paranoid: true })
export class Notification extends Model {
  @Column({ allowNull: false, type: DataType.INTEGER })
  declare userId: number;

  @Column({
    allowNull: true,
    defaultValue: 'general',
    type: DataType.ENUM(
      'quiz_scheduled',
      'quiz_result',
      'quiz_reminder',
      'ai_insight',
      'achievement',
      'general',
    ),
  })
  declare type: NotificationType;

  @Column({ allowNull: false, type: DataType.STRING(255) })
  declare title: string;

  @Column({ allowNull: false, type: DataType.TEXT })
  declare message: string;

  /** Extra payload: quizId, attemptId, score, insight text, etc. */
  @Column({ allowNull: true, type: DataType.JSON })
  declare data: Record<string, any> | null;

  @Column({ defaultValue: false, allowNull: true, type: DataType.BOOLEAN })
  declare isRead: boolean;

  @Column({ allowNull: true, type: DataType.DATE })
  declare readAt: Date | null;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: 'userId' })
  declare user: User;
}
