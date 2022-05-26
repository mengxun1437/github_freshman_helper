import { Test, TestingModule } from '@nestjs/testing';
import { IssuePredictController } from './issue-predict.controller';

describe('IssuePredictController', () => {
  let controller: IssuePredictController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssuePredictController],
    }).compile();

    controller = module.get<IssuePredictController>(IssuePredictController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
