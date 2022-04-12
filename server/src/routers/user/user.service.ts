import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { randomUUID } from 'crypto';
import { hashMd5 } from '../../common/index';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 判断邮箱和密码是否匹配
  async checkUser({ nickName, password }) {
    const user = await this.getUser({ nickName });
    const _user = { ...user, checked: false };
    if (!user.exist) {
      _user.checked = false;
    } else {
      _user.checked = user.detail.password === hashMd5(password);
    }
    return _user;
  }

  async getUser({ nickName = '', userId = '' }) {
    const _default = {
      exist: false,
      detail: null,
    };
    let dbUser = null;
    if (nickName) {
      dbUser = await this.userRepository.findOne({
        nickName,
      });
    } else if (userId) {
      dbUser = await this.userRepository.findOne({
        userId,
      });
    }
    if (!dbUser) return _default;

    _default.exist = true;
    _default.detail = dbUser;

    return _default;
  }

  async updateUser(userInfo) {
    const _date = new Date().getTime();
    let user = new User();
    const _user = await this.getUser(userInfo);
    if (!_user.exist) {
      const userId = randomUUID();
      user.userId = userId;
      user.nickName = userInfo.nickName;
      user.password = hashMd5(userInfo.password);
      user.created = _date;
    } else {
      user = _user.detail;
    }

    user.favor = userInfo.favor || user.favor;
    user.updated = _date;

    await this.userRepository.save(user);
    return { userId: user.userId, nickName: user.nickName };
  }
}
