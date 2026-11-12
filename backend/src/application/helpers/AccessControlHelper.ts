import { IEventRepository } from '../../domain/ports/Repositories';
import { AppError } from '../../shared/errors/AppError';

export interface AuthActor {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;
  assignedEventId?: string | null;
}

export async function ensureEventAccess(
  eventRepo: IEventRepository,
  eventId: string,
  actor: AuthActor
) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
  }

  if (actor.role === 'SUPERADMIN') {
    return event;
  }

  if (actor.role === 'ORG_ADMIN') {
    if (!actor.organizationId || event.organizationId !== actor.organizationId) {
      throw new AppError(
        'No tienes permisos para acceder a eventos de otra empresa',
        403,
        'FORBIDDEN'
      );
    }
    return event;
  }

  if (actor.role === 'COUPLE') {
    if (!actor.assignedEventId || actor.assignedEventId !== event.id) {
      throw new AppError('No tienes permisos para acceder a otro evento', 403, 'FORBIDDEN');
    }
    return event;
  }

  throw new AppError('Rol sin permisos para acceder al evento', 403, 'FORBIDDEN');
}

export function ensureSuperAdmin(actor: AuthActor) {
  if (actor.role !== 'SUPERADMIN') {
    throw new AppError('Esta acción requiere rol de administrador principal', 403, 'FORBIDDEN');
  }
}

export function ensureCanManageEventsOrCouples(actor: AuthActor) {
  if (actor.role !== 'SUPERADMIN' && actor.role !== 'ORG_ADMIN') {
    throw new AppError('No tienes permisos para administrar eventos o accesos', 403, 'FORBIDDEN');
  }
}
