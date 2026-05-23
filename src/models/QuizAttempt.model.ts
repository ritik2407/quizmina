import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Quiz } from './Quiz.model';
import { User } from './User.model';
import { QuizAttemptAnswer } from './QuizAttemptAnswer.model';

export interface AiInsights {
  correctStreak: number;
  wrongStreak: number;
  difficultyHistory: number[];   // numeric 0-1 scores
  performanceSummary?: string;
}

@Table({ tableName: 'quiz_attempts', paranoid: true })
export class QuizAttempt extends Model {
  @Column({ allowNull: false, type: DataType.INTEGER })
  declare quizId: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare userId: number;

  @Column({
    type: DataType.ENUM('in_progress', 'completed', 'abandoned'),
    defaultValue: 'in_progress',
  })
  declare status: 'in_progress' | 'completed' | 'abandoned';

  /** Raw score (points) */
  @Column({ allowNull: true, type: DataType.FLOAT })
  declare score: number | null;

  /** Percentage score (0–100) */
  @Column({ allowNull: true, type: DataType.FLOAT })
  declare percentage: number | null;

  @Column({ allowNull: true, type: DataType.BOOLEAN })
  declare passed: boolean | null;

  /** Current AI-adjusted difficulty level */
  @Column({
    type: DataType.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium',
  })
  declare currentDifficulty: 'easy' | 'medium' | 'hard';

  /** Numeric difficulty score 0–1 used by AI engine */
  @Column({ defaultValue: 0.5, type: DataType.FLOAT })
  declare currentDifficultyScore: number;

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare totalQuestions: number;

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare answeredQuestions: number;

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare correctAnswers: number;

  /**
   * AI context stored per-session:
   * { correctStreak, wrongStreak, difficultyHistory[], performanceSummary }
   */
  @Column({ allowNull: true, type: DataType.JSON })
  declare aiInsights: AiInsights | null;

  @Column({
    allowNull: true,
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare startedAt: Date | null;

  @Column({ allowNull: true, type: DataType.DATE })
  declare completedAt: Date | null;

  /** Total time taken in seconds */
  @Column({ allowNull: true, type: DataType.INTEGER })
  declare timeTaken: number | null;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => Quiz, { foreignKey: 'quizId' })
  declare quiz: Quiz;

  @BelongsTo(() => User, { foreignKey: 'userId' })
  declare user: User;

  @HasMany(() => QuizAttemptAnswer, { foreignKey: 'attemptId' })
  declare attemptAnswers: QuizAttemptAnswer[];
}
