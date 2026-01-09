import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/registerUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils/crypto';
import { EmailService } from 'src/email/email.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/loginUser.dto';
import { LoginUserVO } from './vo/login-user.vo';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;
  @Inject(EmailService)
  private readonly emailService: EmailService;
  @Inject(RedisService)
  private readonly redisService: RedisService;
  @Inject(JwtService)
  private readonly jwtService: JwtService;
  @Inject(ConfigService)
  private configService: ConfigService;

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (captcha !== user.captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const findUser = await this.userRepository.findOne({
      where: { username: user.username },
    });
    if (findUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository.save({
      username: user.username,
      password: md5(user.password),
      email: user.email,
      nick_name: user.nick_name,
    });
    return '注册成功';
  }
  async getCaptcha(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpException('邮箱格式错误', HttpStatus.BAD_REQUEST);
    }
    const findUser = await this.userRepository.findOne({
      where: { email: email },
    });
    if (findUser) {
      throw new HttpException('邮箱已被注册', HttpStatus.BAD_REQUEST);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`captcha_${email}`, code, 5 * 60);
    await this.emailService.sendCodeEmail(email, code);
    return '验证码发送成功';
  }
  async initData() {
    const permissions = await this.permissionRepository.save([
      {
        code: 'ccc',
        description: '访问 ccc 接口',
      },
      {
        code: 'ddd',
        description: '访问 ddd 接口',
      },
    ]);

    const roles = await this.roleRepository.save([
      {
        name: '管理员',
        permissions: permissions,
      },
      {
        name: '普通用户',
        permissions: [permissions[0]],
      },
    ]);

    await this.userRepository.save([
      {
        username: 'zhangsan',
        password: md5('111111'),
        email: 'xxx@xx.com',
        is_admin: true,
        nick_name: '张三',
        phone_number: '13233323333',
        roles: [roles[0]],
      },
      {
        username: 'lisi',
        password: md5('222222'),
        email: 'yy@yy.com',
        nick_name: '李四',
        roles: [roles[1]],
      },
    ]);
  }
  async login(user: LoginUserDto, isAdmin: boolean = false) {
    const findUser = await this.userRepository.findOne({
      where: {
        username: user.username,
        is_admin: isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    if (!findUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    if (findUser.password !== md5(user.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const roles = findUser.roles.map((role) => role.name);
    const permissions = this.extractPermissions(findUser.roles);
    const vo = new LoginUserVO();
    vo.userInfo = {
      id: findUser.id,
      username: findUser.username,
      nick_name: findUser.nick_name,
      email: findUser.email,
      avatar: findUser.avatar,
      phone_number: findUser.phone_number,
      is_admin: findUser.is_admin,
      is_frozen: findUser.is_frozen,
      create_time: findUser.create_time,
      roles,
      permissions,
    };
    vo.accessToken = this.generateAccessToken({
      id: findUser.id,
      username: findUser.username,
      roles,
      permissions,
    });
    vo.refreshToken = this.generateRefreshToken(findUser.id);
    return vo;
  }
  async refreshToken(refreshToken: string) {
    try {
      const { id } = this.jwtService.verify<{ id: number }>(refreshToken);
      const user = await this.findUserById(id);
      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user.id);
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
  private extractPermissions(roles: Role[]): string[] {
    return roles.reduce((arr: string[], item: Role) => {
      item.permissions.forEach((permission: Permission) => {
        if (arr.indexOf(permission.code) === -1) {
          arr.push(permission.code);
        }
      });
      return arr;
    }, []);
  }
  private generateAccessToken(user: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
  }): string {
    return this.jwtService.sign(
      {
        id: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      },
      {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRES_TIME',
        ),
      },
    );
  }
  private generateRefreshToken(userId: number): string {
    return this.jwtService.sign(
      { id: userId },
      {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRES_TIME',
        ),
      },
    );
  }
  async findUserById(id: number) {
    const findUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!findUser) {
      throw new UnauthorizedException('用户不存在');
    }
    const roles = findUser.roles.map((role) => role.name);
    const permissions = this.extractPermissions(findUser.roles);
    return {
      id: findUser.id,
      username: findUser.username,
      nick_name: findUser.nick_name,
      email: findUser.email,
      avatar: findUser.avatar,
      phone_number: findUser.phone_number,
      is_admin: findUser.is_admin,
      is_frozen: findUser.is_frozen,
      create_time: findUser.create_time,
      roles,
      permissions,
    };
  }
}
