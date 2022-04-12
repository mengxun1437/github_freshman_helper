import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { errorBody, successBody } from 'src/common';
import { TokenService } from '../token/token.service';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  // 生成token
  async generateToken({ userId, nickName, password }) {
    const token = this.tokenService.generateToken({ nickName, password });
    await this.tokenService.updateToken({ userId, token });
    return {
      userId,
      nickName,
      token,
    };
  }

  @Get('/')
  async getUserInfo(@Headers() headers) {
    const checkedHd = await this.tokenService.checkTokenValid(headers);
    if (!checkedHd.checked) {
      return {
        code: 40300,
        message: 'token校验失败',
        data: checkedHd,
      };
    }
    const userId = headers.userid;
    const _user = await this.userService.getUser({ userId });
    if (_user.exist) {
      delete _user.detail.password;
      _user.detail.favor = JSON.parse(_user.detail.favor);
    }
    return successBody(_user.detail || {});
  }

  @Post('/')
  async addNewUser(@Body() body) {
    try {
      const { password, nickName } = body;
      if (!nickName || !password) {
        return errorBody('必须要参数缺失,请检查 email,checkCode,password');
      }
      const user = await this.userService.getUser({ nickName });
      if (user.exist) return errorBody('此昵称已经注册~');

      const addInfo = await this.userService.updateUser({
        password,
        nickName,
      });
      // 登录成功以后,更新token,返回用户信息
      const tokenInfo = await this.generateToken({
        userId: addInfo.userId,
        nickName,
        password,
      });
      return successBody(tokenInfo, '注册用户成功');
    } catch (e) {
      return errorBody(`add user failed ${e.message}`);
    }
  }

  @Post('/login')
  async userLogin(@Body() body) {
    try {
      const { nickName, password } = body;
      if (!nickName || !password) return errorBody('必要参数缺失');
      const checkedUser = await this.userService.checkUser({
        nickName,
        password,
      });
      if (!checkedUser.checked) return errorBody('用户密码错误');

      // 登录成功以后,更新token,返回用户信息
      const tokenInfo = await this.generateToken({
        userId: checkedUser.detail.userId,
        nickName,
        password,
      });
      return successBody(tokenInfo, '登录成功');
    } catch (e) {
      return errorBody(`user login error ${e.message}`);
    }
  }

  @Post('/favor')
  async updateUserFavor(@Headers() headers, @Body() body) {
    const checkedHd = await this.tokenService.checkTokenValid(headers);
    if (!checkedHd.checked) {
      return {
        code: 40300,
        message: 'token校验失败',
        data: checkedHd,
      };
    }
    try {
      const { action, issueId } = body;
      const userId = headers.userid;
      const user = await this.userService.getUser({ userId });
      if (user.exist) { 
        const favor = new Set(JSON.parse(user.detail.favor || '[]'));
        if (action === 'add') {
          favor.add(issueId);
        } else if (action === 'delete') {
          favor.delete(issueId);
        }
        await this.userService.updateUser({
          userId,
          favor: JSON.stringify([...favor]),
        });
        return successBody({
            issueId
        });
      }
      return errorBody();
    } catch (e) {
      return errorBody(e.message);
    }
  }
}
