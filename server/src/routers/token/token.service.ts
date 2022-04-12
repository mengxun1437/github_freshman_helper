import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './token.entity';
import { hashMd5 } from '../../common/index';

interface GetToken {
  exist: boolean;
  expired: boolean;
  detail: Token | undefined;
}

enum TokenReasonCode {
  TOKEN_VALID_TRUE = 0,
  TOKEN_VALID_FALSE = 1,
  HEADERS_PARAM_LOST = 2,
  TOKEN_OUT_EXPIRE = 3,
}

const TokenReasonMap = {
  [TokenReasonCode.HEADERS_PARAM_LOST]: 'headers参数丢失',
  [TokenReasonCode.TOKEN_VALID_FALSE]: 'token校验错误',
  [TokenReasonCode.TOKEN_VALID_TRUE]: 'token校验成功',
  [TokenReasonCode.TOKEN_OUT_EXPIRE]: 'token过期',
};

export interface TokenValid {
  checked: boolean;
  reason: string;
  reasonCode: TokenReasonCode;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async getToken(userId): Promise<GetToken> {
    const _default = {
      exist: false,
      expired: false,
      detail: null,
    };
    const dbToken = await this.tokenRepository.findOne({
      userId,
    });
    if (!dbToken || !userId) return _default;

    _default.exist = true;
    // 获取时间, token有效期为15天
    _default.expired =
      new Date().getTime() - dbToken.updated <= 15 * 24 * 60 * 60 * 1000;
    _default.detail = dbToken;

    return _default;
  }

  // 更新一条token信息
  async updateToken({ userId, token }) {
    const dbToken = await this.getToken(userId);
    let saveToken = new Token();
    const currentDate = new Date().getTime();
    if (!dbToken.exist) {
      saveToken.userId = userId;
      saveToken.created = currentDate;
    } else {
      saveToken = dbToken.detail;
    }
    saveToken.token = token;
    saveToken.updated = currentDate;

    await this.tokenRepository.save(saveToken);
  }

  // 生成token
  generateToken({ nickName, password }) {
    return hashMd5(`${nickName}${password}${new Date().getTime()}`);
  }

  // 判断headers中token是否有效
  async checkTokenValid(headers: any): Promise<TokenValid> {
    const { userid, token } = headers;
    const res: TokenValid = {
      checked: false,
      reason: TokenReasonMap[TokenReasonCode.TOKEN_VALID_FALSE],
      reasonCode: TokenReasonCode.TOKEN_VALID_FALSE,
    };
    if (!userid || !token) {
      res.reason = TokenReasonMap[TokenReasonCode.HEADERS_PARAM_LOST];
      res.reasonCode = TokenReasonCode.HEADERS_PARAM_LOST;
    } else {
      const _token = await this.getToken(userid);
      if (_token.exist) {
        if (_token.expired) {
          if (_token.detail.token === token) {
            res.checked = true;
            res.reason = TokenReasonMap[TokenReasonCode.TOKEN_VALID_TRUE];
            res.reasonCode = TokenReasonCode.TOKEN_VALID_TRUE;
          }
        } else {
          res.reason = TokenReasonMap[TokenReasonCode.TOKEN_OUT_EXPIRE];
          res.reasonCode = TokenReasonCode.TOKEN_OUT_EXPIRE;
        }
      }
    }
    return res;
  }
}
