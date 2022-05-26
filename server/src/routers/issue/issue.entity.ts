import { Entity, Column, PrimaryColumn } from 'typeorm';
// issue数据持久化
@Entity()
export class Issue {
  // issue id
  @PrimaryColumn({ type: 'bigint' })
  issueId: number;

  // issue的title
  @Column({type:"text",nullable:true})
  issueTitle:string

  @Column({type:'text',nullable:true})
  issueBody:string

  // issue的状态
  @Column()
  issueState: string;

  // issue 是否关联pr
  @Column({ default: false })
  issueLinkedPr: boolean;

  // 如果issue关联pr，pr的信息 JSON.stringify(pull_request)
  @Column({ type: 'text' })
  issueLinkedPrInfo: string;

  // issue的api_url
  @Column()
  issueApiUrl: string;

  // issue对应的github链接
  @Column()
  issueHtmlUrl: string;

  // issue下面的所有评论的api_url
  @Column()
  issueCommentsApiUrl: string;

  // issue创建的时间
  @Column()
  issueCreated: string;

  // issue更新的时间
  @Column()
  issueUpdated: string;

  // issue对应的仓库
  @Column()
  issueRepo: string;

  // 收集时间
  @Column()
  collectedTime: string;

  // 是否适合新手
  // Null 没有标签 0 不适合 1适合
  @Column({ default: null })
  isGoodTag: boolean;
}
