import nodemailer from 'nodemailer';
import { IEmailProvider, SmtpConfigDto } from '../../domain/ports/Providers';

export class NodemailerEmailProvider implements IEmailProvider {
  constructor(
    private readonly defaultGmailUser: string,
    private readonly defaultGmailAppPassword: string,
    private readonly defaultFromName: string
  ) {}

  isConfigured(customSmtp?: SmtpConfigDto | null): boolean {
    if (customSmtp?.user?.trim() && customSmtp?.pass?.trim()) {
      return true;
    }
    return Boolean(this.defaultGmailUser.trim() && this.defaultGmailAppPassword.trim());
  }

  async sendHtml(params: {
    to: string;
    subject: string;
    html: string;
    icsContent?: string;
    smtpConfig?: SmtpConfigDto | null;
  }): Promise<{ ok: boolean; error?: string }> {
    const user = params.smtpConfig?.user?.trim() || this.defaultGmailUser.trim();
    const pass = (params.smtpConfig?.pass || this.defaultGmailAppPassword).replace(/\s+/g, '');
    const fromName =
      params.smtpConfig?.fromName?.trim() || this.defaultFromName || 'Invitaciones de Boda';
    const host = params.smtpConfig?.host?.trim() || 'smtp.gmail.com';
    const port = params.smtpConfig?.port || (host.includes('gmail.com') ? 465 : 587);
    const secure =
      params.smtpConfig?.secure !== undefined
        ? params.smtpConfig.secure
        : port === 465;

    if (!user || !pass) {
      return {
        ok: false,
        error:
          'Servidor de correo no configurado. Ingresa los datos SMTP de esta boda o define GMAIL_USER y GMAIL_APP_PASSWORD en backend/.env.',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${user}>`,
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
        error: error instanceof Error ? error.message : 'Error al enviar correo via SMTP',
      };
    }
  }
}
