import { Body, Injectable, Post, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec, execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { PROD_ENV } from '../../common/index';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { uploadStreamToQiniu } from '../../common/qiniuSdk';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import { QINIU_BUCKET_URL } from '../../common/constants';
import { ModelPredict } from './model-predict.entity';
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate';

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
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(ModelPredict)
    private readonly modelPredictRepository: Repository<ModelPredict>,
  ) {}

  async onModuleDestroy(signal?: string) {
    // 程序异常退出时，删除所有正在跑的任务
    // 不仅要删除记录，还要删除pid的进程 以及本地的日志文件
    try {
      const runningModels = await this.modelRepository.find({
          modelTraining:true
      })
      for(let i =0; i< runningModels.length;i++){
          const runningModel = runningModels[i]
          if(runningModel.pid){
              try{
                  execSync(`kill -9 ${runningModel.pid}`)
                  if(await fs.stat(`./log/${runningModel}.log`)){
                      execSync(`rm ./log/${runningModel}.log`)
                  }
                  await this.modelRepository.delete(runningModel)
              }catch{}
          }
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

      const exec_command = `nohup python ../model/${modelType}.py -m ${modelId} -f ${modelFramework} -p ${modelProgram} ${
        PROD_ENV ? '' : '-l'
      } > ${modelId}.log 2>&1 &`;
      const child = exec(exec_command, async (err: any, stdout: any) => {
        console.log(err);
        console.log(stdout);
        if (err) {
          await this.modelRepository.delete({
            modelId,
          });
        } else {
          await this.modelRepository.save({
            modelId,
            modelTraining: false,
          });
        }
      });
      await this.modelRepository.save({
          modelId,
          pid:child.pid
      })

      return {
        code: START_NEW_MODEL_STATUS_CODE.SUCCESS,
        message: `create training task success`,
        data: {
          modelId,
        },
      };
    } catch (e) {
      console.log(e);
      await this.modelRepository.delete({
        modelId,
      });
      return {
        code: START_NEW_MODEL_STATUS_CODE.FAIL,
        message: `${e.message}`,
      };
    }
  }

  async updateModelConfig(config: any) {
    await this.modelRepository.save(config);
  }

  async updateModelPredict(config: any) {
    await this.modelPredictRepository.save(config);
  }

  async startPredict({ issueId, modelId, issueModelInfo }: any) {
    const bid = randomUUID();
    try {
      const execCommand = `python ../model/predict.py -i '${JSON.stringify({
        ...issueModelInfo,
        issueId,
      })}' -m ${modelId} -b ${bid} ${PROD_ENV ? '' : '-l'}`;
      exec(execCommand);
      // 每隔3秒轮询一次，如果轮询总时长超过30秒，则认为预测失败
      const startTime = new Date().getTime();
      let predict = undefined;
      const intervalReq = setInterval(async () => {
        predict = await this.modelPredictRepository.findOne({
          bid,
        });
      }, 3000);
      await new Promise((res) => {
        const intervalWatch = setInterval(() => {
          if (predict || new Date().getTime() - startTime > 30 * 1000) {
            clearInterval(intervalReq);
            clearInterval(intervalWatch);
            res(1);
          }
        }, 3000);
      });

      return predict || {};
    } catch (e) {
      console.log(e);
      return {};
    }
  }
}
