const YAML = require("yaml");
const fs = require("fs");

const file = fs.readFileSync("./config.yaml", "utf8");
const config = YAML.parse(file);

const { project, mysql, github, qiniu } = config;

const web_src_common_index = `
export const BASE_SERVER_URL = '${project.server.url}'
export const BASE_PROXY_URL = '${project.server.proxy}'
export const BASE_QINIU_URL = '${qiniu.bucket_url}'
`;

const server_src_common_constants = `
import { Issue } from '../routers/issue/issue.entity';
import { IssueCollect } from '../routers/issue/issue-collect.entity';
import { IssueModel } from '../routers/issue-model/issue-model.entity';
import { Model } from '../routers/model/model.entity';
import { ModelPredict } from '../routers/model/model-predict.entity';
import { IssueModelInfo } from '../routers/issue-model/issue-model-info.entity';
import { User } from '../routers/user/user.entity';
import { Token } from '../routers/token/token.entity';

export const GITHUB_AUTH_LIST = [${github.tokens
  .map((token) => `'${token}'`)
  .join(",")}];

export const MYSQL_CONNECT_CONFIG: any = {
  type: 'mysql',
  host: '${mysql.host}',
  port: ${mysql.port},
  username: '${mysql.username}',
  password: '${mysql.username}',
  database: '${mysql.username}',
  entities: [Issue,IssueCollect,IssueModel,IssueModelInfo,Model,ModelPredict,User,Token],
  synchronize: true,
};

export const QINIU_AK = '${qiniu.ak}'
export const QINIU_SK = '${qiniu.sk}'
export const QINIU_BUCKET = '${qiniu.bucket}'
export const QINIU_BUCKET_URL = '${qiniu.bucket_url}'

export const ADMIN_ACCOUNTS =  [${project.server.admin
  .map((account) => `'${account}'`)
  .join(",")}]
`;

const model_config_config = `
mysql_config = {
    "host": "${mysql.host}",
    "port": ${mysql.port},
    "user": "${mysql.username}",
    "passwd": "${mysql.password}",
    "db": "${mysql.database}"
}

qiniu_ak = '${qiniu.ak}'
qiniu_sk = '${qiniu.sk}'
qiniu_bucket = '${qiniu.bucket}'
`;

const files = [
  {
    file: web_src_common_index,
    path: "./web/src/common/index.ts",
  },
  {
    file: server_src_common_constants,
    path: "./server/src/common/constants.ts",
  },
  {
    file: model_config_config,
    path: "./model/config/config.py",
  },
];

files.forEach((f) => {
  console.log(`start to write config file to ${f.path}`);
  fs.writeFileSync(f.path, f.file);
  console.log(`write successfully~`);
});
