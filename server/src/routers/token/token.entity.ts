// 暂时用mysql实现token过程

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: false, unique: true })
  userId: string
  @Column({ nullable: false, unique: true })
  token: string;
  @Column('bigint')
  created: number;
  @Column('bigint')
  updated: number;
}
