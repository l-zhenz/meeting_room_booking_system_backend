export function generateCodeTemplate(
  code: string,
  expireMinutes: number = 5,
): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>会议室预定系统 - 验证码</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 24px;
        }
        .content {
          padding: 20px 0;
        }
        .content p {
          margin-bottom: 15px;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #3498db;
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 6px;
          margin: 20px 0;
          letter-spacing: 4px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>会议室预定系统</h1>
        </div>
        <div class="content">
          <p>尊敬的用户：</p>
          <p>您正在使用邮箱验证码功能，您的验证码如下：</p>
          <div class="code">${code}</div>
          <p>请在 ${expireMinutes} 分钟内使用此验证码，过期将自动失效。</p>
          <p>如果您未发起此操作，请忽略此邮件。</p>
          <p>感谢您使用会议室预定系统！</p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿直接回复</p>
          <p>© ${new Date().getFullYear()} 会议室预定系统</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
