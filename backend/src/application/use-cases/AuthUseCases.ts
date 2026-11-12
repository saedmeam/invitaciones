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
    const userMap = new Map(users.map((u) => [u.id, u]));
    return users.map((u) => {
      const creator = u.createdById ? userMap.get(u.createdById) : undefined;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        organizationId: u.organizationId,
        organizationName: u.organizationName || null,
        organizationType: u.organizationType || null,
        organizationMaxEvents: u.organizationMaxEvents ?? null,
        assignedEventId: u.assignedEventId,
        assignedEventSlug: u.assignedEventSlug || null,
        assignedEventTitle: u.assignedEventTitle || null,
        createdById: u.createdById,
        createdByName: creator?.name || null,
        createdByEmail: creator?.email || null,
        createdByRole: creator?.role || null,
        createdAt: u.createdAt,
      };
    });
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

  async updateProfile(
    userId: string,
    dto: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) {
    const user = await this.adminRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    let nextEmail: string | undefined;
    if (dto.email !== undefined) {
      const cleanEmail = dto.email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        const existing = await this.adminRepo.findByEmail(cleanEmail);
        if (existing && existing.id !== userId) {
          throw new AppError('Ese correo ya está en uso por otra cuenta', 409, 'EMAIL_CONFLICT');
        }
        nextEmail = cleanEmail;
      }
    }

    let passwordHash: string | undefined;
    if (dto.newPassword && dto.newPassword.trim().length > 0) {
      if (!dto.currentPassword) {
        throw new AppError(
          'Ingresa tu contraseña actual para confirmar el cambio',
          400,
          'CURRENT_PASSWORD_REQUIRED'
        );
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) {
        throw new AppError('La contraseña actual es incorrecta', 401, 'INVALID_PASSWORD');
      }
      passwordHash = await bcrypt.hash(dto.newPassword.trim(), 10);
    }

    const updated = await this.adminRepo.updateUser(userId, {
      name: dto.name !== undefined ? dto.name.trim() : undefined,
      email: nextEmail,
      passwordHash,
    });

    const payload: AuthTokenPayload = {
      userId: updated.id,
      email: updated.email,
      role: updated.role,
      organizationId: updated.organizationId || null,
      assignedEventId: updated.assignedEventId || null,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        organizationId: updated.organizationId || null,
        organizationName: updated.organizationName || null,
        assignedEventId: updated.assignedEventId || null,
      },
    };
  }

  async updateUser(
    targetUserId: string,
    actor: AuthActor,
    dto: {
      name?: string;
      email?: string;
      password?: string;
      organizationId?: string | null;
      assignedEventId?: string | null;
    }
  ) {
    ensureCanManageEventsOrCouples(actor);
    const target = await this.adminRepo.findById(targetUserId);
    if (!target) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    if (actor.role === 'ORG_ADMIN') {
      if (
        target.role !== 'COUPLE' ||
        target.createdById !== actor.userId ||
        target.organizationId !== actor.organizationId
      ) {
        throw new AppError(
          'Solo puedes editar cuentas de pareja creadas por tu usuario',
          403,
          'FORBIDDEN'
        );
      }
    }

    let nextEmail: string | undefined;
    if (dto.email !== undefined) {
      const cleanEmail = dto.email.trim().toLowerCase();
      if (cleanEmail !== target.email) {
        const existing = await this.adminRepo.findByEmail(cleanEmail);
        if (existing && existing.id !== targetUserId) {
          throw new AppError('Ese correo ya está en uso por otra cuenta', 409, 'EMAIL_CONFLICT');
        }
        nextEmail = cleanEmail;
      }
    }

    let nextOrganizationId: string | null | undefined;
    if (dto.organizationId !== undefined) {
      if (actor.role !== 'SUPERADMIN') {
        throw new AppError(
          'Solo el administrador principal puede reasignar la empresa',
          403,
          'FORBIDDEN'
        );
      }
      if (dto.organizationId) {
        const org = await this.orgRepo.findById(dto.organizationId);
        if (!org) {
          throw new AppError('Empresa no encontrada', 404, 'NOT_FOUND');
        }
        nextOrganizationId = org.id;
      } else {
        nextOrganizationId = null;
      }
    }

    let nextEventId: string | null | undefined;
    if (dto.assignedEventId !== undefined) {
      if (dto.assignedEventId) {
        const event = await this.eventRepo.findById(dto.assignedEventId);
        if (!event) {
          throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
        }
        if (actor.role === 'ORG_ADMIN' && event.organizationId !== actor.organizationId) {
          throw new AppError(
            'No puedes asignar una boda que pertenece a otra empresa',
            403,
            'FORBIDDEN'
          );
        }
        nextEventId = event.id;
      } else {
        nextEventId = null;
      }
    }

    const passwordHash =
      dto.password && dto.password.trim().length > 0
        ? await bcrypt.hash(dto.password.trim(), 10)
        : undefined;

    const updated = await this.adminRepo.updateUser(targetUserId, {
      name: dto.name !== undefined ? dto.name.trim() : undefined,
      email: nextEmail,
      passwordHash,
      organizationId: nextOrganizationId,
      assignedEventId: nextEventId,
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      organizationId: updated.organizationId,
      organizationName: updated.organizationName || null,
      organizationType: updated.organizationType || null,
      organizationMaxEvents: updated.organizationMaxEvents ?? null,
      assignedEventId: updated.assignedEventId,
      assignedEventSlug: updated.assignedEventSlug || null,
      assignedEventTitle: updated.assignedEventTitle || null,
      createdById: updated.createdById,
    };
  }

  async deleteUser(targetUserId: string, actor: AuthActor) {
    ensureSuperAdmin(actor);
    if (targetUserId === actor.userId) {
      throw new AppError('No puedes eliminar tu propia cuenta activa', 400, 'CANNOT_DELETE_SELF');
    }
    const target = await this.adminRepo.findById(targetUserId);
    if (!target) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }
    await this.adminRepo.deleteUser(targetUserId);
  }
}
