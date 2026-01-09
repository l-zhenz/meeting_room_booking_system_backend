/**
 * 登录守卫
 * 用于验证用户是否已登录并持有有效的JWT令牌
 * 实现了CanActivate接口，用于保护需要登录才能访问的路由
 */
import {
  CanActivate, // 守卫接口，判断请求是否可以继续执行
  ExecutionContext, // 执行上下文，包含请求相关信息
  Inject, // 依赖注入装饰器
  Injectable, // 标记类为可注入的服务
  UnauthorizedException, // 未授权异常类
} from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // 用于获取路由元数据
import { JwtService } from '@nestjs/jwt'; // 用于验证JWT令牌
import { Observable } from 'rxjs'; // 处理异步操作的响应式编程类型
import { Request } from 'express'; // Express请求对象类型
import { Permission } from './user/entities/permission.entity'; // 权限实体类

/**
 * JWT令牌中包含的用户数据结构
 */
interface JwtUserData {
  id: number; // 用户ID
  username: string; // 用户名
  roles: string[]; // 用户角色数组
  permissions: Permission[]; // 用户权限数组
}

/**
 * 扩展Express的Request接口
 * 添加user属性，用于存储验证后的用户信息
 */
declare module 'express' {
  interface Request {
    user: JwtUserData; // 添加用户信息属性
  }
}

/**
 * 登录守卫类
 * 实现CanActivate接口，用于验证用户登录状态
 */
@Injectable()
export class LoginGuard implements CanActivate {
  /**
   * 注入Reflector服务
   * 用于获取路由上的元数据
   */
  @Inject()
  private reflector: Reflector;

  /**
   * 注入JwtService服务
   * 用于验证JWT令牌
   */
  @Inject()
  private jwtService: JwtService;

  /**
   * 验证请求是否可以继续执行
   * @param context 执行上下文
   * @returns boolean | Promise<boolean> | Observable<boolean> 验证结果
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 获取HTTP请求对象
    const request = context.switchToHttp().getRequest<Request>();

    // 检查路由是否需要登录验证
    // 从处理函数和控制器类中获取require-login元数据
    const requireLogin = this.reflector.getAllAndOverride<boolean>(
      'require-login',
      [context.getHandler(), context.getClass()],
    );

    // 如果不需要登录验证，直接通过
    if (!requireLogin) {
      return true;
    }

    // 获取请求头中的Authorization字段
    const authorization = request.headers.authorization;

    // 如果Authorization不存在，抛出未登录错误
    if (!authorization) {
      throw new Error('用户未登录');
    }

    try {
      // 从Authorization头中提取令牌
      // 格式通常为"Bearer {token}"，所以取第二个部分
      const token = authorization.split(' ')[1];

      // 验证JWT令牌并解析用户数据
      const data = this.jwtService.verify<JwtUserData>(token);

      // 将用户数据附加到请求对象
      request.user = {
        id: data.id,
        username: data.username,
        roles: data.roles,
        permissions: data.permissions,
      };

      // 验证成功，允许请求继续执行
      return true;
    } catch {
      // 验证失败，抛出未授权异常
      // 当令牌无效或过期时触发
      throw new UnauthorizedException('登录信息过期，请重新登录');
    }
  }
}
