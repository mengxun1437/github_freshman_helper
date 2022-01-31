import { Controller, Get, Query, Req, Res } from '@nestjs/common';
const https = require('https')
const url = require('url')
import { Response, Request } from 'express';

@Controller('util')
export class UtilController {
  // 解决Github页面的iframe问题
  @Get('/getGitHubPage')
  async getGitHubPage(
    @Query('target') target: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const targetURL = url.parse(target)
    const options = {
        hostname: targetURL.hostname,
        port: 443,
        path: url.format(targetURL),
        method: "GET"
      };
    const proxy = https.request(options, _res => {
        // 3.修改响应头
        const fieldsToRemove = ["x-frame-options", "content-security-policy"];
        Object.keys(_res.headers).forEach(field => {
          if (!fieldsToRemove.includes(field.toLocaleLowerCase())) {
            res.setHeader(field, _res.headers[field]);
          }
        });
        _res.pipe(res, {
          end: true
        });
      });
      req.pipe(proxy, {
        end: true
      });
  }
}
