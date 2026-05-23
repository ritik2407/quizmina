import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './User.model';

@Table({ tableName: 'tokens', paranoid: true })
export class Token extends Model {
  @Column({ allowNull: false })
  declare token: string;

  @Column({ allowNull: true })
  declare userId: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare payload: JSON;

  @Column({ allowNull: true })
  declare timeZone: string;

  @Column({ allowNull: true })
  declare gmt: string;

  @BelongsTo(() => User, { foreignKey: 'userId', targetKey: 'id' })
  declare user: User;
}
