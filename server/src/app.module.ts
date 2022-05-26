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
import { ModelController } from './routers/model/model.controller';
import { ModelService } from './routers/model/model.service';
import { ModelModule } from './routers/model/model.module';
import { UserController } from './routers/user/user.controller';
import { UserService } from './routers/user/user.service';
import { UserModule } from './routers/user/user.module';
import { TokenModule } from './routers/token/token.module';
import { TokenController } from './routers/token/token.controller';
import { TokenService } from './routers/token/token.service';
import { IssuePredictController } from './routers/issue-predict/issue-predict.controller';
import { IssuePredictModule } from './routers/issue-predict/issue-predict.module';
import { IssuePredictService } from './routers/issue-predict/issue-predict.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(MYSQL_CONNECT_CONFIG),
    IssueModule,
    IssueModelModule,
    ModelModule,
    UserModule,
    TokenModule,
    IssuePredictModule,
  ],
  controllers: [
    AppController,
    IssueController,
    IssueModelController,
    ModelController,
    UserController,
    TokenController,
    IssuePredictController,
  ],
  providers: [
    AppService,
    IssueService,
    IssueModelService,
    ModelService,
    UserService,
    TokenService,
    IssuePredictService
  ],
})
export class AppModule {}
