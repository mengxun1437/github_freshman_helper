import { octokits } from './github';
import process from 'process';
import * as fs from 'fs';
import { createHash } from 'crypto';

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

export const successBody = (data = {}, message = 'success') => ({
  code: 0,
  message,
  data,
});

export const errorBody = (message = 'error', data = {}) => ({
  code: 40000,
  message,
  data,
});

export const hashMd5 = (str) => {
  const md5 = createHash('md5');
  return md5.update(str).digest('hex');
};

export class OctokitRequest {
  constructor({ sleep = 1000 }) {
    this.authIndex = 0;
    this.sleep = sleep;
  }

  authIndex: number = 0;
  sleep: number = 1000;

  _getAuthIndex() {
    if (this.authIndex < octokits.length) {
      this.authIndex++;
      console.log(`use authIndex ${this.authIndex - 1}`);
      return this.authIndex - 1;
    } else {
      this.authIndex = 1;
      console.log(`use authIndex 0`);
      return 0;
    }
  }

  async get(api: any) {
    if (!api) return null;
    try {
      const octokit = octokits[this._getAuthIndex()];
      const resp = await octokit.request(`GET ${api}`);
      await sleep(this.sleep);
      if (resp?.status === 200) {
        return resp?.data || null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

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
        this.tmpIndex = this.logList.length;
        fs.appendFileSync(
          this.file,
          this.logList.join('\n'),
          writeFileOption || {},
        );
        this.logList.splice(0, this.tmpIndex);
        this.tmpIndex = 0;
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
      console.log(`clear interval ${this.intervalId}`);
      clearInterval(this.intervalId);
    }
  }
}

export const PROD_ENV = process?.env?.NODE_ENV === 'production';
export const DEV_ENV = process?.env?.NODE_ENV === 'development';
