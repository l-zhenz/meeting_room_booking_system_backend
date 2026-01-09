import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(4, 50, { message: '用户名长度必须在4到50之间' })
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 50, { message: '密码长度必须在6到50之间' })
  password: string;

  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(4, 50, { message: '昵称长度必须在4到50之间' })
  nick_name: string;

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  // @IsNotEmpty({ message: '头像不能为空' })
  // avatar: string;

  // @IsNotEmpty({ message: '手机号不能为空' })
  // @IsPhoneNumber('CN', { message: '手机号格式不正确' })
  // phone_number: string;

  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string;
}
