import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Model {
  // 模型唯一id
  @PrimaryColumn()
  modelId: string;

  // 监督式 半监督式 ...
  @Column({ default: 'supervised' })
  modelType: string;

  // 模型使用的算法
  @Column({ default: 'decision_tree' })
  modelProgram: string;

  // 模型使用的框架
  @Column({ default: 'sklearn' })
  modelFramework: string;

  // 跑模型的过程
  @Column({ default: '' })
  modelTrainingLogUrl: string;

  // 跑模型生成的信息链接
  @Column({ default: '' })
  modelConfigUrl: string;

  // 模型图片链接
  @Column({ default: '' })
  modelPngUrl: string;

  // 模型pkl文件下载链接
  @Column({ default: '' })
  modelPklUrl: string;

  // 模型是否在训练中
  @Column({ default: true })
  modelTraining: boolean;

  @Column({ default: new Date().getTime(), type: 'bigint' })
  createdAt: number;

  // 程序对应的进程pid
  @Column({ default: null })
  pid: number;
}
