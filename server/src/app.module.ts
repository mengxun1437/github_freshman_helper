import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MYSQL_CONNECT_CONFIG } from './common/constants';
import { IssueModule } from './routers/issue/issue.module';
import { IssueController } from './routers/issue/issue.controller';
import { IssueService } from './routers/issue/issue.service';
import { IssueModelController } from './routers/issue-model/issue-model.controller';
import { IssueModelService } from './routers/issue-model/issue-model.service';
import { IssueModelModule } from './routers/issue-model/issue-model.module';
import { UtilController } from './routers/util/util.controller';

@Module({
  imports: [TypeOrmModule.forRoot(MYSQL_CONNECT_CONFIG),IssueModule, IssueModelModule],
  controllers: [AppController,IssueController, IssueModelController, UtilController],
  providers: [AppService,IssueService, IssueModelService],
})
export class AppModule {}
