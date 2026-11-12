import bcrypt from 'bcryptjs';
import { OrganizationType } from '../../domain/entities/Organization';
import {
  IAdminUserRepository,
  IOrganizationRepository,
} from '../../domain/ports/Repositories';
import { AppError } from '../../shared/errors/AppError';
import { AuthActor, ensureSuperAdmin } from '../helpers/AccessControlHelper';

export class OrganizationUseCases {
  constructor(
    private readonly orgRepo: IOrganizationRepository,
    private readonly adminRepo: IAdminUserRepository
  ) {}

  async list(actor: AuthActor) {
    ensureSuperAdmin(actor);
    return this.orgRepo.findAll();
  }

  async create(
    actor: AuthActor,
    dto: {
      name: string;
      slug: string;
      type?: OrganizationType;
      contactEmail?: string | null;
      maxEvents?: number;
      adminUser?: { name: string; email: string; password: string };
    }
  ) {
    ensureSuperAdmin(actor);

    const cleanSlug = dto.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!cleanSlug) {
      throw new AppError('Slug de empresa inválido', 400, 'INVALID_SLUG');
    }

    const existing = await this.orgRepo.findBySlug(cleanSlug);
    if (existing) {
      throw new AppError('Ya existe una empresa con ese slug', 409, 'SLUG_CONFLICT');
    }

    const org = await this.orgRepo.create({
      name: dto.name.trim(),
      slug: cleanSlug,
      type: dto.type === 'DIRECT' ? 'DIRECT' : 'PLANNER',
      contactEmail: dto.contactEmail?.trim() || null,
      maxEvents: Math.max(1, Number(dto.maxEvents) || 10),
    });

    if (dto.adminUser) {
      await this.upsertOrgAdmin(org.id, actor, dto.adminUser);
      return (await this.orgRepo.findById(org.id)) || org;
    }

    return org;
  }

  async update(
    orgId: string,
    actor: AuthActor,
    dto: Partial<{
      name: string;
      type: OrganizationType;
      contactEmail: string | null;
      maxEvents: number;
      isActive: boolean;
    }>
  ) {
    ensureSuperAdmin(actor);
    const current = await this.orgRepo.findById(orgId);
    if (!current) {
      throw new AppError('Empresa no encontrada', 404, 'NOT_FOUND');
    }

    return this.orgRepo.update(orgId, {
      name: dto.name?.trim(),
      type: dto.type,
      contactEmail: dto.contactEmail === undefined ? undefined : dto.contactEmail?.trim() || null,
      maxEvents: dto.maxEvents !== undefined ? Math.max(1, Number(dto.maxEvents)) : undefined,
      isActive: dto.isActive,
    });
  }

  async remove(orgId: string, actor: AuthActor) {
    ensureSuperAdmin(actor);
    const current = await this.orgRepo.findById(orgId);
    if (!current) {
      throw new AppError('Empresa no encontrada', 404, 'NOT_FOUND');
    }
    if (current.slug === 'plataforma-directa') {
      throw new AppError('No se puede eliminar la organización principal', 400, 'CANNOT_DELETE_PRIMARY_ORG');
    }
    await this.orgRepo.delete(orgId);
  }

  async upsertOrgAdmin(
    orgId: string,
    actor: AuthActor,
    dto: { name: string; email: string; password: string }
  ) {
    ensureSuperAdmin(actor);
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw new AppError('Empresa no encontrada', 404, 'NOT_FOUND');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.adminRepo.findByEmail(cleanEmail);
    if (existing && existing.role === 'SUPERADMIN') {
      throw new AppError('Ese correo pertenece al administrador principal', 409, 'EMAIL_CONFLICT');
    }
    if (existing && existing.organizationId && existing.organizationId !== orgId) {
      throw new AppError('Ese correo ya pertenece a otra empresa', 409, 'EMAIL_CONFLICT');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const saved = await this.adminRepo.upsertOrgAdminUser({
      organizationId: orgId,
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
      organizationId: saved.organizationId,
    };
  }

  async deleteOrgAdmin(orgId: string, userId: string, actor: AuthActor) {
    ensureSuperAdmin(actor);
    await this.adminRepo.deleteOrgAdminUser(userId, orgId);
  }
}
