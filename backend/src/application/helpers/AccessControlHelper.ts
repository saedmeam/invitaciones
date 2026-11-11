import { IEventRepository } from '../../domain/ports/Repositories';
import { AppError } from '../../shared/errors/AppError';

export interface AuthActor {
  userId: string;
  email: string;
  role: string;
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

  if (actor.role === 'COUPLE') {
    if (!actor.assignedEventId || actor.assignedEventId !== event.id) {
      throw new AppError('No tienes permisos para acceder a otro evento', 403, 'FORBIDDEN');
    }
    return event;
  }

  if (event.ownerId !== actor.userId) {
    throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
  }
  return event;
}

export function ensureSuperAdmin(actor: AuthActor) {
  if (actor.role !== 'SUPERADMIN') {
    throw new AppError('Esta acción requiere rol de administrador principal', 403, 'FORBIDDEN');
  }
}
