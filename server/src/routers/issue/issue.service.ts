import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { octokits } from 'src/common/github';
import { Repository } from 'typeorm';
import { Issue } from './issue.entity';
import * as dayjs from 'dayjs';
import { IssueCollect } from './issue-collect.entity';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueCollect)
    private readonly issueCollectRepositiry: Repository<IssueCollect>,
  ) {}

  private authIndex: number = 0;
  // 判断issue是否已经存在
  async _issueExistsById(issueId) {
    try {
      if (this.issueRepository.findOne({ issueId: issueId })) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  getOctokits() {
    const authIndex = this.authIndex;
    if (this.authIndex < octokits.length - 1) {
      this.authIndex++;
    } else {
      this.authIndex = 0;
    }
    return {
      authIndex,
      octokit: octokits[authIndex],
    };
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
      const { octokit, authIndex } = this.getOctokits();
      console.log(`using octokit authIndex:${authIndex}`);
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
      console.log('get api error:', e);
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
    collectNum: number;
    hasNum: number;
  }) {
    console.log('collect created date:', createdDate);
    const newIssueCollect = new IssueCollect();
    newIssueCollect.createdDate = createdDate;
    newIssueCollect.collectNum = collectNum;
    newIssueCollect.hasNum = hasNum;
    newIssueCollect.collectedTime = dayjs().format('YYYY-MM-DD');
    return newIssueCollect;
  }

  // 先收集当天的，如果当前的超过了1000条 -> 分成两个半天
  async _collectPerDate({ date }): Promise<any[]> {
    console.log('collecting date:', date);
    try {
      // 抛出试探性的数据，判断这次时间筛选是否超过1000，如果超过1000,分成两半，如果还超出，暂不处理
      const resp = await this._getIssues({ date });
      const data = [];
      if (resp?.total_count < 1000) {
        const perPage = 100;
        const pageNums = Math.ceil(resp?.total_count / 100);
        for (let i = 0; i < pageNums; i++) {
          try {
            const res = await this._getIssues({ date, perPage, pageNum: i });
            data.push(...(res?.items || []));
          } catch (e) {
            console.log('get github api error', e);
          }
        }
      } else {
        // 暂不搜集，等后续确定逻辑
        console.log('data length > 1000');
        try {
          await this.issueCollectRepositiry.save(
            this._getIssueCollect({
              createdDate: date,
              collectNum: 0,
              hasNum: resp?.total_count || 0,
            }),
          );
        } catch (e) {
          console.log('save issue collect error:', e);
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
      (newIssue.issueCommentsApiUrl = d?.comments_url),
      (newIssue.issueCreated = d?.created_at),
      (newIssue.issueUpdated = d?.updated_at),
      (newIssue.collectedTime = dayjs().format('YYYY-MM-DD'));
    return newIssue;
  }

  // 获取issues
  async collectFirstIssues(): Promise<any> {
    // 最小时间 2000-01-01
    // 开始收集时间 数据中收集记录中的最大的created
    // 目前每天更新一次
    let curDate = dayjs(dayjs().format('YYYY-MM-DD'));
    const lastCollectedTime =
      (
        await this.issueRepository.query(
          'select max(createdDate) from issue_collect',
        )
      )?.[0]?.['max(createdDate)'] || curDate;
    let lastDate = dayjs(dayjs(lastCollectedTime).format('YYYY-MM-DD'));
    const intervalId = setInterval(() => {
      if (lastDate.isBefore(curDate)) {
        ((lastDate) => {
          setTimeout(async () => {
            console.log('current timestep:', new Date().getTime(), '\n');
            const data = await this._collectPerDate({
              date: lastDate.format('YYYY-MM-DD'),
            });
            console.log(`collected %d`, data.length);
            let collected = 0;
            for (let inx = 0; inx < data.length; inx++) {
              let d = data[inx];
              try {
                await this.issueRepository.save(this._getNewIssue(d));
                collected++;
              } catch (e) {
                console.log(e);
              }
            }
            try {
              await this.issueCollectRepositiry.save(
                this._getIssueCollect({
                  createdDate: lastDate.format('YYYY-MM-DD'),
                  collectNum: collected,
                  hasNum: data?.length || 0,
                }),
              );
            } catch (e) {
              console.log('save issue collect error:', e);
            }
          }, 0);
        })(lastDate);
      } else {
        clearInterval(intervalId);
      }
      lastDate = lastDate.add(1, 'day');
    }, 2500 / Math.ceil(octokits.length / 2));
  }
}
