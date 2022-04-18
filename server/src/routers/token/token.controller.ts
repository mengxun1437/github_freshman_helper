import { Controller, Get, Headers, Post } from '@nestjs/common';
import { successBody, errorBody } from '../../common/index';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @Post('/')
  async checkRequestToken(@Headers() headers) {
    const checked = await this.tokenService.checkTokenValid(headers);
    return successBody(checked);
  }

  @Post('/admin')
  async checkAdminToken(@Headers() headers) {
    const checked = await this.tokenService.checkAdminToken(headers);
    return successBody(checked);
  }
}
