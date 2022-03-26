import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ModelService } from './model.service';
import { IssueModelService } from '../issue-model/issue-model.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Model } from './model.entity';
@Controller('model')
export class ModelController {
  constructor(
    private readonly modelService: ModelService,
    private readonly issueModelService: IssueModelService,
  ) {}

  // 获取分页数据
  @Get('/getModelsPaginate')
  async getModelsPaginate(
    @Query('page') page: number = 1,
    @Query('pageNum') limit: number = 20,
    @Query('where') where: any = '{}',
  ): Promise<Pagination<Model>> {
    limit = limit > 100 ? 100 : limit;
    return await this.modelService.getModelsPaginate(
      {
        page,
        limit,
      },
      JSON.parse(where),
    );
  }

  // 获取issues的基本信息
  @Get('/getModelsBasicInfo')
  async getModelsBasicInfo() {
    return await this.modelService.getModelsBasicInfo();
  }

  @Post('/startRunAModel')
  async startRunAModel(@Body() body: any) {
    return await this.modelService.startRunAModel(body || {});
  }

  @Post('/updateModelConfig')
  async updateModelConfig(@Body() body: any) {
    try {
      await this.modelService.updateModelConfig(body);
      return {
        code: 0,
      };
    } catch (e) {
      return {
        code: 40001,
        error: e.message,
      };
    }
  }

  @Post('/updateModelPredict')
  async updateModelPredict(@Body() body: any) {
    if (body.isGoodForFreshman === '1') {
      body.isGoodForFreshman = true;
    } else if (body.isGoodForFreshman === '0') {
      body.isGoodForFreshman = false;
    } else return;
    await this.modelService.updateModelPredict(body || {});
  }

  @Post('/startPredict')
  async startPredict(@Body() body: any) {
    const { issueId } = body;
    try {
      const issueModelInfo =
        await this.issueModelService.getModelNeedDataByIssueId({ issueId });
      return await this.modelService.startPredict({ ...body, issueModelInfo });
    } catch (e) {
      console.log(e);
      return {};
    }
  }
}
