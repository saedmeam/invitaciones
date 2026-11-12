import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@invitaciones.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const directOrg = await prisma.organization.upsert({
    where: { slug: 'plataforma-directa' },
    update: {},
    create: {
      name: 'Plataforma Directa',
      slug: 'plataforma-directa',
      type: 'DIRECT',
      contactEmail: adminEmail,
      maxEvents: 999,
      isActive: true,
    },
  });

  const plannerOrg = await prisma.organization.upsert({
    where: { slug: 'glamour-planners' },
    update: {},
    create: {
      name: 'Glamour Wedding Planners',
      slug: 'glamour-planners',
      type: 'PLANNER',
      contactEmail: 'planner@invitaciones.local',
      maxEvents: 10,
      isActive: true,
    },
  });

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'SUPERADMIN', organizationId: directOrg.id },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Administrador Principal',
      role: 'SUPERADMIN',
      organizationId: directOrg.id,
    },
  });

  const plannerPasswordHash = await bcrypt.hash('planner123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'planner@invitaciones.local' },
    update: {
      passwordHash: plannerPasswordHash,
      role: 'ORG_ADMIN',
      organizationId: plannerOrg.id,
      createdById: admin.id,
    },
    create: {
      email: 'planner@invitaciones.local',
      passwordHash: plannerPasswordHash,
      name: 'Organizadora Glamour',
      role: 'ORG_ADMIN',
      organizationId: plannerOrg.id,
      createdById: admin.id,
    },
  });

  const sectionsConfig = {
    heroMusic: true,
    countdown: true,
    storyGallery: true,
    itinerary: true,
    dressCode: true,
    giftRegistry: true,
    faq: true,
    wishesWall: true,
    photoWall: true,
  };

  const themeConfig = {
    accentColor: '#b08d57',
    musicUrl: '',
    coverSubtitle: 'Nos casamos y queremos compartir este día contigo',
    moderatePhotos: false,
    moderateWishes: false,
  };

  const contentConfig = {
    homeBadgeText: '¡Nos Casamos!',
    homeDescription:
      'Con mucha alegría queremos compartir contigo el día más especial de nuestras vidas. Aquí encontrarás los detalles de la ceremonia, la celebración y nuestro álbum de recuerdos.',
    homeInviteLabel: 'Ver Invitación',
    homePhotosLabel: 'Álbum de Fotos',
    heroBadgeText: 'Nos Casamos',
    openEnvelopeLabel: 'Abrir Invitación',
    countdownTitle: 'Faltan para el gran día',
    welcomeText:
      'Con la bendición de Dios y el amor de nuestras familias, te invitamos a celebrar nuestra unión.',
    storyEyebrow: 'Nuestro Camino',
    storyTitle: 'Nuestra Historia',
    storyItems: [
      {
        year: '2022',
        title: 'El primer encuentro',
        description: 'El día en que nuestros caminos coincidieron y comenzó esta aventura.',
      },
      {
        year: '2025',
        title: 'El compromiso',
        description: 'Una promesa para caminar juntos toda la vida.',
      },
      {
        year: '2027',
        title: 'El gran día',
        description: 'Celebramos nuestro matrimonio junto a quienes más queremos.',
      },
    ],
    galleryUrls: [],
    itineraryEyebrow: 'Cuándo y Dónde',
    itineraryTitle: 'Itinerario del Evento',
    dressCodeEyebrow: 'Vestimenta',
    dressCodeTitle: 'Etiqueta Formal',
    dressCodeNote: 'Reservamos el color blanco y marfil exclusivamente para la novia.',
    dressCodePalette: ['#1c1917', '#57534e', '#b08d57', '#78866b'],
    giftTitle: 'Mesa de Regalos & Lluvia de Sobres',
    giftDescription:
      'Tu presencia es nuestro mejor regalo. Si deseas tener un detalle adicional con nosotros, puedes hacerlo mediante lluvia de sobres o transferencia.',
    bankAccounts: [
      {
        bank: 'Cuenta Bancaria Principal',
        accountType: 'Ahorros',
        accountNumber: '0000000000',
        holder: 'Titular por definir en el panel',
      },
    ],
    rsvpEyebrow: 'RSVP',
    rsvpTitle: 'Confirma tu Asistencia',
    rsvpButtonLabel: 'Guardar Confirmación',
    photoAlbumEyebrow: 'Álbum Colaborativo',
    photoAlbumTitle: 'Comparte tus Fotos y Videos',
    photoAlbumSubtitle:
      'Comparte con nosotros tus mejores fotos y videos de este día tan especial',
    wishesTitle: 'Buenos Deseos',
    faqTitle: 'Preguntas Frecuentes',
    faqItems: [
      {
        question: '¿Puedo llevar acompañante?',
        answer:
          'Tu invitación indica exactamente los cupos reservados para ti y tu acompañante en el formulario de confirmación.',
      },
      {
        question: '¿Habrá estacionamiento disponible?',
        answer: 'Sí, tanto la iglesia como la recepción cuentan con facilidades de parqueo cercanas.',
      },
      {
        question: '¿Cómo subo las fotos del evento?',
        answer:
          'Escanea el código QR disponible en las mesas o accede a la sección de Álbum de Fotos para compartir fotos y videos.',
      },
    ],
  };

  const event = await prisma.event.upsert({
    where: { slug: 'joselin-y-santiago-2027' },
    update: {
      isPrimary: true,
      mediaProvider: 'HYBRID',
      organizationId: directOrg.id,
      contentConfig: JSON.stringify(contentConfig),
    },
    create: {
      slug: 'joselin-y-santiago-2027',
      title: 'Nuestra Boda',
      partnerOneName: 'Joselin Janina Castro Villamar',
      partnerTwoName: 'Santiago Eduardo Merino Ampuero',
      eventDate: new Date('2027-08-21T16:00:00-05:00'),
      rsvpDeadline: new Date('2027-07-31T23:59:59-05:00'),
      ceremonyTitle: 'Ceremonia Religiosa',
      ceremonyTime: '16:00',
      ceremonyAddress: 'Iglesia de la Ceremonia',
      ceremonyMapUrl: 'https://maps.app.goo.gl/U2qRf4uVUd68Lge37',
      receptionTitle: 'Recepción',
      receptionTime: '19:00',
      receptionAddress: 'Salón de Recepción',
      receptionMapUrl: 'https://maps.app.goo.gl/DGzmJXFC25hj26wJA',
      theme: 'ROMANTIC_EDITORIAL',
      themeConfig: JSON.stringify(themeConfig),
      sectionsConfig: JSON.stringify(sectionsConfig),
      contentConfig: JSON.stringify(contentConfig),
      mediaProvider: 'HYBRID',
      photoPin: '',
      isPrimary: true,
      isActive: true,
      organizationId: directOrg.id,
      ownerId: admin.id,
    },
  });

  // Usuario propio de la pareja asignado exclusivamente a su evento
  const couplePasswordHash = await bcrypt.hash('pareja123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'pareja@invitaciones.local' },
    update: {
      passwordHash: couplePasswordHash,
      role: 'COUPLE',
      organizationId: directOrg.id,
      assignedEventId: event.id,
      createdById: admin.id,
    },
    create: {
      email: 'pareja@invitaciones.local',
      passwordHash: couplePasswordHash,
      name: 'Joselin & Santiago',
      role: 'COUPLE',
      organizationId: directOrg.id,
      assignedEventId: event.id,
      createdById: admin.id,
    },
  });

  const existingTables = await prisma.eventTable.count({ where: { eventId: event.id } });
  if (existingTables === 0) {
    await prisma.eventTable.createMany({
      data: [
        {
          eventId: event.id,
          name: 'Mesa Principal',
          capacity: 6,
          shape: 'HEAD',
          zone: 'Salón Principal',
          sortOrder: 1,
        },
        {
          eventId: event.id,
          name: 'Mesa 1 - Familia',
          capacity: 8,
          shape: 'ROUND',
          zone: 'Salón Principal',
          sortOrder: 2,
        },
      ],
    });
  }

  const existingGroups = await prisma.guestGroup.count({ where: { eventId: event.id } });
  if (existingGroups === 0) {
    const sampleGroups = [
      {
        groupName: 'Carlos Mendoza y Acompañante',
        category: 'Amigos',
        email: 'carlos.mendoza@ejemplo.com',
        phone: '593990000001',
        maxGuests: 2,
        rsvpStatus: 'PENDING',
        members: [
          { fullName: 'Carlos Mendoza', isPrimary: true, isCompanionSlot: false, attending: null },
          { fullName: 'Acompañante', isPrimary: false, isCompanionSlot: true, attending: null },
        ],
      },
      {
        groupName: 'Familia Castro',
        category: 'Familia Novia',
        email: 'familia.castro@ejemplo.com',
        phone: '593990000002',
        maxGuests: 2,
        rsvpStatus: 'CONFIRMED',
        respondedAt: new Date(),
        guestMessage: 'Ahí estaremos celebrando con ustedes.',
        members: [
          { fullName: 'María Castro', isPrimary: true, isCompanionSlot: false, attending: true },
          { fullName: 'Jorge Villamar', isPrimary: false, isCompanionSlot: true, attending: true },
        ],
      },
      {
        groupName: 'Andrea López',
        category: 'Trabajo',
        email: 'andrea.lopez@ejemplo.com',
        phone: '593990000003',
        maxGuests: 1,
        rsvpStatus: 'DECLINED',
        respondedAt: new Date(),
        guestMessage: 'Muchas felicidades, lamentablemente estaré de viaje.',
        members: [
          { fullName: 'Andrea López', isPrimary: true, isCompanionSlot: false, attending: false },
        ],
      },
    ];

    for (const g of sampleGroups) {
      await prisma.guestGroup.create({
        data: {
          eventId: event.id,
          token: generateToken(),
          groupName: g.groupName,
          category: g.category,
          email: g.email,
          phone: g.phone,
          maxGuests: g.maxGuests,
          rsvpStatus: g.rsvpStatus,
          respondedAt: g.respondedAt,
          guestMessage: g.guestMessage,
          members: {
            create: g.members,
          },
        },
      });
    }

    await prisma.wishMessage.create({
      data: {
        eventId: event.id,
        authorName: 'Familia Castro',
        message: 'Que esta nueva etapa esté llena de amor, alegría y bendiciones infinitas.',
        isApproved: true,
      },
    });
  }

  console.log('Seed completado correctamente:', {
    adminEmail: admin.email,
    coupleEmail: 'pareja@invitaciones.local',
    eventSlug: event.slug,
  });
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
