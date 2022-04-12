import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../issue/issue.entity';
import { IssueModelInfo } from './issue-model-info.entity';
import { IssueModel } from './issue-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, IssueModel, IssueModelInfo])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class IssueModelModule {}
