import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: false, unique: true })
  userId: string;
  @Column({ nullable: false, unique: true })
  nickName: string;
  @Column({ nullable: false })
  password: string;
  @Column({ default: '[]' })
  favor: string;
  @Column('bigint')
  created: number;
  @Column('bigint')
  updated: number;
}
