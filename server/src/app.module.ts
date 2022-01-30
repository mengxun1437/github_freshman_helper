import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MYSQL_CONNECT_CONFIG } from './common/constants';
import { IssueModule } from './routers/issue/issue.module';
import { IssueController } from './routers/issue/issue.controller';
import { IssueService } from './routers/issue/issue.service';

@Module({
  imports: [TypeOrmModule.forRoot(MYSQL_CONNECT_CONFIG),IssueModule],
  controllers: [AppController,IssueController],
  providers: [AppService,IssueService],
})
export class AppModule {}