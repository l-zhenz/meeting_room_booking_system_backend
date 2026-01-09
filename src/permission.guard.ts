import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * 权限守卫类，用于检查用户是否具有访问特定接口的权限
 * 实现了 CanActivate 接口，用于 NestJS 的路由守卫机制
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  /**
   * 注入 Reflector 服务，用于获取路由处理程序和控制器上的元数据
   */
  @Inject(Reflector)
  private reflector: Reflector;

  /**
   * 检查用户是否具有访问权限的方法
   * @param context 执行上下文，包含请求和响应信息
   * @returns 布尔值，表示是否允许请求继续执行
   */
  canActivate(context: ExecutionContext): boolean {
    // 从执行上下文中获取 HTTP 请求对象
    const request: Request = context.switchToHttp().getRequest();

    // 如果请求中没有用户信息，直接允许访问（通常会被 AuthGuard 拦截）
    if (!request.user) {
      return true;
    }

    // 从用户信息中获取权限列表
    const permissions = request.user.permissions;

    // 使用 Reflector 获取路由处理程序和控制器上定义的 "require-permission" 元数据
    // getAllAndOverride 方法会优先使用方法上的元数据，如果没有则使用类上的元数据
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );

    // 如果没有定义所需权限，直接允许访问
    if (!requiredPermissions) {
      return true;
    }

    // 遍历所需权限列表，检查用户是否拥有所有所需权限
    for (let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i];
      // 检查用户权限列表中是否包含当前所需权限
      const found = permissions.find((item) => item.code === curPermission);
      // 如果用户缺少当前所需权限，抛出未授权异常
      if (!found) {
        throw new UnauthorizedException('您没有访问该接口的权限');
      }
    }

    // 如果用户拥有所有所需权限，允许访问
    return true;
  }
}
