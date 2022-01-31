import { Test, TestingModule } from '@nestjs/testing';
import { UtilController } from './util.controller';

describe('UtilController', () => {
  let controller: UtilController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilController],
    }).compile();

    controller = module.get<UtilController>(UtilController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
