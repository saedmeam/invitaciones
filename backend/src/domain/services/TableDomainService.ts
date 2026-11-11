import { EventTableEntity, SeatingSummaryDto, TableShape } from '../entities/Table';
import { GuestGroupEntity } from '../entities/Guest';
import { AppError } from '../../shared/errors/AppError';

export class TableDomainService {
  static findNextFreeSeat(table: EventTableEntity, occupiedSeats: Set<number>): number {
    for (let seat = 1; seat <= table.capacity; seat += 1) {
      if (!occupiedSeats.has(seat)) {
        return seat;
      }
    }
    throw new AppError(
      `La mesa "${table.name}" alcanzó su capacidad máxima (${table.capacity} puestos)`,
      409,
      'TABLE_CAPACITY_EXCEEDED'
    );
  }

  static validateAssignment(params: {
    table: EventTableEntity;
    incomingCount: number;
    alreadyInSameTableCount: number;
    requestedSeatNumber?: number | null;
    memberAttending: boolean | null;
  }) {
    if (params.memberAttending !== true) {
      throw new AppError(
        'Solo los invitados que confirmaron asistencia pueden ubicarse en una mesa',
        400,
        'MEMBER_NOT_CONFIRMED'
      );
    }

    const effectiveNew = params.incomingCount - params.alreadyInSameTableCount;
    if (params.table.members.length + effectiveNew > params.table.capacity) {
      throw new AppError(
        `La mesa "${params.table.name}" no tiene suficientes cupos libres (${params.table.members.length}/${params.table.capacity})`,
        409,
        'TABLE_CAPACITY_EXCEEDED'
      );
    }

    if (params.requestedSeatNumber !== undefined && params.requestedSeatNumber !== null) {
      if (
        params.requestedSeatNumber < 1 ||
        params.requestedSeatNumber > params.table.capacity
      ) {
        throw new AppError(
          `El número de puesto debe estar entre 1 y ${params.table.capacity}`,
          400,
          'INVALID_SEAT_NUMBER'
        );
      }
      const seatBusy = params.table.members.some(
        (m) => m.seatNumber === params.requestedSeatNumber
      );
      if (seatBusy) {
        throw new AppError(
          `El puesto #${params.requestedSeatNumber} ya está ocupado en ${params.table.name}`,
          409,
          'SEAT_ALREADY_TAKEN'
        );
      }
    }
  }

  static computeSeatingSummary(
    eventDate: Date,
    tables: EventTableEntity[],
    groups: GuestGroupEntity[]
  ): SeatingSummaryDto {
    let totalConfirmed = 0;
    let totalAssigned = 0;

    for (const group of groups) {
      for (const m of group.members) {
        if (m.attending === true) {
          totalConfirmed += 1;
          if (m.tableId) {
            totalAssigned += 1;
          }
        }
      }
    }

    const totalTableCapacity = tables.reduce((acc, t) => acc + t.capacity, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / msPerDay);

    return {
      totalConfirmed,
      totalAssigned,
      unassignedConfirmed: Math.max(0, totalConfirmed - totalAssigned),
      totalTableCapacity,
      daysUntilEvent,
      isSeatingWindowOpen: daysUntilEvent <= 10,
    };
  }

  static normalizeShape(shape?: string): TableShape {
    if (shape === 'RECTANGULAR' || shape === 'HEAD') return shape;
    return 'ROUND';
  }
}
