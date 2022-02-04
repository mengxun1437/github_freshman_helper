import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issue/issue.entity';
import { IssueModel } from './issue-model.entity';
import { formatGithubApi, randomRequest } from '../../common/index';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class IssueModelService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueModel)
    private readonly issueModelRepository: Repository<IssueModel>,
  ) {}

  // 通过issueId获取模型需要数据
  async getModelNeedDataByIssueId(issueId: number) {
    const issue = await this.issueRepository.findOne({
      issueId,
    });
    if (!issue) return {};
    const issueModel: any = {};
    issueModel.issueId = issueId;
    const issueApiUrl = formatGithubApi(issue.issueApiUrl);
    const issueInfo = (await randomRequest(issueApiUrl)) || {};
    issueModel.titleLength = issueInfo?.title?.length || 0;
    issueModel.bodyLength = issueInfo?.body?.length || 0;
    issueModel.commentsNum = issueInfo?.comments || 0;
    issueModel.assigneesNum = issueInfo?.assignees?.length || 0;
    issueModel.isLinkedPr = issueInfo?.pull_request !== undefined;

    const commentsInfo = (await randomRequest(issueInfo?.comments_url)) || [];
    issueModel.commentsTotalLength = commentsInfo?.reduce(
      (pre, cur) => pre + (cur?.body?.length || 0),
      0,
    );

    const creatorInfo = (await randomRequest(issueInfo?.user?.url)) || {};
    issueModel.creatorCreated = new Date(
      creatorInfo?.created_at || new Date(),
    ).getTime();
    issueModel.creatorFollowers = creatorInfo?.followers || 0;

    const eventsInfo = (await randomRequest(issueInfo?.events_url)) || [];
    const participantsSet = new Set();
    eventsInfo.forEach((event) => {
      if (event?.actor?.id) {
        participantsSet.add(event?.actor?.id);
      }
    });
    issueModel.participantsNum = participantsSet.size;

    const repoInfo = (await randomRequest(issueInfo?.repository_url)) || {};
    issueModel.starNum = repoInfo?.stargazers_count || 0;
    issueModel.openIssuesNum = repoInfo?.open_issues_count || 0;
    issueModel.hasOrganization = repoInfo?.organization?.id !== undefined;

    return issueModel;
  }

  async updateModel(issueModel: any) {
    await this.issueModelRepository.save({
      ...issueModel,
      updateAt: new Date().getTime(),
    })
    await this.issueRepository.save({
      issueId: issueModel?.issueId,
      isGoodTag: issueModel?.isGoodForFreshman,
    });
  }

  // 获取issue model分页
  async getIssueModelsPaginate(
    options: IPaginationOptions,
    where = {},
  ): Promise<Pagination<IssueModel>> {
    let queryBuilder = this.issueModelRepository
      .createQueryBuilder()
      .where(where);
    queryBuilder.orderBy('updateAt', 'DESC');
    return paginate<IssueModel>(queryBuilder, options);
  }

  // 获取基本信息
  async getIssueModelsBasicInfo() {
    const totalIssueModelsNum = await this.issueModelRepository.count();
    const goodTagsNum = await this.issueModelRepository.count({
      isGoodForFreshman: true,
    });
    const badTagsNum = await this.issueModelRepository.count({
      isGoodForFreshman: false,
    });
    return {
      totalIssueModelsNum,
      goodTagsNum,
      badTagsNum
    };
  }

}
