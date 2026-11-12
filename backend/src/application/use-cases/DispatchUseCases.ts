import { DispatchChannel } from '../../domain/entities/MediaAndDispatch';
import { EventEntity } from '../../domain/entities/Event';
import { GuestGroupEntity } from '../../domain/entities/Guest';
import { IEmailProvider, IWhatsAppProvider } from '../../domain/ports/Providers';
import {
  IDispatchRepository,
  IEventRepository,
  IGuestRepository,
} from '../../domain/ports/Repositories';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';
import { AuthActor, ensureEventAccess } from '../helpers/AccessControlHelper';

export interface SendDispatchDto {
  channel: DispatchChannel;
  groupIds?: string[];
  onlyPending?: boolean;
  onlyConfirmed?: boolean;
  customMessage?: string;
  subject?: string;
}

export class DispatchUseCases {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly guestRepo: IGuestRepository,
    private readonly dispatchRepo: IDispatchRepository,
    private readonly whatsappProvider: IWhatsAppProvider,
    private readonly emailProvider: IEmailProvider,
    private readonly frontendUrl: string,
    private readonly minDelayMs: number,
    private readonly maxDelayMs: number
  ) {}

  renderTemplate(
    template: string,
    event: EventEntity,
    group: GuestGroupEntity,
    inviteUrl: string
  ): string {
    const dateStr = event.eventDate.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const confirmedMembers = group.members.filter((m) => m.attending === true);
    const confirmedCount = confirmedMembers.length;
    const attendeesText =
      confirmedMembers.length > 0
        ? confirmedMembers.map((m) => m.fullName).join(', ')
        : group.groupName;

    const tablesText =
      confirmedMembers.length > 0
        ? confirmedMembers
            .map((m) => {
              const tableLabel = m.tableName
                ? `${m.tableName}${m.seatNumber ? ` (Puesto #${m.seatNumber})` : ''}`
                : 'Por confirmar en recepción';
              return `• ${m.fullName}: ${tableLabel}`;
            })
            .join('\n')
        : '• Por confirmar';

    return template
      .replace(/\{nombre\}/gi, group.groupName)
      .replace(/\{cupos\}/gi, String(group.maxGuests))
      .replace(/\{cupos_confirmados\}/gi, String(confirmedCount))
      .replace(/\{asistentes\}/gi, attendeesText)
      .replace(/\{mesas\}/gi, tablesText)
      .replace(/\{link\}/gi, inviteUrl)
      .replace(/\{novios\}/gi, `${event.partnerOneName} & ${event.partnerTwoName}`)
      .replace(/\{fecha\}/gi, dateStr)
      .replace(/\{ceremonia_hora\}/gi, event.ceremonyTime || '')
      .replace(/\{ceremonia_mapa\}/gi, event.ceremonyMapUrl || '')
      .replace(/\{recepcion_hora\}/gi, event.receptionTime || '')
      .replace(/\{recepcion_mapa\}/gi, event.receptionMapUrl || '');
  }

  private buildEmailHtml(event: EventEntity, group: GuestGroupEntity, inviteUrl: string, bodyText: string) {
    const dateStr = event.eventDate.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const safeBody = bodyText.replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#faf7f2;font-family:Georgia,serif;color:#292524;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e7dcc8;border-radius:16px;padding:36px;text-align:center;">
    <p style="letter-spacing:3px;text-transform:uppercase;font-size:12px;color:#b08d57;margin:0 0 12px;">Invitación de Matrimonio</p>
    <h1 style="font-size:28px;margin:0 0 8px;color:#1c1917;">${event.partnerOneName} &amp; ${event.partnerTwoName}</h1>
    <p style="font-size:14px;color:#78716c;margin:0 0 24px;">${dateStr}</p>
    <div style="text-align:left;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#44403c;background:#fcfaf6;padding:20px;border-radius:12px;margin-bottom:24px;">
      ${safeBody}
    </div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#57534e;margin-bottom:24px;">
      Invitación válida para <strong>${group.maxGuests} ${group.maxGuests === 1 ? 'persona' : 'personas'}</strong> (${group.groupName}).
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#b08d57;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;">
      Ver Invitación y Confirmar Asistencia
    </a>
  </div>
</body>
</html>`;
  }

  private async sleepRandom() {
    const span = Math.max(0, this.maxDelayMs - this.minDelayMs);
    const delay = this.minDelayMs + Math.floor(Math.random() * (span + 1));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async listLogs(eventId: string, actor: AuthActor) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    return this.dispatchRepo.findByEvent(eventId);
  }

  async sendBatch(eventId: string, actor: AuthActor, dto: SendDispatchDto) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    const allGroups = await this.guestRepo.findByEvent(eventId);

    let targets = allGroups;
    if (dto.groupIds && dto.groupIds.length > 0) {
      const idSet = new Set(dto.groupIds);
      targets = targets.filter((g) => idSet.has(g.id));
    }
    if (dto.onlyPending) {
      targets = targets.filter((g) => g.rsvpStatus === 'PENDING' || g.rsvpStatus === 'VIEWED');
    } else if (dto.onlyConfirmed) {
      targets = targets.filter((g) => g.rsvpStatus === 'CONFIRMED' || g.rsvpStatus === 'PARTIAL');
    }

    const defaultTemplate =
      'Hola {nombre}, con mucha alegría te invitamos al matrimonio de {novios} el {fecha}. Hemos reservado {cupos} cupo(s) para ustedes. Confirma aquí: {link}';
    const template = dto.customMessage?.trim() || defaultTemplate;
    const subject =
      dto.subject?.trim() ||
      `Invitación de Boda: ${event.partnerOneName} & ${event.partnerTwoName}`;

    const results: Array<{
      groupId: string;
      groupName: string;
      status: 'SENT' | 'FAILED';
      error?: string;
      fallbackUrl?: string;
    }> = [];

    for (let i = 0; i < targets.length; i += 1) {
      const group = targets[i];
      const inviteUrl = `${this.frontendUrl}/i/${group.token}`;
      const messageBody = this.renderTemplate(template, event, group, inviteUrl);
      const recipient = dto.channel === 'WHATSAPP' ? group.phone || '' : group.email || '';

      if (!recipient) {
        await this.dispatchRepo.create({
          eventId: event.id,
          groupId: group.id,
          channel: dto.channel,
          recipient: 'SIN_DATO',
          subject: dto.channel === 'EMAIL' ? subject : null,
          messageBody,
          status: 'FAILED',
          errorMessage:
            dto.channel === 'WHATSAPP' ? 'Invitado sin número de WhatsApp' : 'Invitado sin correo',
        });
        results.push({
          groupId: group.id,
          groupName: group.groupName,
          status: 'FAILED',
          error: 'Sin destinatario registrado',
        });
        continue;
      }

      const log = await this.dispatchRepo.create({
        eventId: event.id,
        groupId: group.id,
        channel: dto.channel,
        recipient,
        subject: dto.channel === 'EMAIL' ? subject : null,
        messageBody,
        status: 'QUEUED',
      });

      if (dto.channel === 'WHATSAPP') {
        const sendRes = await this.whatsappProvider.sendText(recipient, messageBody);
        if (sendRes.ok) {
          await this.dispatchRepo.updateStatus(log.id, 'SENT', null, new Date());
          results.push({
            groupId: group.id,
            groupName: group.groupName,
            status: 'SENT',
            fallbackUrl: sendRes.fallbackUrl,
          });
        } else {
          await this.dispatchRepo.updateStatus(log.id, 'FAILED', sendRes.error || 'Error envío WA');
          results.push({
            groupId: group.id,
            groupName: group.groupName,
            status: 'FAILED',
            error: sendRes.error,
            fallbackUrl: sendRes.fallbackUrl,
          });
        }
        if (i < targets.length - 1) {
          await this.sleepRandom();
        }
      } else {
        const html = this.buildEmailHtml(event, group, inviteUrl, messageBody);
        const icsContent = RsvpDomainService.buildIcsCalendar(event);
        const sendRes = await this.emailProvider.sendHtml({
          to: recipient,
          subject,
          html,
          icsContent,
        });
        if (sendRes.ok) {
          await this.dispatchRepo.updateStatus(log.id, 'SENT', null, new Date());
          results.push({ groupId: group.id, groupName: group.groupName, status: 'SENT' });
        } else {
          await this.dispatchRepo.updateStatus(log.id, 'FAILED', sendRes.error || 'Error envío Email');
          results.push({
            groupId: group.id,
            groupName: group.groupName,
            status: 'FAILED',
            error: sendRes.error,
          });
        }
      }
    }

    return {
      totalAttempted: targets.length,
      sent: results.filter((r) => r.status === 'SENT').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      results,
    };
  }
}
