import { Body, Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec, execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { PROD_ENV } from '../../common/index';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { uploadStreamToQiniu } from '../../common/qiniuSdk';
import { Readable } from 'stream';
import * as fs from 'fs';
import { QINIU_BUCKET_URL } from '../../common/constants';

/**
 // TODO: 后续可补充，暂时考虑一种算法
modelType  'supervised'
modelProgram : 'decision_tree'
modelFrameWork : 'sklearn'

 */

@Injectable()
export class ModelService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

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
      return 'platform allow only one task at the moment,try training later~';
    try {
      await this.modelRepository.save({
        modelId,
        modelType,
        modelProgram,
        modelFramework,
        modelTraining: true,
        modelTrainingLogUrl:`${QINIU_BUCKET_URL}/log/${modelId}.log`
      });

      const exec_command = `python ../model/${modelType}.py -m ${modelId} -f ${modelFramework} -p ${modelProgram} ${
        PROD_ENV ? '' : '-l'
      }`;
      const child = exec(exec_command, async (err: any) => {
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
      child.stdout.on('data',(data) => {
          console.log(data)
          uploadStreamToQiniu(`log/${modelId}.log`, data);
      })

    } catch (e) {
      await this.modelRepository.delete({
        modelId,
      });
      return `error: ${e.message}`;
    }
  }

  async updateModelConfig(config: any) {
    await this.modelRepository.save(config);
  }
}
