const fs = require('fs');
import { Body, Injectable, Post, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec, execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { PROD_ENV } from '../../common/index';
import { Not, Repository } from 'typeorm';
import { Model } from './model.entity';
import { QINIU_BUCKET_URL } from '../../common/constants';
import { ModelPredict } from './model-predict.entity';
import { Issue } from '../issue/issue.entity';
import { IssueModelInfo } from '../issue-model/issue-model-info.entity';
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate';
import { chunk } from 'lodash';

/**
 // TODO: 后续可补充，暂时考虑一种算法
modelType  'supervised'
modelProgram : 'decision_tree'
modelFrameWork : 'sklearn'

 */

export enum START_NEW_MODEL_STATUS_CODE {
  SUCCESS = 0,
  FAIL = 1,
}

@Injectable()
export class ModelService implements OnModuleDestroy {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(IssueModelInfo)
    private readonly modelInfoRepository: Repository<IssueModelInfo>,
    @InjectRepository(ModelPredict)
    private readonly modelPredictRepository: Repository<ModelPredict>,
  ) {}

  async onModuleDestroy(signal?: string) {
    // 程序异常退出时，删除所有正在跑的任务
    try {
      const runningModels = await this.modelRepository.find({
        modelTraining: true,
      });
      for (let i = 0; i < runningModels.length; i++) {
        const runningModel = runningModels[i];
        if (runningModel.pid) {
          try {
            execSync(`kill -9 ${runningModel.pid}`);
          } catch {}
        }
        try {
          const logFile = `./.log/${runningModel.modelId}.log`;
          if (fs.existsSync(logFile)) {
            fs.rm(logFile, () => {});
          }
        } catch {}
        await this.modelRepository.delete(runningModel);
      }
    } catch {}
  }

  // 获取model分页
  async getModelsPaginate(
    options: IPaginationOptions,
    where = {},
  ): Promise<Pagination<Model>> {
    let queryBuilder = this.modelRepository.createQueryBuilder().where(where);
    queryBuilder.orderBy('createdAt', 'DESC');
    return paginate<Model>(queryBuilder, options);
  }

  async getAllModelIds(){
    const ids = (await this.modelRepository.query('select modelId from model')) || []
    return ids.map((id:any) => id.modelId)
  }

  // 获取基本信息
  async getModelsBasicInfo() {
    const totalModelsNum = await this.modelRepository.count();
    const modelTypeNum =
      Number(
        (
          await this.modelRepository.query(
            'SELECT COUNT(DISTINCT modelType)  AS count FROM model',
          )
        )?.[0]?.count,
      ) || 0;
    const modelProgramNum =
      Number(
        (
          await this.modelRepository.query(
            'SELECT COUNT(DISTINCT modelProgram)  AS count FROM model',
          )
        )?.[0]?.count,
      ) || 0;
    const modelFrameworkNum =
      Number(
        (
          await this.modelRepository.query(
            'SELECT COUNT(DISTINCT modelFramework)  AS count FROM model',
          )
        )?.[0]?.count,
      ) || 0;
    const modelTrainingNum = await this.modelRepository.count({
      modelTraining: true,
    });

    return {
      totalModelsNum,
      modelTypeNum,
      modelProgramNum,
      modelFrameworkNum,
      modelTrainingNum,
    };
  }

  async startRunAModel({
    modelType = 'supervised',
    modelProgram = 'decision_tree',
    modelFramework = 'sklearn',
  }: any) {
    // 考虑到性能问题，平台只能允许同一时刻只有一中模型可以跑
    const modelId = randomUUID();
    if (
      await this.modelRepository.findOne({
        modelTraining: true,
      })
    )
      return {
        code: START_NEW_MODEL_STATUS_CODE.FAIL,
        message:
          'platform allow only one task at the moment,try training later~',
      };
    try {
      const modelTrainingLogUrl = `${QINIU_BUCKET_URL}/log/${modelId}.log`;
      await this.modelRepository.save({
        modelId,
        modelType,
        modelProgram,
        modelFramework,
        modelTraining: true,
        modelTrainingLogUrl,
      });

      const exec_command = `python ../model/${modelType}.py -m ${modelId} -f ${modelFramework} -p ${modelProgram} ${
        PROD_ENV ? '' : '-l'
      }`;
      console.log(exec_command);
      const child = exec(exec_command, async (err: any, stdout: any) => {
        if (err) {
          const tmpModel = await this.modelRepository.findOne({
            modelId,
          });
          try {
            execSync(`kill -9 ${tmpModel.pid}`);
          } catch {}
          await this.modelRepository.delete({
            modelId,
          });
        }
      });
      await this.modelRepository.save({
        modelId,
        pid: child.pid,
      });

      return {
        code: START_NEW_MODEL_STATUS_CODE.SUCCESS,
        message: `create training task success`,
        data: {
          modelId,
        },
      };
    } catch (e) {
      await this.modelRepository.delete({
        modelId,
      });
      return {
        code: START_NEW_MODEL_STATUS_CODE.FAIL,
        message: `${e.message}`,
      };
    }
  }

  // TODO: 终止一个模型任务

  async updateModelConfig(config: any) {
    await this.modelRepository.save(config);
  }

  async updateModelPredict(config: any) {
    await this.modelPredictRepository.save(config);
  }

  async startPredict({ issues, modelId }: any) {
    try {
      const execCommand = `python ../model/predict_batch.py -i '${new Buffer(
        JSON.stringify(
          issues.map((issue: any) => ({
            ...issue,
            // 处理特殊类型
            hasOrganization: issue?.hasOrganization ? 1 : 0,
            creatorCreated: Number(issue?.creatorCreated),
          })),
        ),
      ).toString('base64')}' -m ${modelId} ${PROD_ENV ? '' : '-l'}`;
      console.log(execCommand);
      exec(execCommand);
    } catch {}
  }
}
