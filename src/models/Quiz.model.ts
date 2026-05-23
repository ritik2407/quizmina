import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './User.model';
import { Question } from './Question.model';
import { QuizAttempt } from './QuizAttempt.model';

@Table({ tableName: 'quizzes', paranoid: true })
export class Quiz extends Model {
  @Column({ allowNull: false, type: DataType.STRING(255) })
  declare title: string;

  @Column({ allowNull: true, type: DataType.TEXT })
  declare description: string | null;

  @Column({ allowNull: true, type: DataType.STRING(100) })
  declare subject: string | null;

  @Column({
    type: DataType.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium',
  })
  declare difficulty: 'easy' | 'medium' | 'hard';

  /** Time limit in minutes; null = unlimited */
  @Column({ allowNull: true, type: DataType.INTEGER })
  declare timeLimit: number | null;

  @Column({ defaultValue: 60.0, type: DataType.FLOAT })
  declare passingScore: number;

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare totalQuestions: number;

  @Column({ defaultValue: false, type: DataType.BOOLEAN })
  declare isPublished: boolean;

  /** Enables AI real-time adaptive difficulty */
  @Column({ defaultValue: true, type: DataType.BOOLEAN })
  declare isAdaptive: boolean;

  @Column({ allowNull: true, type: DataType.DATE })
  declare scheduledAt: Date | null;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare createdByUserId: number;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: 'createdByUserId', as: 'creator' })
  declare creator: User;

  @HasMany(() => Question, { foreignKey: 'quizId' })
  declare questions: Question[];

  @HasMany(() => QuizAttempt, { foreignKey: 'quizId' })
  declare attempts: QuizAttempt[];
}
