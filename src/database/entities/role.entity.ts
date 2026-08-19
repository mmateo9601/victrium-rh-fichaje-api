import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { RoleName } from './role-name.enum';

@Entity({ name: 'roles' })
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  rolNombre!: RoleName;
}
