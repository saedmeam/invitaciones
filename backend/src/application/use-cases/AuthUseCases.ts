import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAdminUserRepository, IEventRepository } from '../../domain/ports/Repositories';
import { AppError } from '../../shared/errors/AppError';
import { AuthActor, ensureEventAccess, ensureSuperAdmin } from '../helpers/AccessControlHelper';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  assignedEventId: string | null;
}

export class AuthUseCases {
  constructor(
    private readonly adminRepo: IAdminUserRepository,
    private readonly eventRepo: IEventRepository,
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

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
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
        assignedEventId: user.assignedEventId || null,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.adminRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedEventId: user.assignedEventId || null,
    };
  }

  async listCoupleUsers(eventId: string, actor: AuthActor) {
    ensureSuperAdmin(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const users = await this.adminRepo.findCoupleUsersByEvent(eventId);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      assignedEventId: u.assignedEventId,
      createdAt: u.createdAt,
    }));
  }

  async upsertCoupleUser(
    eventId: string,
    actor: AuthActor,
    dto: { email: string; name: string; password: string }
  ) {
    ensureSuperAdmin(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.adminRepo.findByEmail(cleanEmail);
    if (existing && existing.role === 'SUPERADMIN') {
      throw new AppError('Ese correo pertenece al administrador principal', 409, 'EMAIL_CONFLICT');
    }
    if (existing && existing.assignedEventId && existing.assignedEventId !== eventId) {
      throw new AppError('Ese correo ya está asignado a otro evento', 409, 'EMAIL_CONFLICT');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const saved = await this.adminRepo.upsertCoupleUser({
      eventId,
      email: cleanEmail,
      name: dto.name.trim(),
      passwordHash,
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
    ensureSuperAdmin(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);
    await this.adminRepo.deleteCoupleUser(userId, eventId);
  }
}
