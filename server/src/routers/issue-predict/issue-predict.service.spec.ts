import { Test, TestingModule } from '@nestjs/testing';
import { IssuePredictService } from './issue-predict.service';

describe('IssuePredictService', () => {
  let service: IssuePredictService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IssuePredictService],
    }).compile();

    service = module.get<IssuePredictService>(IssuePredictService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
