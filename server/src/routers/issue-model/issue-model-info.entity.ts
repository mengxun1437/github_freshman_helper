import { Column, Entity, PrimaryColumn } from 'typeorm';

// 收集模型训练需要的数据集
/**
 * 从一下几个维度来收集数据
 * 1.问题本身的判断依据
 * 2.提问题的人的一些指标
 * 3.问题对应仓库的一些指标
 */
@Entity()
export class IssueModelInfo {
  @PrimaryColumn({ type: 'bigint' })
  issueId: number;

  // 是否适合新手解决
  @Column({ default: null })
  isGoodForFreshman: boolean;

  // 创建日期
  @Column({ default: new Date().getTime(), type: 'bigint' })
  createdAt: number;

  // 更新日期
  @Column({ default: new Date().getTime(), type: 'bigint' })
  updateAt: number;

  // 问题本身

  @Column({ type: 'text' })
  issueTitle: string;

  @Column({ type: 'text' })
  issueBody: string;

  // title长度
  @Column({ default: null })
  titleLength: number;

  // issue主体的长度
  @Column({ default: null })
  bodyLength: number;

  // 评论数
  @Column({ default: null })
  commentsNum: number;

  // 评论总长度
  @Column({ default: null })
  commentsTotalLength: number;

  // 参与人数
  @Column({ default: null })
  participantsNum: number;

  // 受让人 数目
  @Column({ default: null })
  assigneesNum: number;

  // 是否有链接的pr
  @Column({ default: null })
  isLinkedPr: boolean;

  // 提问题的人
  // 创建issue的人的github注册时间戳
  @Column({ type: 'bigint', nullable: true })
  creatorCreated: number;

  // 创建issue的人的跟随者
  @Column({ default: null })
  creatorFollowers: number;

  // 问题对应的仓库信息
  // 仓库的star数目
  @Column({ default: null })
  starNum: number;

  // open issues 的数目
  @Column({ default: null })
  openIssuesNum: number;

  // 仓库是否有组织
  @Column({ default: null })
  hasOrganization: boolean;
}
