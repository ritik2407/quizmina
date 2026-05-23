import { BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from './User.model';

@Table({ tableName: 'roles' })
export class Role extends Model {
  @Column
  declare name: string;

  @HasMany(() => User, { foreignKey: 'roleId' })
  declare users: User[];
}
