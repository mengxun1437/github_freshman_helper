import { Controller, Get, Headers } from '@nestjs/common';
import { successBody } from '../../common/index';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @Get('/')
  async checkRequestToken(@Headers() headers) {
    const checked = await this.tokenService.checkTokenValid(headers);
    return successBody({ headers, checked });
  }
}
