import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { generateCodeTemplate } from './templates/code.template';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
    this.fromAddress =
      this.configService.get<string>('EMAIL_USER') || '你的邮箱地址';
  }

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    await this.transporter.sendMail({
      from: {
        name: '会议室预定系统',
        address: this.fromAddress,
      },
      to,
      subject,
      html,
    });
  }

  async sendCodeEmail(to: string, code: string, expireMinutes: number = 5) {
    const html = generateCodeTemplate(code, expireMinutes);
    await this.sendMail({
      to,
      subject: '系统验证码',
      html,
    });
  }
}
