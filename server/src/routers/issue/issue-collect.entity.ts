import { Entity, Column, PrimaryColumn } from 'typeorm';
// issue数据持久化
@Entity()
export class IssueCollect {
  // created 日期
  @PrimaryColumn()
  createdDate: string;

  // 收集条数
  @Column({ default: 0 })
  collectNum: number;

  // 这天有的条数
  @Column({ default: 0 })
  hasNum: number;

  // 收集时间
  @Column()
  collectedTime: string;
}
