import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GuestGroupEntity, RsvpStatsDto, RsvpStatus } from '../../domain/entities/Guest';
import { IEventRepository, IGuestRepository } from '../../domain/ports/Repositories';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';
import { AppError } from '../../shared/errors/AppError';
import { AuthActor, ensureEventAccess } from '../helpers/AccessControlHelper';

export interface CreateGuestDto {
  groupName: string;
  category?: string;
  email?: string | null;
  phone?: string | null;
  maxGuests: number;
  memberNames?: string[];
}

export interface UpdateGuestDto extends Partial<CreateGuestDto> {
  guestMessage?: string | null;
  members?: Array<{
    id?: string;
    fullName: string;
    isPrimary: boolean;
    isCompanionSlot: boolean;
    attending?: boolean | null;
    tableId?: string | null;
    seatNumber?: number | null;
  }>;
}

export class GuestUseCases {
  constructor(
    private readonly guestRepo: IGuestRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  private generateSecureToken(): string {
    return crypto.randomBytes(12).toString('hex');
  }

  private buildMembersFromSlots(groupName: string, maxGuests: number, memberNames?: string[]) {
    const total = Math.max(1, Math.min(20, maxGuests));
    const result: Array<{ fullName: string; isPrimary: boolean; isCompanionSlot: boolean }> = [];
    for (let i = 0; i < total; i += 1) {
      const providedName = memberNames?.[i]?.trim();
      const defaultName = i === 0 ? groupName.trim() : `Acompañante ${total > 2 ? i : ''}`.trim();
      result.push({
        fullName: providedName || defaultName,
        isPrimary: i === 0,
        isCompanionSlot: i > 0,
      });
    }
    return result;
  }

  async listByEvent(eventId: string, actor: AuthActor): Promise<GuestGroupEntity[]> {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    return this.guestRepo.findByEvent(eventId);
  }

  async getStats(eventId: string, actor: AuthActor): Promise<RsvpStatsDto> {
    const groups = await this.listByEvent(eventId, actor);
    return RsvpDomainService.computeStats(groups);
  }

  async create(eventId: string, actor: AuthActor, dto: CreateGuestDto): Promise<GuestGroupEntity> {
    await ensureEventAccess(this.eventRepo, eventId, actor);

    const maxGuests = Math.max(1, Math.min(20, Number(dto.maxGuests) || 1));
    const members = this.buildMembersFromSlots(dto.groupName, maxGuests, dto.memberNames);

    return this.guestRepo.create({
      eventId,
      token: this.generateSecureToken(),
      groupName: dto.groupName.trim(),
      category: dto.category?.trim() || 'General',
      email: dto.email?.trim() || null,
      phone: dto.phone ? RsvpDomainService.normalizePhone(dto.phone) : null,
      maxGuests,
      members,
    });
  }

  async update(
    eventId: string,
    groupId: string,
    actor: AuthActor,
    dto: UpdateGuestDto
  ): Promise<GuestGroupEntity> {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const existing = await this.guestRepo.findById(groupId);
    if (!existing || existing.eventId !== eventId) {
      throw new AppError('Invitado no encontrado', 404, 'NOT_FOUND');
    }

    let nextMembers = dto.members;
    if (!nextMembers && dto.maxGuests !== undefined && dto.maxGuests !== existing.maxGuests) {
      const max = Math.max(1, Math.min(20, dto.maxGuests));
      const base = existing.members.slice(0, max);
      while (base.length < max) {
        base.push({
          id: '',
          groupId: existing.id,
          fullName: `Acompañante ${max > 2 ? base.length : ''}`.trim(),
          isPrimary: base.length === 0,
          isCompanionSlot: base.length > 0,
          attending: null,
          tableId: null,
          seatNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      nextMembers = base.map((m) => ({
        id: m.id || undefined,
        fullName: m.fullName,
        isPrimary: m.isPrimary,
        isCompanionSlot: m.isCompanionSlot,
        attending: m.attending,
        tableId: m.tableId,
        seatNumber: m.seatNumber,
      }));
    }

    let nextRsvpStatus: RsvpStatus | undefined;
    if (nextMembers && nextMembers.length > 0) {
      const answered = nextMembers.filter((m) => m.attending !== null && m.attending !== undefined);
      if (answered.length === 0) {
        nextRsvpStatus = existing.viewedAt ? 'VIEWED' : 'PENDING';
      } else {
        const yesCount = nextMembers.filter((m) => m.attending === true).length;
        const noCount = nextMembers.filter((m) => m.attending === false).length;
        if (yesCount === nextMembers.length) nextRsvpStatus = 'CONFIRMED';
        else if (noCount === nextMembers.length) nextRsvpStatus = 'DECLINED';
        else nextRsvpStatus = 'PARTIAL';
      }
    }

    const effectiveMaxGuests =
      dto.maxGuests !== undefined
        ? Math.max(1, Math.min(20, Number(dto.maxGuests)))
        : nextMembers
          ? nextMembers.length
          : undefined;

    return this.guestRepo.update(groupId, {
      groupName: dto.groupName?.trim(),
      category: dto.category?.trim(),
      email: dto.email === undefined ? undefined : dto.email?.trim() || null,
      phone:
        dto.phone === undefined
          ? undefined
          : dto.phone
            ? RsvpDomainService.normalizePhone(dto.phone)
            : null,
      maxGuests: effectiveMaxGuests,
      rsvpStatus: nextRsvpStatus,
      guestMessage:
        dto.guestMessage === undefined ? undefined : dto.guestMessage?.trim() || null,
      members: nextMembers,
    });
  }

  async delete(eventId: string, groupId: string, actor: AuthActor): Promise<void> {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const existing = await this.guestRepo.findById(groupId);
    if (!existing || existing.eventId !== eventId) {
      throw new AppError('Invitado no encontrado', 404, 'NOT_FOUND');
    }
    await this.guestRepo.delete(groupId);
  }

  async importFromExcel(
    eventId: string,
    actor: AuthActor,
    fileBuffer: Buffer
  ): Promise<{ totalRows: number; imported: number; errors: Array<{ row: number; reason: string }> }> {
    await ensureEventAccess(this.eventRepo, eventId, actor);

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new AppError('El archivo Excel no contiene hojas', 400, 'EMPTY_WORKBOOK');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName]);
    let imported = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const rowNum = i + 2;
      const groupName = String(r.nombre || r.Nombre || r.groupName || r.Grupo || '').trim();
      if (!groupName) {
        errors.push({ row: rowNum, reason: 'Falta columna nombre o groupName' });
        continue;
      }

      const rawCupos = Number(r.cupos || r.Cupos || r.maxGuests || 1);
      const maxGuests = Number.isFinite(rawCupos) ? Math.max(1, Math.min(20, rawCupos)) : 1;
      const category = String(r.categoria || r.Categoria || r.category || 'General').trim();
      const email = String(r.email || r.Email || r.correo || r.Correo || '').trim() || null;
      const rawPhone = String(r.telefono || r.Telefono || r.whatsapp || r.WhatsApp || r.phone || '').trim();
      const phone = rawPhone ? RsvpDomainService.normalizePhone(rawPhone) : null;

      const companionName = String(r.acompanante || r.Acompanante || '').trim();
      const memberNames = companionName ? [groupName, companionName] : undefined;

      await this.guestRepo.create({
        eventId,
        token: this.generateSecureToken(),
        groupName,
        category,
        email,
        phone,
        maxGuests,
        members: this.buildMembersFromSlots(groupName, maxGuests, memberNames),
      });
      imported += 1;
    }

    return { totalRows: rows.length, imported, errors };
  }

  async exportReport(
    eventId: string,
    actor: AuthActor,
    format: 'EXCEL' | 'PDF'
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    const groups = await this.guestRepo.findByEvent(eventId);

    const rows = groups.map((g) => {
      const confirmedCount = g.members.filter((m) => m.attending === true).length;
      const declinedCount = g.members.filter((m) => m.attending === false).length;
      const membersSummary = g.members
        .map((m) => {
          const state = m.attending === true ? 'Asiste' : m.attending === false ? 'No asiste' : 'Pendiente';
          const seat = m.tableName ? ` - ${m.tableName}${m.seatNumber ? ` #${m.seatNumber}` : ''}` : '';
          return `${m.fullName} (${state}${seat})`;
        })
        .join('; ');

      return {
        Grupo: RsvpDomainService.sanitizeSpreadsheetCell(g.groupName),
        Categoria: RsvpDomainService.sanitizeSpreadsheetCell(g.category),
        Estado: g.rsvpStatus,
        Cupos: g.maxGuests,
        Confirmados: confirmedCount,
        Rechazados: declinedCount,
        Telefono: RsvpDomainService.sanitizeSpreadsheetCell(g.phone || ''),
        Email: RsvpDomainService.sanitizeSpreadsheetCell(g.email || ''),
        Integrantes: RsvpDomainService.sanitizeSpreadsheetCell(membersSummary),
        Mensaje: RsvpDomainService.sanitizeSpreadsheetCell(g.guestMessage || ''),
      };
    });

    if (format === 'EXCEL') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Invitados');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: `invitados-${event.slug}.xlsx`,
      };
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Reporte de Invitados - ${event.partnerOneName} & ${event.partnerTwoName}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['Grupo', 'Categoría', 'Estado', 'Cupos', 'Confirmados', 'Integrantes', 'Mensaje']],
      body: rows.map((r) => [
        r.Grupo,
        r.Categoria,
        r.Estado,
        String(r.Cupos),
        String(r.Confirmados),
        r.Integrantes,
        r.Mensaje,
      ]),
      styles: { fontSize: 8 },
    });

    const arrayBuf = doc.output('arraybuffer');
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: 'application/pdf',
      fileName: `invitados-${event.slug}.pdf`,
    };
  }
}
