import { IGuestRepository } from '../../domain/ports/Repositories';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';
import { AppError } from '../../shared/errors/AppError';

export interface SubmitGroupRsvpDto {
  members: Array<{
    id: string;
    fullName: string;
    attending: boolean;
  }>;
  guestMessage?: string;
}

export class RsvpUseCases {
  constructor(private readonly guestRepo: IGuestRepository) {}

  async getByTokenAndTrackView(token: string) {
    const found = await this.guestRepo.findByToken(token);
    if (!found || !found.event.isActive) {
      throw new AppError('Invitación no encontrada o inactiva', 404, 'NOT_FOUND');
    }

    let group = found.group;
    if (group.rsvpStatus === 'PENDING') {
      group = await this.guestRepo.markViewed(group.id);
    }

    return {
      event: found.event,
      group,
    };
  }

  async submitByToken(token: string, dto: SubmitGroupRsvpDto) {
    const found = await this.guestRepo.findByToken(token);
    if (!found || !found.event.isActive) {
      throw new AppError('Invitación no encontrada o inactiva', 404, 'NOT_FOUND');
    }

    const { event, group } = found;
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      throw new AppError(
        'La fecha límite de confirmación ya ha finalizado',
        400,
        'RSVP_DEADLINE_PASSED'
      );
    }

    if (!dto.members || dto.members.length === 0) {
      throw new AppError('Debe indicar la asistencia de al menos un integrante', 400, 'EMPTY_MEMBERS');
    }

    const validMemberIds = new Set(group.members.map((m) => m.id));
    for (const item of dto.members) {
      if (!validMemberIds.has(item.id)) {
        throw new AppError('Integrante inválido para esta invitación', 400, 'INVALID_MEMBER');
      }
      if (item.attending && !item.fullName.trim()) {
        throw new AppError('Ingresa el nombre de cada asistente confirmado', 400, 'NAME_REQUIRED');
      }
    }

    const attendances = dto.members.map((m) => m.attending);
    const rsvpStatus = RsvpDomainService.computeGroupStatus(attendances);

    const updatedGroup = await this.guestRepo.submitRsvp({
      groupId: group.id,
      rsvpStatus,
      guestMessage: dto.guestMessage?.trim() || null,
      members: dto.members.map((m) => ({
        id: m.id,
        fullName: m.fullName.trim(),
        attending: m.attending,
      })),
    });

    return updatedGroup;
  }
}
