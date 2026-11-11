import nodemailer from 'nodemailer';
import { IEmailProvider } from '../../domain/ports/Providers';

export class NodemailerEmailProvider implements IEmailProvider {
  constructor(
    private readonly gmailUser: string,
    private readonly gmailAppPassword: string,
    private readonly fromName: string
  ) {}

  isConfigured(): boolean {
    return Boolean(this.gmailUser.trim() && this.gmailAppPassword.trim());
  }

  async sendHtml(params: {
    to: string;
    subject: string;
    html: string;
    icsContent?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error:
          'Gmail SMTP no configurado. Define GMAIL_USER y GMAIL_APP_PASSWORD en backend/.env.',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.gmailUser,
          pass: this.gmailAppPassword,
        },
      });

      await transporter.sendMail({
        from: `"${this.fromName}" <${this.gmailUser}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.icsContent
          ? {
              attachments: [
                {
                  filename: 'invitacion-boda.ics',
                  content: params.icsContent,
                  contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
                },
              ],
            }
          : {}),
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Error al enviar correo via Gmail SMTP',
      };
    }
  }
}
