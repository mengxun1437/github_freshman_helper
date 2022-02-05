import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelPredict } from './model-predict.entity';
import { Model } from './model.entity';
import { IssueModel } from '../issue-model/issue-model.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Model,ModelPredict,IssueModel])],
    providers: [],
    controllers: [],
    exports: [TypeOrmModule],
})
export class ModelModule {}
