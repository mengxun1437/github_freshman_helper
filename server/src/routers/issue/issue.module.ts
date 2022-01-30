import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { Issue } from './issue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Issue])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class IssueModule {}
