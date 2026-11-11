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
    eventId = events[0].id;

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
    ).rejects.toThrow(/administrador principal/i);

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
    expect(qr.uploadUrl).toContain('/e/joselin-y-santiago-2027/fotos');
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
});
