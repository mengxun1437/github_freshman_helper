import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { IssueService } from '../issue/issue.service';
import { IssueModelService } from './issue-model.service';

@Controller('issueModel')
export class IssueModelController {
  constructor(
    private readonly issueModelService: IssueModelService,
    private readonly issueService: IssueService,
  ) {}

  // 通过issueId获取某个issue的model信息
  @Get('/:issueId')
  async getIssueModelConfig(@Param('issueId') issueId: number) {
    return await this.issueModelService.getModelNeedDataByIssueId(issueId);
  }

  @Put('/')
  async updateModel(@Body() body: any) {
    await this.issueModelService.updateModel(body);
  }

  // 随机生成标签
  @Post('/randomLabel')
  async randomLabel(@Body() body: any) {
    const { randomNum, goodNum } = body;
    for (let i = 0; i < randomNum; i++) {
      try {
        const isGoodForFreshman = i <= goodNum;
        const issueId = await this.issueService.getAUnlabelIssueId();
        const issueModel =
          await this.issueModelService.getModelNeedDataByIssueId(issueId);
        await this.issueModelService.updateModel({
          ...issueModel,
          issueId,
          isGoodForFreshman,
        });
      } catch (e) {
        console.log(e.messge);
      }
    }
  }
}
