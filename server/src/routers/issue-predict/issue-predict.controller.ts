import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { exec } from 'child_process';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PROD_ENV } from 'src/common';
import { IssuePredictService } from './issue-predict.service';
import { IssuePredict } from './issue-predict.entity';

@Controller('issuePredict')
export class IssuePredictController {
  constructor(private readonly issuePredictService: IssuePredictService) {}

  // 获取分页数据
  @Get('/getIssuePredictsPaginate')
  async getIssueModelsPaginate(
    @Query('page') page: number = 1,
    @Query('pageNum') limit: number = 20,
    @Query('where') where: any = '{}',
  ): Promise<Pagination<IssuePredict>> {
    limit = limit > 100 ? 100 : limit;
    return await this.issuePredictService.getIssueModelsPaginate(
      {
        page,
        limit,
      },
      JSON.parse(where),
    );
  }

  @Post('/')
  async updateIssuePredictInfo(@Body() body) {
    await this.issuePredictService.updateIssuePredict(body);
  }

  @Post('/predict')
  async startPredict(@Body() body) {
    const { modelId } = body;
    try {
      const execCommand = `python ../model/predict_remote.py -m ${modelId} ${
        PROD_ENV ? '' : '-l'
      }`;
      exec(execCommand);
    } catch {
      await this.issuePredictService.updateIssuePredict({
        modelId,
        status: 'predict error',
      });
    }
  }

  @Post('/applyResult')
  async applyResult(@Body() body){
      const {modelId} = body
      if(modelId){
        await this.issuePredictService.applyResult(modelId)
      }
  }
}
