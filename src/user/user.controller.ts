import { Controller, Post, Body, Get, Query, Inject } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';

@Controller('user')
export class UserController {
  @Inject(UserService)
  private readonly userService: UserService;

  @Get('captcha')
  getCaptcha(@Query('email') email: string) {
    if (!email) {
      throw new Error('请输入邮箱');
    }
    return this.userService.getCaptcha(email);
  }
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.register(registerUserDto);
  }
  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto, false);
  }
  @Post('admin/login')
  adminLogin(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto, true);
  }
  @Get('refresh')
  refresh(@Query('refreshToken') refreshToken: string) {
    return this.userService.refreshToken(refreshToken);
  }
}
