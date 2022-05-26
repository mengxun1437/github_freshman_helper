import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuePredict } from './issue-predict.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssuePredict])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class IssuePredictModule {}
