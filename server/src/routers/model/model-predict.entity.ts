import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ModelPredict {
  @PrimaryColumn()
  issueId: string;

  @Column()
  modelId: string;

  @Column()
  isGoodForFreshman: boolean;

  @Column({ default: new Date().getTime(), type: 'bigint' })
  createdAt: number;
}
