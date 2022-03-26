import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IssueService } from './issue.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Issue } from './issue.entity';
import * as dayjs from 'dayjs';

@Controller('issue')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get('/getAUnlabelIssueId')
  async getAUnlabelIssueId() {
    return this.issueService.getAUnlabelIssueId();
  }

  @Get('/issueInfo/:issueId')
  async getIssueInfoByIssueId(@Param('issueId') issueId: number) {
    return await this.issueService.getIssueInfoByIssueId(issueId);
  }

  @Get('/getIssuesPaginate')
  async getIssuesPaginate(
    @Query('page') page: number = 1,
    @Query('pageNum') limit: number = 20,
    @Query('where') where: any = '{}',
  ): Promise<Pagination<Issue>> {
    limit = limit > 100 ? 100 : limit;
    return await this.issueService.getIssuesPaginate(
      {
        page,
        limit,
      },
      JSON.parse(where),
    );
  }

  // 获取issues的基本信息
  @Get('/getIssuesBasicInfo')
  async getIssuesBasicInfo() {
    return await this.issueService.getIssuesBasicInfo();
  }

  @Get('/collectFirstIssues')
  async getGoodFirstIssues(
    @Query('start') start: string = '2000-01-01',
    @Query('end') end: string = dayjs().format('YYYY-MM-DD'),
  ): Promise<any> {
    await this.issueService.collectFirstIssues({ start, end });
    return 'success';
  }

  @Get('/getGitHubRateLimit')
  async getGitHubRateLimit(): Promise<any> {
    const { octokit, authIndex } = this.issueService.getOctokit();
    return {
      authIndex,
      data: await octokit.request('GET /rate_limit'),
    };
  }

  // 获取某一天的issue
  @Get('/getGitHubIssueByDate')
  async getGitHubIssueByDate(@Query('date') date: string) {
    // console.log(date)
    return await this.issueService._getIssues({ date });
  }

  // 脚本处理一些特殊情况
  @Post('/fallbackIssue')
  async fallbackIssue(@Body() body: any) {
    const { type } = body;
    if (type === 'fixIssueTitleLost') {
      return await this.issueService.fixIssueTitleLost();
    }
    if (type === 'fixIssueAddRepo') {
      await this.issueService.fixIssueAddRepo();
    }
  }
}
