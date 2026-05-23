import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { QuizAttempt } from './QuizAttempt.model';
import { Question } from './Question.model';

@Table({ tableName: 'quiz_attempt_answers' })
export class QuizAttemptAnswer extends Model {
  @Column({ allowNull: false, type: DataType.INTEGER })
  declare attemptId: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare questionId: number;

  /** Student's answer (label or text) */
  @Column({ allowNull: true, type: DataType.TEXT })
  declare userAnswer: string | null;

  @Column({ allowNull: true, type: DataType.BOOLEAN })
  declare isCorrect: boolean | null;

  @Column({ defaultValue: 0, type: DataType.FLOAT })
  declare pointsEarned: number;

  /** Seconds spent on this question */
  @Column({ allowNull: true, type: DataType.INTEGER })
  declare timeTaken: number | null;

  /**
   * Numeric difficulty score (0–1) of the question when it was served.
   * The AI engine uses this to decide the next question's difficulty.
   */
  @Column({ allowNull: true, type: DataType.FLOAT })
  declare difficultyAtTime: number | null;

  /** Whether AI adjusted difficulty after this answer */
  @Column({ defaultValue: false, type: DataType.BOOLEAN })
  declare aiAdjustedNext: boolean;

  @Column({ allowNull: true, type: DataType.DATE })
  declare answeredAt: Date | null;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => QuizAttempt, { foreignKey: 'attemptId' })
  declare attempt: QuizAttempt;

  @BelongsTo(() => Question, { foreignKey: 'questionId' })
  declare question: Question;
}
