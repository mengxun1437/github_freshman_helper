import { Test, TestingModule } from '@nestjs/testing';
import { IssueModelService } from './issue-model.service';

describe('IssueModelService', () => {
  let service: IssueModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IssueModelService],
    }).compile();

    service = module.get<IssueModelService>(IssueModelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
