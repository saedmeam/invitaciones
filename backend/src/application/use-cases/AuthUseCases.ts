import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  IAdminUserRepository,
  IEventRepository,
  IOrganizationRepository,
} from '../../domain/ports/Repositories';
import { OrganizationDomainService } from '../../domain/services/OrganizationDomainService';
import { AppError } from '../../shared/errors/AppError';
import {
  AuthActor,
  ensureCanManageEventsOrCouples,
  ensureEventAccess,
  ensureSuperAdmin,
} from '../helpers/AccessControlHelper';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  assignedEventId: string | null;
}

export class AuthUseCases {
  constructor(
    private readonly adminRepo: IAdminUserRepository,
    private readonly eventRepo: IEventRepository,
    private readonly orgRepo: IOrganizationRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string
  ) {}

  async login(email: string, password: string): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organizationId: string | null;
      organizationName: string | null;
      assignedEventId: string | null;
    };
  }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.adminRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
    }

    let organizationName = user.organizationName || null;
    if (user.role !== 'SUPERADMIN' && user.organizationId) {
      const org = await this.orgRepo.findById(user.organizationId);
      OrganizationDomainService.ensureActive(org);
      organizationName = org?.name || organizationName;
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || null,
      assignedEventId: user.assignedEventId || null,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || null,
        organizationName,
        assignedEventId: user.assignedEventId || null,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.adminRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    let orgInfo: { maxEvents: number; eventsCount: number } | null = null;
    if (user.organizationId) {
      const org = await this.orgRepo.findById(user.organizationId);
      if (user.role !== 'SUPERADMIN') {
        OrganizationDomainService.ensureActive(org);
      }
      if (org) {
        orgInfo = { maxEvents: org.maxEvents, eventsCount: org.eventsCount };
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId || null,
      organizationName: user.organizationName || null,
      organizationQuota: orgInfo,
      assignedEventId: user.assignedEventId || null,
    };
  }

  async listAllUsers(actor: AuthActor) {
    ensureSuperAdmin(actor);
    const users = await this.adminRepo.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      organizationId: u.organizationId,
      organizationName: u.organizationName || null,
      assignedEventId: u.assignedEventId,
      assignedEventSlug: u.assignedEventSlug || null,
      createdById: u.createdById,
      createdAt: u.createdAt,
    }));
  }

  async listCoupleUsers(eventId: string, actor: AuthActor) {
    ensureCanManageEventsOrCouples(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const createdByFilter = actor.role === 'ORG_ADMIN' ? actor.userId : undefined;
    const users = await this.adminRepo.findCoupleUsersByEvent(eventId, createdByFilter);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      assignedEventId: u.assignedEventId,
      createdById: u.createdById,
      createdAt: u.createdAt,
    }));
  }

  async upsertCoupleUser(
    eventId: string,
    actor: AuthActor,
    dto: { email: string; name: string; password: string }
  ) {
    ensureCanManageEventsOrCouples(actor);
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.adminRepo.findByEmail(cleanEmail);
    if (existing && (existing.role === 'SUPERADMIN' || existing.role === 'ORG_ADMIN')) {
      throw new AppError('Ese correo pertenece a una cuenta administrativa', 409, 'EMAIL_CONFLICT');
    }
    if (existing && existing.assignedEventId && existing.assignedEventId !== eventId) {
      throw new AppError('Ese correo ya está asignado a otro evento', 409, 'EMAIL_CONFLICT');
    }
    if (
      existing &&
      actor.role === 'ORG_ADMIN' &&
      existing.createdById &&
      existing.createdById !== actor.userId
    ) {
      throw new AppError(
        'No tienes permisos para modificar una cuenta creada por otro administrador',
        403,
        'FORBIDDEN'
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const saved = await this.adminRepo.upsertCoupleUser({
      eventId,
      organizationId: event.organizationId,
      email: cleanEmail,
      name: dto.name.trim(),
      passwordHash,
      createdById: actor.userId,
    });

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      assignedEventId: saved.assignedEventId,
    };
  }

  async deleteCoupleUser(eventId: string, userId: string, actor: AuthActor) {
    ensureCanManageEventsOrCouples(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);
    if (actor.role === 'ORG_ADMIN') {
      const target = await this.adminRepo.findById(userId);
      if (!target || target.createdById !== actor.userId) {
        throw new AppError(
          'Solo puedes eliminar cuentas de pareja creadas por tu usuario',
          403,
          'FORBIDDEN'
        );
      }
    }
    await this.adminRepo.deleteCoupleUser(userId, eventId);
  }
}
