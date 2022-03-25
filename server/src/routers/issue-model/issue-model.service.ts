import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issue/issue.entity';
import { IssueModel } from './issue-model.entity';
import {
  formatGithubApi,
  randomRequest,
  sleep,
  Logger,
} from '../../common/index';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { octokits } from '../../common/github';

@Injectable()
export class IssueModelService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueModel)
    private readonly issueModelRepository: Repository<IssueModel>,
  ) {}

  private authIndex: number = 0;

  _getAuthIndex() {
    if (this.authIndex < octokits.length) {
      this.authIndex++;
      console.log(`use authIndex ${this.authIndex - 1}`);
      return this.authIndex - 1;
    } else {
      this.authIndex = 1;
      console.log(`use authIndex 0`);
      return 0;
    }
  }

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
    });
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
      badTagsNum,
    };
  }

  // 获取数据库中所有linkedPr，判断是否由新手解决
  // 获取issue创建之前，提交者在项目中的提交记录次数，若次数不超过2次，则认为是新手
  // 获取此次pr中所有提交者，如果存在某一条提交是新手提交，则认为此issue有利于新手解决
  async tagIssues() {
    const logger = new Logger({
      file: 'D:\\Project\\github_freshman_helper\\server\\src\\routers\\issue-model\\tag-issues.log',
      interval: 10000,
      useFile: true,
    });
    try {
      const totalIssues = await this.issueRepository.find({
        isGoodTag: null,
        issueLinkedPr: true,
        // issueId: 29319171,
      });
      for (let i = 0; i < totalIssues.length; i++) {
        setTimeout(async () => {
          try {
            const issue = totalIssues[i];
            const commitInfoUrl = `${
              JSON.parse(issue.issueLinkedPrInfo)?.url
            }/commits`;
            const commitList =
              (
                await octokits[this._getAuthIndex()].request(
                  `GET ${formatGithubApi(commitInfoUrl)}`,
                )
              )?.data || [];
            await sleep(1000);
            const owners = Array.from(
              new Set(
                commitList
                  .map((commit) => commit.commit?.committer?.name)
                  .filter(Boolean) as string[],
              ),
            );
            logger.log(
              `start ${i} issue...,total:${totalIssues.length},issueId:${issue?.issueId},owners:${owners}`,
            );
            const [owner, repo] = issue.issueRepo.split('/');
            let isGoodTag = false,
              dataLength = -1,
              _data = { issue, commitInfoUrl, owners, commits: [] };
            for (let j = 0; j < owners.length; j++) {
              const data = (
                await octokits[this._getAuthIndex()].request(
                  'GET /repos/{owner}/{repo}/commits',
                  {
                    owner,
                    repo,
                    author: owners[j],
                    per_page: 5,
                    until: issue?.issueCreated,
                  },
                )
              )?.data;
              await sleep(1000);
              logger.log(
                `owner:${owners[j]},commitList:${JSON.stringify(
                  data.map((d) => ({
                    committer: d?.commit?.committer?.name,
                    url: d?.url,
                    date: d?.commit?.committer?.date,
                  })),
                )}`,
              );
              if (data && Array.isArray(data)) {
                if (data?.length && data.length <= 2) {
                  isGoodTag = true;
                  dataLength = data.length;
                  break;
                }
              } else {
                logger.log(`end ${i} issue...,error:api-data error`);
              }
              _data.commits.push({ j: data });
            }
            await this.issueRepository.save({
              issueId: issue?.issueId,
              isGoodTag,
            });
            logger.log(
              `end ${i} issue...,isGoodTag:${isGoodTag},commit length:${dataLength}`,
            );

            // return _data;
          } catch (e) {
            logger.log(`end ${i} issue...,error:${e.message}`);
          }
        }, i * 2000);
      }
    } catch {}
  }
}
