import { Module } from '@nestjs/common';
import { Issue } from './issue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueCollect } from './issue-collect.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Issue,IssueCollect])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class IssueModule {}
