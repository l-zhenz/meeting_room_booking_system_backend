import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 定义用户对象的类型
type UserWithInfo = Record<string, any>;

export const RequireLogin = () => SetMetadata('require-login', true);

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      return null;
    }
    const user = request.user as UserWithInfo;
    // 添加运行时检查确保安全性
    if (data && typeof user === 'object' && user !== null) {
      return user[data];
    }
    return request.user;
  },
);
