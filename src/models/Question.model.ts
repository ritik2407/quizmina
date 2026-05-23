import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Quiz } from './Quiz.model';
import { QuizAttemptAnswer } from './QuizAttemptAnswer.model';

export interface QuestionOption {
  label: string;
  text: string;
}

@Table({ tableName: 'questions', paranoid: true })
export class Question extends Model {
  @Column({ allowNull: false, type: DataType.INTEGER })
  declare quizId: number;

  @Column({ allowNull: false, type: DataType.TEXT })
  declare text: string;

  @Column({
    type: DataType.ENUM('multiple_choice', 'true_false', 'short_answer'),
    defaultValue: 'multiple_choice',
  })
  declare type: 'multiple_choice' | 'true_false' | 'short_answer';

  @Column({
    type: DataType.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium',
  })
  declare difficulty: 'easy' | 'medium' | 'hard';

  /**
   * Numeric difficulty score (0–1) used by the AI engine.
   * easy ≈ 0.2, medium ≈ 0.5, hard ≈ 0.8
   */
  @Column({ defaultValue: 0.5, type: DataType.FLOAT })
  declare difficultyScore: number;

  /** Array of { label, text } for multiple_choice / true_false */
  @Column({ allowNull: true, type: DataType.JSON })
  declare options: QuestionOption[] | null;

  @Column({ allowNull: false, type: DataType.TEXT })
  declare correctAnswer: string;

  /** AI-generated explanation shown after the student answers */
  @Column({ allowNull: true, type: DataType.TEXT })
  declare explanation: string | null;

  @Column({ defaultValue: 1, type: DataType.INTEGER })
  declare points: number;

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare orderIndex: number;

  @Column({ defaultValue: false, type: DataType.BOOLEAN })
  declare aiGenerated: boolean;

  /** Topic tags used by AI to group questions and identify weak areas */
  @Column({ allowNull: true, type: DataType.JSON })
  declare tags: string[] | null;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => Quiz, { foreignKey: 'quizId' })
  declare quiz: Quiz;

  @HasMany(() => QuizAttemptAnswer, { foreignKey: 'questionId' })
  declare answers: QuizAttemptAnswer[];
}
