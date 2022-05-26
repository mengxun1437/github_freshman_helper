import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { IssuePredict } from './issue-predict.entity';
import { Issue } from '../issue/issue.entity';

@Injectable()
export class IssuePredictService {
  constructor(
    @InjectRepository(IssuePredict)
    private readonly issuePredictRepository: Repository<IssuePredict>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
  ) {}

  async updateIssuePredict(predict) {
    if (predict?.modelId) {
      await this.issuePredictRepository.save(predict);
    }
  }

  // 获取issue model分页
  async getIssueModelsPaginate(
    options: IPaginationOptions,
    where = {},
  ): Promise<Pagination<IssuePredict>> {
    let queryBuilder = this.issuePredictRepository
      .createQueryBuilder()
      .where(where);
    return paginate<IssuePredict>(queryBuilder, options);
  }

  // 结果应用
  async applyResult(modelId) {
    //   将不在issue_model中的数据清除
    await this.issueRepository.query(
      'update issue set isGoodTag = NULL where isGoodTag = 1 and issueId not in (select issueId from issue_model)',
    );
    // 将新的结果更新
    const predict = await this.issuePredictRepository.findOne(modelId)
    if(predict && predict.process === 100 && predict.goodIssueIds){
        await this.issueRepository.query(`update issue set isGoodTag = 1 where issueId in (${predict.goodIssueIds})`)
    }
  }
}
