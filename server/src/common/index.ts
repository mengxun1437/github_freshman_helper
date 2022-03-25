import { octokits } from './github';
import process from 'process';
import * as fs from 'fs';

export const formatGithubApi = (api: any) => api.slice(22);

export const randomRequest = async (api: any) => {
  if (!api) return null;
  try {
    const octokit = octokits[Math.floor(Math.random() * octokits.length)];
    const resp = await octokit.request(`GET ${api}`);
    if (resp?.status === 200) {
      return resp?.data || null;
    }
    return null;
  } catch {
    return null;
  }
};

export const sleep = async (timer: number) => {
  await new Promise((res) => {
    setTimeout(() => {
      res(1);
    }, timer);
  });
};

export class Logger {
  constructor({
    file = './log/logger.log',
    interval = 5000,
    useFile = false,
    writeFileOption = {},
  }) {
    this.logList = [];
    this.file = file || this.file;
    this.interval = interval || this.interval;
    this.useFile = useFile ?? false;

    if (this.useFile) {
      this.intervalId = setInterval(() => {
        this.tmpIndex = this.logList.length
        fs.appendFileSync(
          this.file,
          this.logList.join('\n'),
          writeFileOption || {}
        );
        this.logList.splice(0,this.tmpIndex)
        this.tmpIndex = 0
      }, this.interval);
    }
  }

  logList: string[] = [];
  file: string = './log/logger.log';
  interval = 5000;
  useFile = false;
  intervalId: any = 0;
  tmpIndex: number = 0;

  log(str) {
    this.logList.push(str);
    console.log(str);
  }

  clearInterval() {
    if (this.useFile && this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const PROD_ENV = process?.env?.NODE_ENV === 'production';
export const DEV_ENV = process?.env?.NODE_ENV === 'development';
