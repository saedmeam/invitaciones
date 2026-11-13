import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RsvpDomainService } from '../domain/services/RsvpDomainService';
import { TableDomainService } from '../domain/services/TableDomainService';
import { GuestGroupEntity } from '../domain/entities/Guest';
import { DEFAULT_SECTIONS_CONFIG, EventEntity } from '../domain/entities/Event';
import { AuthActor } from '../application/helpers/AccessControlHelper';
import { buildContainer } from '../presentation/container';

describe('RsvpDomainService (Unit Tests)', () => {
  it('computes CONFIRMED, PARTIAL, DECLINED and PENDING statuses accurately', () => {
    expect(RsvpDomainService.computeGroupStatus([true, true])).toBe('CONFIRMED');
    expect(RsvpDomainService.computeGroupStatus([true, false])).toBe('PARTIAL');
    expect(RsvpDomainService.computeGroupStatus([false, false])).toBe('DECLINED');
    expect(RsvpDomainService.computeGroupStatus([])).toBe('PENDING');
  });

  it('computes detailed statistics across groups and categories', () => {
    const now = new Date('2026-11-11T10:00:00Z');
    const groups: GuestGroupEntity[] = [
      {
        id: 'g1',
        eventId: 'e1',
        token: 't1',
        groupName: 'Pareja 1',
        category: 'Amigos',
        email: null,
        phone: null,
        maxGuests: 2,
        rsvpStatus: 'CONFIRMED',
        guestMessage: null,
        viewedAt: now,
        respondedAt: now,
        createdAt: now,
        updatedAt: now,
        members: [
          {
            id: 'm1',
            groupId: 'g1',
            fullName: 'Ana',
            isPrimary: true,
            isCompanionSlot: false,
            attending: true,
            tableId: null,
            seatNumber: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'm2',
            groupId: 'g1',
            fullName: 'Luis',
            isPrimary: false,
            isCompanionSlot: true,
            attending: true,
            tableId: null,
            seatNumber: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: 'g2',
        eventId: 'e1',
        token: 't2',
        groupName: 'Pareja 2',
        category: 'Familia',
        email: null,
        phone: null,
        maxGuests: 2,
        rsvpStatus: 'PARTIAL',
        guestMessage: null,
        viewedAt: now,
        respondedAt: now,
        createdAt: now,
        updatedAt: now,
        members: [
          {
            id: 'm3',
            groupId: 'g2',
            fullName: 'Sofía',
            isPrimary: true,
            isCompanionSlot: false,
            attending: true,
            tableId: null,
            seatNumber: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'm4',
            groupId: 'g2',
            fullName: 'Acompañante',
            isPrimary: false,
            isCompanionSlot: true,
            attending: false,
            tableId: null,
            seatNumber: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: 'g3',
        eventId: 'e1',
        token: 't3',
        groupName: 'Invitado 3',
        category: 'Familia',
        email: null,
        phone: null,
        maxGuests: 1,
        rsvpStatus: 'PENDING',
        guestMessage: null,
        viewedAt: null,
        respondedAt: null,
        createdAt: now,
        updatedAt: now,
        members: [
          {
            id: 'm5',
            groupId: 'g3',
            fullName: 'Pedro',
            isPrimary: true,
            isCompanionSlot: false,
            attending: null,
            tableId: null,
            seatNumber: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ];

    const stats = RsvpDomainService.computeStats(groups);
    expect(stats.totalGroups).toBe(3);
    expect(stats.totalAllocatedSlots).toBe(5);
    expect(stats.confirmedGuests).toBe(3);
    expect(stats.declinedGuests).toBe(1);
    expect(stats.pendingGuests).toBe(1);
    expect(stats.groupsConfirmed).toBe(1);
    expect(stats.groupsPartial).toBe(1);
    expect(stats.groupsPending).toBe(1);
    expect(stats.responseRatePercent).toBe(66.7);
  });

  it('neutralizes spreadsheet formula injection', () => {
    expect(RsvpDomainService.sanitizeSpreadsheetCell('=CMD|calc')).toBe("'=CMD|calc");
    expect(RsvpDomainService.sanitizeSpreadsheetCell('+1234')).toBe("'+1234");
    expect(RsvpDomainService.sanitizeSpreadsheetCell('Juan Pérez')).toBe('Juan Pérez');
  });

  it('builds a valid ICS calendar invite', () => {
    const mockEvent: EventEntity = {
      id: 'evt-1',
      slug: 'boda-test',
      title: 'Nuestra Boda',
      partnerOneName: 'Novia',
      partnerTwoName: 'Novio',
      eventDate: new Date('2027-08-21T16:00:00-05:00'),
      rsvpDeadline: null,
      ceremonyTitle: 'Ceremonia',
      ceremonyTime: '16:00',
      ceremonyAddress: 'Iglesia',
      ceremonyMapUrl: 'https://maps.example.com/1',
      receptionTitle: 'Recepción',
      receptionTime: '19:00',
      receptionAddress: 'Salón',
      receptionMapUrl: 'https://maps.example.com/2',
      theme: 'ROMANTIC_EDITORIAL',
      themeConfig: {},
      sectionsConfig: DEFAULT_SECTIONS_CONFIG,
      contentConfig: {},
      driveFolderId: null,
      photosAlbumId: null,
      mediaProvider: 'HYBRID',
      photoPin: null,
      isPrimary: true,
      isActive: true,
      organizationId: null,
      ownerId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const ics = RsvpDomainService.buildIcsCalendar(mockEvent);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Boda Novia & Novio');
  });

  it('finds next free seat and enforces table capacity invariants', () => {
    const table = {
      id: 't1',
      eventId: 'e1',
      name: 'Mesa 1',
      capacity: 2,
      shape: 'ROUND' as const,
      zone: 'Salón',
      sortOrder: 1,
      members: [
        { id: 'm1', groupId: 'g1', groupName: 'G1', category: 'Amigos', fullName: 'A', seatNumber: 1 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(TableDomainService.findNextFreeSeat(table, new Set([1]))).toBe(2);
    expect(() =>
      TableDomainService.validateAssignment({
        table,
        incomingCount: 2,
        alreadyInSameTableCount: 0,
        memberAttending: true,
      })
    ).toThrow(/no tiene suficientes cupos libres/i);
  });
});

describe('Use Case Integration Tests (SQLite Seed)', () => {
  const prisma = new PrismaClient();
  const container = buildContainer({ db: prisma });

  let superAdminActor: AuthActor;
  let coupleActor: AuthActor;
  let eventId = '';

  beforeAll(async () => {
    const loginAdmin = await container.authUseCases.login(
      process.env.ADMIN_EMAIL || 'admin@invitaciones.local',
      process.env.ADMIN_PASSWORD || 'admin123'
    );
    superAdminActor = {
      userId: loginAdmin.user.id,
      email: loginAdmin.user.email,
      role: loginAdmin.user.role,
      assignedEventId: loginAdmin.user.assignedEventId,
    };

    const events = await container.eventUseCases.listForActor(superAdminActor);
    eventId =
      events.find((e) => e.slug === 'joselin-y-santiago-2027')?.id || events[0].id;

    const loginCouple = await container.authUseCases.login(
      'pareja@invitaciones.local',
      'pareja123'
    );
    coupleActor = {
      userId: loginCouple.user.id,
      email: loginCouple.user.email,
      role: loginCouple.user.role,
      assignedEventId: loginCouple.user.assignedEventId,
    };
  });

  it('restricts COUPLE user exclusively to their assigned event', async () => {
    expect(coupleActor.role).toBe('COUPLE');
    expect(coupleActor.assignedEventId).toBe(eventId);

    const coupleEvents = await container.eventUseCases.listForActor(coupleActor);
    expect(coupleEvents).toHaveLength(1);
    expect(coupleEvents[0].id).toBe(eventId);

    await expect(
      container.eventUseCases.create(coupleActor, {
        slug: 'otro-evento',
        title: 'Otro',
        partnerOneName: 'A',
        partnerTwoName: 'B',
        eventDate: new Date().toISOString(),
      })
    ).rejects.toThrow(/permisos/i);

    await expect(
      container.eventUseCases.getByIdForActor('evento-inexistente', coupleActor)
    ).rejects.toThrow();
  });

  it('loads seeded public event, featured homepage event, and generates photo QR data URL', async () => {
    const featured = await container.eventUseCases.getFeaturedPublic();
    expect(featured?.slug).toBe('joselin-y-santiago-2027');
    expect(featured?.mediaProvider).toBe('HYBRID');

    const pub = await container.eventUseCases.getPublicBySlug('joselin-y-santiago-2027');
    expect(pub.partnerOneName).toContain('Joselin');
    expect(pub.partnerTwoName).toContain('Santiago');

    const qr = await container.mediaAndWishUseCases.generatePhotoQr(eventId, coupleActor);
    expect(qr.uploadUrl).toMatch(/photos\.app\.goo\.gl|\/fotos/);
    expect(qr.qrDataUrl).toContain('data:image/png;base64,');
  });

  it('allows couple to manage tables, assign confirmed guests, and blocks capacity overflow or unconfirmed guests', async () => {
    const createdGroup = await container.guestUseCases.create(eventId, superAdminActor, {
      groupName: 'Invitado Mesa Test',
      category: 'Amigos',
      email: 'mesa@ejemplo.com',
      phone: '593999999888',
      maxGuests: 2,
    });

    const viewed = await container.rsvpUseCases.getByTokenAndTrackView(createdGroup.token);
    const updated = await container.rsvpUseCases.submitByToken(createdGroup.token, {
      members: viewed.group.members.map((m, idx) => ({
        id: m.id,
        fullName: idx === 1 ? 'Acompañante Confirmado' : m.fullName,
        attending: idx === 0 ? true : true,
      })),
      guestMessage: 'Nos vemos allá!',
    });
    expect(updated.rsvpStatus).toBe('CONFIRMED');

    const unconfirmedGroup = await container.guestUseCases.create(eventId, superAdminActor, {
      groupName: 'Pendiente Mesa',
      maxGuests: 1,
    });

    const table = await container.tableUseCases.createTable(eventId, coupleActor, {
      name: 'Mesa Prueba QA',
      capacity: 2,
      shape: 'ROUND',
    });

    // Asignar grupo confirmado completo (2 personas en mesa de capacidad 2)
    const assignedTable = await container.tableUseCases.assignToTable(
      eventId,
      table.id,
      coupleActor,
      { groupId: createdGroup.id }
    );
    expect(assignedTable?.members).toHaveLength(2);
    expect(assignedTable?.members[0].seatNumber).toBe(1);
    expect(assignedTable?.members[1].seatNumber).toBe(2);

    // Rechazar invitado pendiente / no confirmado
    await expect(
      container.tableUseCases.assignToTable(eventId, table.id, coupleActor, {
        memberId: unconfirmedGroup.members[0].id,
      })
    ).rejects.toThrow(/confirmaron asistencia/i);

    // Desasignar 1 y probar asignación múltiple (memberIds)
    await container.tableUseCases.unassignMember(
      eventId,
      coupleActor,
      createdGroup.members[0].id
    );
    await container.tableUseCases.unassignMember(
      eventId,
      coupleActor,
      createdGroup.members[1].id
    );

    const batchAssigned = await container.tableUseCases.assignToTable(
      eventId,
      table.id,
      coupleActor,
      { memberIds: createdGroup.members.map((m) => m.id) }
    );
    expect(batchAssigned?.members).toHaveLength(2);

    // Exportar reporte de mesas PDF & Excel
    const pdfReport = await container.tableUseCases.exportSeatingReport(eventId, coupleActor, 'PDF');
    expect(pdfReport.buffer.byteLength).toBeGreaterThan(200);

    // Limpieza
    await container.tableUseCases.deleteTable(eventId, table.id, coupleActor);
    await container.guestUseCases.delete(eventId, createdGroup.id, superAdminActor);
    await container.guestUseCases.delete(eventId, unconfirmedGroup.id, superAdminActor);
  });

  it('updates guest details, companion name, and recalculates RSVP status', async () => {
    const g = await container.guestUseCases.create(eventId, superAdminActor, {
      groupName: 'Editar Test',
      category: 'Amigos',
      maxGuests: 2,
    });

    const updated = await container.guestUseCases.update(eventId, g.id, coupleActor, {
      groupName: 'Editar Test Actualizado',
      category: 'VIP',
      maxGuests: 2,
      members: [
        {
          id: g.members[0].id,
          fullName: 'Titular Editado',
          isPrimary: true,
          isCompanionSlot: false,
          attending: true,
        },
        {
          id: g.members[1].id,
          fullName: 'Acompañante Editado',
          isPrimary: false,
          isCompanionSlot: true,
          attending: false,
        },
      ],
    });

    expect(updated.groupName).toBe('Editar Test Actualizado');
    expect(updated.category).toBe('VIP');
    expect(updated.rsvpStatus).toBe('PARTIAL');
    expect(updated.members[1].fullName).toBe('Acompañante Editado');

    await container.guestUseCases.delete(eventId, g.id, superAdminActor);
  });

  it('supports B2B2C multi-organization isolation, event quotas, and ORG_ADMIN -> COUPLE hierarchy', async () => {
    const orgSlug = `planner-qa-${Date.now()}`;
    const orgEmail = `qa-${Date.now()}@planner.local`;
    const org = await container.organizationUseCases.create(superAdminActor, {
      name: 'Planner QA Studio',
      slug: orgSlug,
      type: 'PLANNER',
      maxEvents: 1,
      adminUser: {
        name: 'Planner QA',
        email: orgEmail,
        password: 'password123',
      },
    });

    const orgLogin = await container.authUseCases.login(orgEmail, 'password123');
    const orgActor: AuthActor = {
      userId: orgLogin.user.id,
      email: orgLogin.user.email,
      role: orgLogin.user.role,
      organizationId: orgLogin.user.organizationId,
      assignedEventId: orgLogin.user.assignedEventId,
    };
    expect(orgActor.role).toBe('ORG_ADMIN');
    expect(orgActor.organizationId).toBe(org.id);

    // No puede listar organizaciones del SuperAdmin
    await expect(container.organizationUseCases.list(orgActor)).rejects.toThrow(/administrador/i);

    // No puede acceder a eventos de otra organización
    await expect(container.eventUseCases.getByIdForActor(eventId, orgActor)).rejects.toThrow(
      /otra empresa/i
    );

    // Crea su primer evento (dentro del cupo maxEvents = 1)
    const orgEvent = await container.eventUseCases.create(orgActor, {
      slug: `boda-qa-${Date.now()}`,
      title: 'Boda Cliente Planner',
      partnerOneName: 'Sofía',
      partnerTwoName: 'Mateo',
      eventDate: '2027-10-10T17:00:00-05:00',
    });
    expect(orgEvent.organizationId).toBe(org.id);

    // Alcanzó maxEvents = 1 -> el 2do evento debe ser rechazado
    await expect(
      container.eventUseCases.create(orgActor, {
        slug: `boda-qa-2-${Date.now()}`,
        title: 'Boda Excedida',
        partnerOneName: 'A',
        partnerTwoName: 'B',
        eventDate: '2027-11-10T17:00:00-05:00',
      })
    ).rejects.toThrow(/límite de eventos/i);

    // ORG_ADMIN asigna una cuenta COUPLE a su propia boda
    const coupleEmail = `novios-${Date.now()}@planner.local`;
    const coupleUser = await container.authUseCases.upsertCoupleUser(orgEvent.id, orgActor, {
      name: 'Sofía & Mateo',
      email: coupleEmail,
      password: 'password123',
    });
    expect(coupleUser.role).toBe('COUPLE');

    // Segundo ORG_ADMIN en la misma empresa NO debe ver la cuenta COUPLE creada por el primer ORG_ADMIN
    const orgEmail2 = `qa2-${Date.now()}@planner.local`;
    await container.organizationUseCases.upsertOrgAdmin(org.id, superAdminActor, {
      name: 'Planner QA 2',
      email: orgEmail2,
      password: 'password123',
    });
    const orgLogin2 = await container.authUseCases.login(orgEmail2, 'password123');
    const orgActor2: AuthActor = {
      userId: orgLogin2.user.id,
      email: orgLogin2.user.email,
      role: orgLogin2.user.role,
      organizationId: orgLogin2.user.organizationId,
      assignedEventId: orgLogin2.user.assignedEventId,
    };

    const visibleToCreator = await container.authUseCases.listCoupleUsers(orgEvent.id, orgActor);
    expect(visibleToCreator.some((u) => u.email === coupleEmail)).toBe(true);

    const visibleToOtherPlanner = await container.authUseCases.listCoupleUsers(
      orgEvent.id,
      orgActor2
    );
    expect(visibleToOtherPlanner.some((u) => u.email === coupleEmail)).toBe(false);

    // SUPERADMIN sí ve todos los usuarios (ORG_ADMIN y COUPLE)
    const allUsers = await container.authUseCases.listAllUsers(superAdminActor);
    expect(allUsers.some((u) => u.email === orgEmail && u.role === 'ORG_ADMIN')).toBe(true);
    expect(allUsers.some((u) => u.email === coupleEmail && u.role === 'COUPLE')).toBe(true);

    // ORG_ADMIN no puede listar el directorio global de usuarios
    await expect(container.authUseCases.listAllUsers(orgActor)).rejects.toThrow(/administrador/i);

    // Limpieza completa de usuarios y organización de prueba
    await container.authUseCases.deleteUser(coupleUser.id, superAdminActor).catch(() => {});
    await container.authUseCases.deleteUser(orgActor2.userId, superAdminActor).catch(() => {});
    await container.authUseCases.deleteUser(orgActor.userId, superAdminActor).catch(() => {});
    await container.organizationUseCases.remove(org.id, superAdminActor);
  });

  it('renders final WhatsApp reminder template with confirmed slots, assigned tables and maps', async () => {
    const pub = await container.eventUseCases.getPublicBySlug('joselin-y-santiago-2027');
    const now = new Date();
    const mockGroup: GuestGroupEntity = {
      id: 'g-wa',
      eventId: pub.id,
      token: 'tok-wa',
      groupName: 'Familia Castro',
      category: 'Familia Novia',
      email: null,
      phone: '593990000002',
      maxGuests: 2,
      rsvpStatus: 'CONFIRMED',
      guestMessage: null,
      viewedAt: now,
      respondedAt: now,
      createdAt: now,
      updatedAt: now,
      members: [
        {
          id: 'm1',
          groupId: 'g-wa',
          fullName: 'María Castro',
          isPrimary: true,
          isCompanionSlot: false,
          attending: true,
          tableId: 't1',
          seatNumber: 1,
          tableName: 'Mesa 1 - Familia',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'm2',
          groupId: 'g-wa',
          fullName: 'Jorge Villamar',
          isPrimary: false,
          isCompanionSlot: true,
          attending: true,
          tableId: 't2',
          seatNumber: 2,
          tableName: 'Mesa Principal',
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    const rendered = container.dispatchUseCases.renderTemplate(
      'Hola {nombre} ({cupos_confirmados} cupos):\n{mesas}\nIglesia: {ceremonia_hora} {ceremonia_mapa}\nRecepción: {recepcion_hora} {recepcion_mapa}\nLink: {link}',
      pub,
      mockGroup,
      'http://localhost:3006/i/tok-wa'
    );

    expect(rendered).toContain('Familia Castro (2 cupos)');
    expect(rendered).toContain('• María Castro: Mesa 1 - Familia (Puesto #1)');
    expect(rendered).toContain('• Jorge Villamar: Mesa Principal (Puesto #2)');
    expect(rendered).toContain(pub.ceremonyMapUrl);
    expect(rendered).toContain(pub.receptionMapUrl);
  });

  it('permite editar usuarios, ver creador/paquete en directorio y actualizar perfil propio', async () => {
    const suffix = Date.now();
    const superActor = {
      userId: 'super-test',
      email: 'admin@invitaciones.local',
      role: 'SUPERADMIN',
    };

    const org = await container.organizationUseCases.create(superActor, {
      name: `Agencia Edit ${suffix}`,
      slug: `agencia-edit-${suffix}`,
      type: 'PLANNER',
      maxEvents: 5,
      adminUser: {
        name: 'Planner Edit',
        email: `planner-edit-${suffix}@test.local`,
        password: 'password123',
      },
    });

    const orgAdmin = org.admins[0];
    const plannerActor = {
      userId: orgAdmin.id,
      email: orgAdmin.email,
      role: 'ORG_ADMIN',
      organizationId: org.id,
    };

    const event = await container.eventUseCases.create(plannerActor, {
      slug: `boda-edit-${suffix}`,
      title: 'Boda Edit Test',
      partnerOneName: 'Ana',
      partnerTwoName: 'Luis',
      eventDate: '2027-08-20T16:00:00.000Z',
    });

    const couple = await container.authUseCases.upsertCoupleUser(event.id, plannerActor, {
      email: `couple-edit-${suffix}@test.local`,
      name: 'Ana & Luis',
      password: 'password123',
    });

    try {
      // 1. Directorio global muestra empresa/paquete, boda y creador
      const allUsers = await container.authUseCases.listAllUsers(superActor);
      const foundCouple = allUsers.find((u) => u.id === couple.id);
      expect(foundCouple?.organizationName).toBe(`Agencia Edit ${suffix}`);
      expect(foundCouple?.organizationType).toBe('PLANNER');
      expect(foundCouple?.organizationMaxEvents).toBe(5);
      expect(foundCouple?.createdByName).toBe('Planner Edit');
      expect(foundCouple?.assignedEventTitle).toBe('Ana & Luis');

      // 2. ORG_ADMIN puede editar su propio COUPLE creado
      const updatedCouple = await container.authUseCases.updateUser(couple.id, plannerActor, {
        name: 'Ana & Luis Actualizado',
        password: 'newpassword123',
      });
      expect(updatedCouple.name).toBe('Ana & Luis Actualizado');

      // 3. Usuario COUPLE puede actualizar su propio perfil (con contraseña actual válida)
      await expect(
        container.authUseCases.updateProfile(couple.id, {
          name: 'Ana y Luis Perfil',
          currentPassword: 'wrongpassword',
          newPassword: 'perfilpassword123',
        })
      ).rejects.toThrow(/incorrecta/i);

      const profileRes = await container.authUseCases.updateProfile(couple.id, {
        name: 'Ana y Luis Perfil',
        currentPassword: 'newpassword123',
        newPassword: 'perfilpassword123',
      });
      expect(profileRes.user.name).toBe('Ana y Luis Perfil');
      expect(profileRes.token).toBeTruthy();

      const loginCheck = await container.authUseCases.login(couple.email, 'perfilpassword123');
      expect(loginCheck.user.name).toBe('Ana y Luis Perfil');

      // 4. SUPERADMIN puede crear usuario directamente via createUser con mustChangePassword
      const createdBySuper = await container.authUseCases.createUser(superActor, {
        name: 'Planner Directo',
        email: `planner-direct-${suffix}@test.local`,
        password: 'password123',
        role: 'ORG_ADMIN',
        mustChangePassword: true,
        organizationId: org.id,
      });
      expect(createdBySuper.organizationId).toBe(org.id);
      expect(createdBySuper.mustChangePassword).toBe(true);

      const loginDirect = await container.authUseCases.login(
        `planner-direct-${suffix}@test.local`,
        'password123'
      );
      expect(loginDirect.user.mustChangePassword).toBe(true);

      // Al cambiar su contraseña, el check mustChangePassword se apaga automáticamente
      await container.authUseCases.updateProfile(createdBySuper.id, {
        currentPassword: 'password123',
        newPassword: 'newsecurepassword123',
      });
      const loginAfterChange = await container.authUseCases.login(
        `planner-direct-${suffix}@test.local`,
        'newsecurepassword123'
      );
      expect(loginAfterChange.user.mustChangePassword).toBe(false);

      // 5. Configuración SMTP por boda y envío con customSmtp
      const eventWithSmtp = await container.eventUseCases.update(event.id, plannerActor, {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'boda-test@gmail.com',
        smtpPass: 'app-password-test',
        smtpFromName: 'Boda Ana & Luis',
      });
      expect(eventWithSmtp.smtpUser).toBe('boda-test@gmail.com');
      expect(eventWithSmtp.smtpFromName).toBe('Boda Ana & Luis');

      await container.authUseCases.deleteUser(createdBySuper.id, superActor).catch(() => {});
    } finally {
      await container.authUseCases.deleteUser(couple.id, superActor).catch(() => {});
      await container.authUseCases.deleteUser(orgAdmin.id, superActor).catch(() => {});
      await container.organizationUseCases.remove(org.id, superActor).catch(() => {});
    }
  });
});
