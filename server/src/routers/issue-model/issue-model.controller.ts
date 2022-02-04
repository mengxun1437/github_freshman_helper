import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PROD_ENV } from 'src/common';
import { IssueService } from '../issue/issue.service';
import { IssueModel } from './issue-model.entity';
import { IssueModelService } from './issue-model.service';
const { exec } = require('child_process');

@Controller('issueModel')
export class IssueModelController {
  constructor(
    private readonly issueModelService: IssueModelService,
    private readonly issueService: IssueService,
  ) {}

  // 通过issueId获取某个issue的model信息
  @Get('/modelInfo/:issueId')
  async getIssueModelConfig(@Param('issueId') issueId: number) {
    return await this.issueModelService.getModelNeedDataByIssueId(issueId);
  }

  @Put('/')
  async updateModel(@Body() body: any) {
    await this.issueModelService.updateModel(body);
  }

  // 获取分页数据
  @Get('/getIssueModelsPaginate')
  async getIssueModelsPaginate(
    @Query('page') page: number = 1,
    @Query('pageNum') limit: number = 20,
    @Query('where') where: any = '{}',
  ): Promise<Pagination<IssueModel>> {
    limit = limit > 100 ? 100 : limit;
    return await this.issueModelService.getIssueModelsPaginate(
      {
        page,
        limit,
      },
      JSON.parse(where),
    );
  }

  // 获取issues的基本信息
  @Get('/getIssueModelsBasicInfo')
  async getIssueModelsBasicInfo() {
    return await this.issueModelService.getIssueModelsBasicInfo();
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

  // 接受模型预测返回结果
  @Post('/predict/:bid')
  async getPredictReport(@Body() body: any, @Param('bid') bid: string) {
    console.log(body, bid);
  }

  @Post('/startPredict')
  async startPredict(@Body() body: any) {
    const { issueId, modelId } = body;
    const bid = randomUUID();
    console.log(bid);
    try {
      const issueModelInfo =
        await this.issueModelService.getModelNeedDataByIssueId(issueId);
      exec(
        `python ../model/predict.py -i '${JSON.stringify({
          ...issueModelInfo,
          issueId,
        })}' -m ${modelId} -b ${bid} ${PROD_ENV ? '' : '-l'}`,
        () => {},
      );
    } catch (e) {
      console.log(e);
    }
  }
}
