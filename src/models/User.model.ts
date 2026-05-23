import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Token } from './Token.model';
import { Role } from './Role.model';

@Table({ tableName: 'users', paranoid: true })
export class User extends Model {
  @Column({
    unique: true,
    allowNull: false,
    type: DataType.STRING(255),
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Column({
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  declare status: boolean;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare roleId: number;

  // ─── Profile ─────────────────────────────────────────────────────────────────

  @Column({ allowNull: true, type: DataType.STRING(100) })
  declare firstName: string | null;

  @Column({ allowNull: true, type: DataType.STRING(100) })
  declare lastName: string | null;

  @Column({ allowNull: true, type: DataType.STRING(500) })
  declare avatar: string | null;

  @Column({ allowNull: true, type: DataType.TEXT })
  declare bio: string | null;

  /** Student's grade/class level */
  @Column({ allowNull: true, type: DataType.STRING(50) })
  declare grade: string | null;

  /** Teacher's subject specialization */
  @Column({ allowNull: true, type: DataType.STRING(100) })
  declare subject: string | null;

  @Column({ allowNull: true, type: DataType.DATE })
  declare emailVerifiedAt: Date | null;

  // ─── Quiz analytics ───────────────────────────────────────────────────────────

  @Column({ defaultValue: 0, type: DataType.INTEGER })
  declare totalQuizzesTaken: number;

  @Column({ defaultValue: 0, type: DataType.FLOAT })
  declare totalScore: number;

  /**
   * AI-computed performance profile stored as JSON:
   * { avgScore, strengths[], weaknesses[], preferredDifficulty }
   */
  @Column({ allowNull: true, type: DataType.JSON })
  declare performanceProfile: Record<string, any> | null;

  // ─── Associations ────────────────────────────────────────────────────────────

  @BelongsTo(() => Role, { foreignKey: 'roleId', targetKey: 'id' })
  declare role: Role;

  @HasMany(() => Token, { foreignKey: 'userId' })
  declare tokens: Token[];

  // ─── Hooks ───────────────────────────────────────────────────────────────────

  @BeforeCreate
  static beforeCreateHook(instance: User) {
    instance.email = instance.email.toLowerCase();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: User) {
    instance.email = instance.email.toLowerCase();
  }
}
