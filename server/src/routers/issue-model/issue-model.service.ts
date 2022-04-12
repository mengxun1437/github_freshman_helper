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
  OctokitRequest,
} from '../../common/index';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { octokits } from '../../common/github';
import { chunk } from 'lodash';
import { Logger as WsLogger } from '@mengxun/ws-logger';
import { IssueModelInfo } from './issue-model-info.entity';
import { ModelService } from '../model/model.service';

@Injectable()
export class IssueModelService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueModel)
    private readonly issueModelRepository: Repository<IssueModel>,
    @InjectRepository(IssueModelInfo)
    private readonly issueModelInfoRepository: Repository<IssueModelInfo>,
    private readonly modelService: ModelService,
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
  async getModelNeedDataByIssueId({
    issueId,
    _issue = undefined,
    _octokitRequest = undefined,
  }) {
    const octokitRequest = _octokitRequest || new OctokitRequest({});
    const issue =
      _issue ||
      (await this.issueRepository.findOne({
        issueId,
      }));
    if (!issue) return {};
    const issueModel: any = {};
    issueModel.issueId = issueId;
    const issueApiUrl = formatGithubApi(issue.issueApiUrl);
    const issueInfo = (await octokitRequest.get(issueApiUrl)) || {};
    issueModel.titleLength = issueInfo?.title?.length || 0;
    issueModel.bodyLength = issueInfo?.body?.length || 0;
    issueModel.commentsNum = issueInfo?.comments || 0;
    issueModel.assigneesNum = issueInfo?.assignees?.length || 0;
    issueModel.isLinkedPr = issueInfo?.pull_request !== undefined;

    const commentsInfo =
      (await octokitRequest.get(issueInfo?.comments_url)) || [];
    issueModel.commentsTotalLength = commentsInfo?.reduce(
      (pre, cur) => pre + (cur?.body?.length || 0),
      0,
    );

    const creatorInfo = (await octokitRequest.get(issueInfo?.user?.url)) || {};
    issueModel.creatorCreated = new Date(
      creatorInfo?.created_at || new Date(),
    ).getTime();
    issueModel.creatorFollowers = creatorInfo?.followers || 0;

    const eventsInfo = (await octokitRequest.get(issueInfo?.events_url)) || [];
    const participantsSet = new Set();
    eventsInfo.forEach((event) => {
      if (event?.actor?.id) {
        participantsSet.add(event?.actor?.id);
      }
    });
    issueModel.participantsNum = participantsSet.size;

    const repoInfo =
      (await octokitRequest.get(issueInfo?.repository_url)) || {};
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
      file: 'C:\\MyProjects\\github_freshman_helper\\server\\src\\routers\\issue-model\\tag-issues.log',
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
    } catch {
    } finally {
      logger.clearInterval();
    }
  }

  // 批量生成标签
  async batchTags() {
    const logger = new Logger({
      file: 'C:\\MyProjects\\github_freshman_helper\\server\\src\\routers\\issue-model\\batch-tags.log',
      interval: 10000,
      useFile: true,
    });
    try {
      const octokitRequest = new OctokitRequest({ sleep: 500 });
      const issues = await this.issueRepository.query(
        `select * from issue where (issue.isGoodTag = 1 or issue.isGoodTag = 0) and issue.issueId not in (select issueId from issue_model)`,
      );
      logger.log(`find ${issues.length} unlabel records`);
      for (let i = 0; i < issues.length; i++) {
        try {
          const issue = issues[i];
          const issueModel = await this.getModelNeedDataByIssueId({
            issueId: issue?.issueId,
            _issue: issue,
            _octokitRequest: octokitRequest,
          });
          await this.issueModelRepository.save({
            ...issueModel,
            issueId: issue?.issueId,
            isGoodForFreshman: Boolean(issue?.isGoodTag),
            updateAt: new Date().getTime(),
          });
          logger.log(
            `end success: index:${i} issueId:${
              issue.issueId
            }, isGoodForFreshman: ${issue?.isGoodTag ? 'true' : 'false'}`,
          );
        } catch (e) {
          logger.log(`end error:${e.messge}`);
        }
      }
    } catch (e) {
      console.log(e.message);
    } finally {
      logger.clearInterval();
    }
  }

  // 批量预测
  async storeOpenModelInfo() {
    const logger = new WsLogger({
      interval: 1000,
      file: {
        path: 'C:\\MyProjects\\github_freshman_helper\\server\\src\\routers\\issue-model\\open-model-info.log',
      },
    });
    const octokitRequest = new OctokitRequest({ sleep: 50 });
    logger.log('getting data');
    const issues = await this.issueRepository.find({
      where: {
        isGoodTag: null,
        issueState: 'open',
      },
    });
    logger.log(`get ${issues.length} data`);
    // 每10秒otctikts.length组
    const _chunk = chunk(issues, octokits.length);
    for (let i = 0; i < _chunk.length; i++) {
      setTimeout(() => {
        const _curChunk = _chunk[i];
        logger.log(`current Size ${_curChunk.length}`);
        _curChunk.forEach(async (issue, index) => {
          logger.log(`${i} ${index} ${issue?.issueId}`);
          const issueModel = await this.getModelNeedDataByIssueId({
            issueId: issue?.issueId,
            _issue: issue,
            _octokitRequest: octokitRequest,
          });
          await this.issueModelInfoRepository.save(issueModel);
        });
      }, i * 10000);
    }
  }

  // 批量预测
  async startBatchPredict() {
    const logger = new WsLogger({
      interval: 1000,
      file: {
        path: 'C:\\MyProjects\\github_freshman_helper\\server\\src\\routers\\issue-model\\batch-predict.log',
      },
    });
    logger.log('getting data');
    const issues = await this.issueModelInfoRepository.find({
      where: {
        isGoodForFreshman: null,
      },
    });
    logger.log(`get ${issues.length} data`);
    // 每10秒otctikts.length组
    const _chunk = chunk(issues, 10);
    for (let i = 0; i < _chunk.length; i++) {
      setTimeout(() => {
        const _curChunk = _chunk[i];
        logger.log(`current Size ${_curChunk.length}`);
        _curChunk.forEach(async (issueModel, index) => {
          logger.log(`${i} ${index} ${issueModel?.issueId}`);
          await this.modelService.startPredict({
            issueId: issueModel.issueId,
            modelId: '54fd56bf-f435-407f-9f40-31a64aa2dd77',
            issueModelInfo: issueModel,
          });
        });
      }, i * 20000);
    }
  }
}
