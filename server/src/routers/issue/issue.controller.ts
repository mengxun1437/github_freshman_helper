import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IssueService } from './issue.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Issue } from './issue.entity';

@Controller('issue')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get('/getIssuesPaginate')
  async index(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<Pagination<Issue>> {
    limit = limit > 100 ? 100 : limit;
    return this.issueService.getIssuesPaginate({
      page,
      limit
    });
  }

  @Get('/collectFirstIssues')
  async getGoodFirstIssues(): Promise<any> {
    await this.issueService.collectFirstIssues();
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
    if(type === 'fixIssueAddRepo'){
        await this.issueService.fixIssueAddRepo()
    }
  }

  // 获取看板的数据
  @Get('/getViewData')
  async getViewData(){

  }

}
