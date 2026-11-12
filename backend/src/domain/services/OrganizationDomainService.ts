import { OrganizationEntity } from '../entities/Organization';
import { AppError } from '../../shared/errors/AppError';

export class OrganizationDomainService {
  static ensureActive(org: OrganizationEntity | null) {
    if (!org || !org.isActive) {
      throw new AppError(
        'La cuenta de esta empresa está suspendida o no existe. Contacta al administrador.',
        403,
        'ORG_SUSPENDED'
      );
    }
  }

  static ensureCanCreateEvent(org: OrganizationEntity) {
    OrganizationDomainService.ensureActive(org);
    if (org.maxEvents > 0 && org.eventsCount >= org.maxEvents) {
      throw new AppError(
        `Tu empresa alcanzó el límite de eventos contratados (${org.eventsCount}/${org.maxEvents}).`,
        409,
        'ORG_EVENT_LIMIT_REACHED'
      );
    }
  }
}
