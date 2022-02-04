import { Body, Controller, Put, Post } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

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
}
