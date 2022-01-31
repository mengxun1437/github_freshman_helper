import { Test, TestingModule } from '@nestjs/testing';
import { IssueModelController } from './issue-model.controller';

describe('IssueModelController', () => {
  let controller: IssueModelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueModelController],
    }).compile();

    controller = module.get<IssueModelController>(IssueModelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
