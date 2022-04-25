import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { octokits } from '../../common/github';
import { In, Repository } from 'typeorm';
import { Issue } from './issue.entity';
import * as dayjs from 'dayjs';
import { IssueCollect } from './issue-collect.entity';
import * as lodash from 'lodash';
import { formatGithubApi, OctokitRequest } from '../../common/index';
import { IssueModel } from '../issue-model/issue-model.entity';
const { chunk } = lodash;
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { Logger as WsLogger } from '@mengxun/ws-logger';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueModel)
    private readonly issueModelRepository: Repository<IssueModel>,
    @InjectRepository(IssueCollect)
    private readonly issueCollectRepositiry: Repository<IssueCollect>,
  ) {
    this._initAuthMap();
  }

  private authMap: { [index: number]: number } = {};
  private dateQueue: string[] = [];
  private lockSourceNum: number = 0;

  // 获取一个没有打标签的issue
  async getAUnlabelIssueId() {
    const issue = await this.issueRepository.findOne({
      isGoodTag: null,
    });
    return issue?.issueId;
  }

  // 通过issueId获取具体内容
  async getIssueInfoByIssueId(issueId: number) {
    const issue = await this.issueRepository.findOne({
      issueId,
    });
    const issueModel = await this.issueModelRepository.findOne(issueId);
    return {
      issue,
      issueModel,
    };
  }

  // 获取基本信息
  async getIssuesBasicInfo() {
    const totalIssuesNum = await this.issueRepository.count();
    const openIssuesNum = await this.issueRepository.count({
      issueState: 'open',
    });
    const closeIssuesNum = await this.issueRepository.count({
      issueState: 'closed',
    });
    const linkedPrIssuesNum = await this.issueRepository.count({
      issueLinkedPr: true,
    });
    const reposNum =
      Number(
        (
          await this.issueRepository.query(
            'SELECT COUNT(DISTINCT issueRepo)  AS count FROM issue',
          )
        )?.[0]?.count,
      ) || 0;
    return {
      totalIssuesNum,
      openIssuesNum,
      closeIssuesNum,
      reposNum,
      linkedPrIssuesNum,
    };
  }

  // 获取issues分页
  async getIssuesPaginate(
    options: IPaginationOptions,
    where: any = {},
  ): Promise<Pagination<Issue>> {
    if (where.issueIds) {
      where.issueId = In(where.issueIds);
      delete where.issueIds;
    }
    let queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .where(where);
    queryBuilder.orderBy('issue.issueCreated', 'DESC');
    return paginate<Issue>(queryBuilder, options);
  }

  // 初始化请求资源
  _initAuthMap() {
    this.authMap = {};
    this.lockSourceNum = 0;
    octokits.forEach((_, index) => {
      this.authMap[index] = 30;
    });
  }

  getOctokit() {
    const authIndex = Object.keys(this.authMap).find(
      (key) => this.authMap[key] > 0,
    );
    if (authIndex !== undefined) {
      this.authMap[authIndex] -= 1;
      return {
        authIndex,
        octokit: octokits[authIndex],
      };
    }
    return {};
  }

  // 收集
  async _getIssues({
    date = '',
    pageNum = 1,
    perPage = 1,
  }: {
    date: string;
    pageNum?: number;
    perPage?: number;
  }): Promise<any> {
    try {
      const { octokit, authIndex } = this.getOctokit();
      console.log(`[${date}] using octokit authIndex:${authIndex}`);
      const resp = await octokit.request('GET /search/issues', {
        q: `created:${date} label:"good first issue"`,
        per_page: perPage,
        page: pageNum,
      });
      if (resp?.status === 200) {
        return resp?.data || {};
      }
      return {};
    } catch (e) {
      console.log(`[${date}] get api error:`, e.message);
      try {
        await this.issueCollectRepositiry.save(
          this._getIssueCollect({
            createdDate: date,
            hasNum: -1,
          }),
        );
      } catch (e) {
        console.log(`[${date}] save issue collect error:`, e.message);
      }
      return {};
    }
  }

  // 收集记录
  _getIssueCollect({
    createdDate,
    collectNum,
    hasNum,
  }: {
    createdDate: string;
    collectNum?: number;
    hasNum?: number;
  }) {
    const newIssueCollect = new IssueCollect();
    newIssueCollect.createdDate = createdDate;
    if (collectNum) {
      newIssueCollect.collectNum = collectNum;
    }
    if (hasNum) {
      newIssueCollect.hasNum = hasNum;
    }
    newIssueCollect.collectedTime = dayjs().format('YYYY-MM-DD');
    return newIssueCollect;
  }

  // 先收集当天的，如果当前的超过了1000条 -> 分成两个半天
  async _collectPerDate({ date }): Promise<any[]> {
    console.log(`[${date}] collecting date:${date}`);
    try {
      // 抛出试探性的数据，判断这次时间筛选是否超过1000，如果超出，暂不处理
      this.lockSourceNum++;
      const resp = await this._getIssues({ date });
      const data = [];
      if (resp?.total_count) {
        try {
          await this.issueCollectRepositiry.save(
            this._getIssueCollect({
              createdDate: date,
              hasNum: resp?.total_count || 0,
            }),
          );
        } catch (e) {
          console.log(`[${date}] save issue collect error:`, e.message);
        }
        if (resp?.total_count <= 1000) {
          const perPage = 100;
          const pageNums = Math.ceil(resp?.total_count / 100);
          this.lockSourceNum += pageNums;
          console.log(`[${date}] all:%d`, resp?.total_count);
          for (let i = 0; i < pageNums; i++) {
            try {
              const res = await this._getIssues({
                date,
                perPage,
                pageNum: i + 1,
              });
              data.push(...(res?.items || []));
            } catch (e) {
              console.log(`[${date}] get github api error:`, e.message);
            }
          }
        }
      }
      return data;
    } catch {
      return [];
    }
  }

  // 实例
  _getNewIssue(d) {
    const newIssue = new Issue();
    (newIssue.issueId = d?.id),
      (newIssue.issueTitle = d?.title),
      (newIssue.issueState = d?.state),
      (newIssue.issueLinkedPr = d?.pull_request !== undefined),
      (newIssue.issueLinkedPrInfo = JSON.stringify(d?.pull_request || {})),
      (newIssue.issueApiUrl = d?.url),
      (newIssue.issueHtmlUrl = d?.html_url),
      (newIssue.issueRepo = d?.html_url
        ?.slice(18)
        ?.match(/(?<=\/).*?\/.*?(?=\/)/g)?.[0]),
      (newIssue.issueCommentsApiUrl = d?.comments_url),
      (newIssue.issueCreated = d?.created_at),
      (newIssue.issueUpdated = d?.updated_at),
      (newIssue.collectedTime = dayjs().format('YYYY-MM-DD'));
    return newIssue;
  }

  // 获取issues
  async collectFirstIssues({ start, end }): Promise<any> {
    let curDate = dayjs(dayjs().format('YYYY-MM-DD'));
    const lastCollectedTime =
      (
        await this.issueRepository.query(
          'select max(createdDate) from issue_collect',
        )
      )?.[0]?.['max(createdDate)'] || start;
    let lastDate = dayjs(dayjs(lastCollectedTime).format('YYYY-MM-DD'));
    new Array(30).fill(0).forEach(() => {
      if (lastDate.isBefore(curDate)) {
        this.dateQueue.push(lastDate.format('YYYY-MM-DD'));
        lastDate = lastDate.add(1, 'day');
      }
    });
    const preMinuteIntervalId = setInterval(() => {
      this._initAuthMap();
      // 每分钟向dateQueue中推入20个date
      new Array(30).fill(0).forEach(() => {
        if (lastDate.isBefore(curDate)) {
          this.dateQueue.push(lastDate.format('YYYY-MM-DD'));
          lastDate = lastDate.add(1, 'day');
        }
      });
    }, 60 * 1000);

    setInterval(async () => {
      console.log(`date queue length:${this.dateQueue.length}`);
      console.log(`lockSource Num:${this.lockSourceNum}`);
      if (octokits.length * 30 - this.lockSourceNum > 0) {
        const date = this.dateQueue.shift();
        if (date) {
          console.log(`[${date}] current timestep:`, new Date().getTime());
          const data = await this._collectPerDate({
            date,
          });
          let collected = 0;
          for (let inx = 0; inx < data.length; inx++) {
            let d = data[inx];
            try {
              await this.issueRepository.save(this._getNewIssue(d));
              collected++;
            } catch (e) {
              console.log(e.message);
            }
          }
          console.log(`[${date}] collected:%d`, collected);
          try {
            await this.issueCollectRepositiry.save(
              this._getIssueCollect({
                createdDate: date,
                collectNum: collected,
              }),
            );
          } catch (e) {
            console.log(`[${date}] save issue collect error:`, e);
          }
        } else {
          console.log(`waiting for dateQueue update...`);
        }
      } else {
        console.log(`waiting for source release...`);
      }
    }, 2000);
  }

  // 批量获取issueTitle缺失的部分
  async fixIssueTitleLost(): Promise<any> {
    const issueTitlsLostList = await this.issueRepository.find({
      issueTitle: '',
    });
    console.log('issueTitlsLostList length:', issueTitlsLostList.length);
    const series = chunk(issueTitlsLostList, octokits.length);
    let i = 0;
    setInterval(async () => {
      if (i < series.length) {
        const curGroup = series[i];
        for (let j = 0; j < curGroup.length; j++) {
          try {
            const issue = curGroup[j];
            console.log(
              `\ntrying to fix title lost index: (${i},${j}) titleId:${issue.issueId}`,
            );
            const resp = await octokits[j].request(
              `GET ${formatGithubApi(issue.issueApiUrl)}`,
            );
            console.log(`authIndex:${j} resp status:${resp?.status}`);
            if (resp?.status === 200) {
              issue.issueTitle = resp?.data?.title || '';
              this.issueRepository.save(issue);
            }
          } catch (e) {
            console.log(e.message);
          }
        }
        i++;
      }
    }, 500);
    return issueTitlsLostList;
  }

  // 将repo添加到数据库字段中
  async fixIssueAddRepo(): Promise<any> {
    // 分页处理
    console.log('counting');
    const totalNum = await this.issueRepository.count({
      issueRepo: '',
    });
    console.log(totalNum);
    const limit = 1000;
    const pageNum = Math.ceil(totalNum / limit);
    let totalFixed = 0;
    for (let i = 0; i < pageNum; i++) {
      setTimeout(async () => {
        try {
          const items =
            (
              await this.getIssuesPaginate(
                { limit, page: i + 1 },
                { issueRepo: '' },
              )
            )?.items || [];
          for (let j = 0; j < items.length; j++) {
            let item = items[j];
            if (item?.issueId && item?.issueHtmlUrl) {
              const repo = item?.issueHtmlUrl
                ?.slice(18)
                .match(/(?<=\/).*?\/.*?(?=\/)/g)?.[0];
              await this.issueRepository.save({
                ...item,
                issueRepo: repo,
              });
              // console.log(`${item?.issueId} ${repo}`);
              totalFixed += 1;
              if (totalFixed % 100 === 0) {
                console.log(
                  `[${((totalFixed * 100) / totalNum).toFixed(
                    2,
                  )}%] 总数：${totalNum} 已修复：${totalFixed}`,
                );
              }
            }
          }
        } catch {}
      }, i * 5000);
    }
  }

  // 获取每一月的issue数目，没有的话就返回0条
  async getEveryDateIssueNum(): Promise<any> {
    console.log('getEveryDateIssueNum');
    const data = await this.issueRepository.query(`
        SELECT substr(issueCreated, 1, 7) AS date,
          count(*) as count,
          count(IF(issueState = 'open',true,null)) as open,
          count(IF(issueState = 'closed',true,null)) as closed
        FROM
          issue 
        GROUP BY
          substr(issueCreated, 1, 7) 
        ORDER BY
          substr(issueCreated, 1, 7)`);
    return data;
  }

  // 检查open issue isGoodTag = 1的状态是否closed
  async checkIssueState() {
    const logger = new WsLogger({
      interval: 1000,
      file: {
        path: 'C:\\MyProjects\\github_freshman_helper\\server\\src\\routers\\issue\\issue-state.log',
      },
    });
    const issues = await this.issueRepository.find({
      where: {
        isGoodTag: true,
        issueState: 'open',
      },
      order: {
        issueCreated: 'DESC',
      },
    });
    logger.log(`checkIssueState get ${issues.length} data`);
    const octokitRequest = new OctokitRequest({ sleep: 50 });

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const data: any = await octokitRequest.get(
        formatGithubApi(issue.issueApiUrl),
      );
      if (data && data.state) {
        logger.log(
          `${issue.issueId} origin:${issue.issueState} now:${data.state}`,
        );
        if (data.state !== issue.issueState) {
          await this.issueRepository.save({
            issueId: issue.issueId,
            issueState: data.state,
          });
        }
      } else {
        logger.log(`${issue.issueId} get state error`);
      }
    }
  }
}
