import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableShape } from '../../domain/entities/Table';
import {
  IEventRepository,
  IGuestRepository,
  ITableRepository,
} from '../../domain/ports/Repositories';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';
import { TableDomainService } from '../../domain/services/TableDomainService';
import { AppError } from '../../shared/errors/AppError';
import { AuthActor, ensureEventAccess } from '../helpers/AccessControlHelper';

export interface CreateTableDto {
  name: string;
  capacity?: number;
  shape?: TableShape;
  zone?: string;
}

export interface UpdateTableDto extends Partial<CreateTableDto> {
  sortOrder?: number;
}

export class TableUseCases {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly tableRepo: ITableRepository,
    private readonly guestRepo: IGuestRepository
  ) {}

  async listSeating(eventId: string, actor: AuthActor) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    const [tables, groups] = await Promise.all([
      this.tableRepo.findByEvent(eventId),
      this.guestRepo.findByEvent(eventId),
    ]);

    const summary = TableDomainService.computeSeatingSummary(event.eventDate, tables, groups);

    const unassignedConfirmed = groups.flatMap((g) =>
      g.members
        .filter((m) => m.attending === true && !m.tableId)
        .map((m) => ({
          id: m.id,
          groupId: g.id,
          groupName: g.groupName,
          category: g.category,
          fullName: m.fullName,
          isPrimary: m.isPrimary,
          isCompanionSlot: m.isCompanionSlot,
        }))
    );

    return {
      tables,
      summary,
      unassignedConfirmed,
    };
  }

  private ensureSeatingAllowed(event: { organizationType?: 'DIRECT' | 'PLANNER' | null; themeConfig?: { planTier?: string } }) {
    const isClassicDirect =
      event.organizationType !== 'PLANNER' && event.themeConfig?.planTier === 'CLASSIC';
    if (isClassicDirect) {
      throw new AppError(
        'La distribución de mesas (Seating Plan) está incluida en el Plan Premium.',
        403,
        'PLAN_RESTRICTION'
      );
    }
  }

  async createTable(eventId: string, actor: AuthActor, dto: CreateTableDto) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    this.ensureSeatingAllowed(event);
    const existing = await this.tableRepo.findByEvent(eventId);
    const capacity = Math.max(1, Math.min(30, Number(dto.capacity) || 8));

    return this.tableRepo.create({
      eventId,
      name: dto.name.trim(),
      capacity,
      shape: TableDomainService.normalizeShape(dto.shape),
      zone: dto.zone?.trim() || 'Salón Principal',
      sortOrder: existing.length + 1,
    });
  }

  async updateTable(eventId: string, tableId: string, actor: AuthActor, dto: UpdateTableDto) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const table = await this.tableRepo.findById(tableId);
    if (!table || table.eventId !== eventId) {
      throw new AppError('Mesa no encontrada', 404, 'NOT_FOUND');
    }

    if (dto.capacity !== undefined && dto.capacity < table.members.length) {
      throw new AppError(
        `No puedes reducir la capacidad a ${dto.capacity} porque hay ${table.members.length} invitados asignados`,
        409,
        'TABLE_CAPACITY_EXCEEDED'
      );
    }

    return this.tableRepo.update(tableId, {
      name: dto.name?.trim(),
      capacity: dto.capacity ? Math.max(1, Math.min(30, dto.capacity)) : undefined,
      shape: dto.shape ? TableDomainService.normalizeShape(dto.shape) : undefined,
      zone: dto.zone?.trim(),
      sortOrder: dto.sortOrder,
    });
  }

  async deleteTable(eventId: string, tableId: string, actor: AuthActor) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const table = await this.tableRepo.findById(tableId);
    if (!table || table.eventId !== eventId) {
      throw new AppError('Mesa no encontrada', 404, 'NOT_FOUND');
    }
    await this.tableRepo.delete(tableId);
  }

  async assignToTable(
    eventId: string,
    tableId: string,
    actor: AuthActor,
    dto: { memberId?: string; memberIds?: string[]; groupId?: string; seatNumber?: number | null }
  ) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    this.ensureSeatingAllowed(event);
    const table = await this.tableRepo.findById(tableId);
    if (!table || table.eventId !== eventId) {
      throw new AppError('Mesa no encontrada', 404, 'NOT_FOUND');
    }

    const occupiedSeats = new Set<number>(
      table.members.map((m) => m.seatNumber).filter((s): s is number => typeof s === 'number')
    );

    if (dto.memberIds && dto.memberIds.length > 0) {
      const uniqueIds = Array.from(new Set(dto.memberIds));
      const membersToAssign = [];
      for (const mId of uniqueIds) {
        const member = await this.guestRepo.findMemberById(mId);
        if (!member || member.eventId !== eventId) {
          throw new AppError('Uno de los invitados no pertenece a este evento', 404, 'NOT_FOUND');
        }
        if (member.attending !== true) {
          throw new AppError(
            `El invitado "${member.fullName}" aún no confirmó asistencia`,
            400,
            'MEMBER_NOT_CONFIRMED'
          );
        }
        membersToAssign.push(member);
      }

      const alreadyInSameTableCount = membersToAssign.filter((m) => m.tableId === table.id).length;
      TableDomainService.validateAssignment({
        table,
        incomingCount: membersToAssign.length,
        alreadyInSameTableCount,
        memberAttending: true,
      });

      for (const m of membersToAssign) {
        if (m.tableId === table.id && m.seatNumber) continue;
        const nextSeat = TableDomainService.findNextFreeSeat(table, occupiedSeats);
        occupiedSeats.add(nextSeat);
        await this.tableRepo.assignMember(m.id, table.id, nextSeat);
      }

      return this.tableRepo.findById(table.id);
    }

    if (dto.memberId) {
      const member = await this.guestRepo.findMemberById(dto.memberId);
      if (!member || member.eventId !== eventId) {
        throw new AppError('Invitado no encontrado en este evento', 404, 'NOT_FOUND');
      }
      const alreadyInThisTable = member.tableId === table.id ? 1 : 0;
      TableDomainService.validateAssignment({
        table,
        incomingCount: 1,
        alreadyInSameTableCount: alreadyInThisTable,
        requestedSeatNumber: dto.seatNumber,
        memberAttending: member.attending,
      });

      const seat =
        dto.seatNumber ??
        (alreadyInThisTable && member.seatNumber ? member.seatNumber : TableDomainService.findNextFreeSeat(table, occupiedSeats));

      await this.tableRepo.assignMember(member.id, table.id, seat);
      return this.tableRepo.findById(table.id);
    }

    if (dto.groupId) {
      const group = await this.guestRepo.findById(dto.groupId);
      if (!group || group.eventId !== eventId) {
        throw new AppError('Grupo invitado no encontrado', 404, 'NOT_FOUND');
      }
      const confirmedMembers = group.members.filter((m) => m.attending === true);
      if (confirmedMembers.length === 0) {
        throw new AppError(
          'Este grupo no tiene integrantes confirmados para asignar a una mesa',
          400,
          'MEMBER_NOT_CONFIRMED'
        );
      }

      const alreadyInSameTableCount = confirmedMembers.filter(
        (m) => m.tableId === table.id
      ).length;
      TableDomainService.validateAssignment({
        table,
        incomingCount: confirmedMembers.length,
        alreadyInSameTableCount,
        memberAttending: true,
      });

      for (const m of confirmedMembers) {
        if (m.tableId === table.id && m.seatNumber) continue;
        const nextSeat = TableDomainService.findNextFreeSeat(table, occupiedSeats);
        occupiedSeats.add(nextSeat);
        await this.tableRepo.assignMember(m.id, table.id, nextSeat);
      }

      return this.tableRepo.findById(table.id);
    }

    throw new AppError('Debes especificar memberId o groupId', 400, 'INVALID_ASSIGNMENT');
  }

  async unassignMember(eventId: string, actor: AuthActor, memberId: string) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const member = await this.guestRepo.findMemberById(memberId);
    if (!member || member.eventId !== eventId) {
      throw new AppError('Invitado no encontrado en este evento', 404, 'NOT_FOUND');
    }
    await this.tableRepo.assignMember(memberId, null, null);
  }

  async exportSeatingReport(eventId: string, actor: AuthActor, format: 'EXCEL' | 'PDF') {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    const tables = await this.tableRepo.findByEvent(eventId);

    const rows = tables.flatMap((t) => {
      if (t.members.length === 0) {
        return [
          {
            Mesa: RsvpDomainService.sanitizeSpreadsheetCell(t.name),
            Zona: RsvpDomainService.sanitizeSpreadsheetCell(t.zone),
            Capacidad: t.capacity,
            Puesto: '-',
            Invitado: '(Sin asignar)',
            Grupo: '-',
            Categoria: '-',
          },
        ];
      }
      return t.members.map((m) => ({
        Mesa: RsvpDomainService.sanitizeSpreadsheetCell(t.name),
        Zona: RsvpDomainService.sanitizeSpreadsheetCell(t.zone),
        Capacidad: t.capacity,
        Puesto: m.seatNumber ? String(m.seatNumber) : '-',
        Invitado: RsvpDomainService.sanitizeSpreadsheetCell(m.fullName),
        Grupo: RsvpDomainService.sanitizeSpreadsheetCell(m.groupName),
        Categoria: RsvpDomainService.sanitizeSpreadsheetCell(m.category),
      }));
    });

    if (format === 'EXCEL') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Mesas y Puestos');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: `mesas-${event.slug}.xlsx`,
      };
    }

    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFontSize(14);
    doc.text(`Distribución de Mesas - ${event.partnerOneName} & ${event.partnerTwoName}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['Mesa', 'Zona', 'Puesto', 'Invitado', 'Grupo / Familia', 'Categoría']],
      body: rows.map((r) => [r.Mesa, r.Zona, r.Puesto, r.Invitado, r.Grupo, r.Categoria]),
      styles: { fontSize: 9 },
    });

    return {
      buffer: Buffer.from(doc.output('arraybuffer')),
      mimeType: 'application/pdf',
      fileName: `mesas-${event.slug}.pdf`,
    };
  }
}
