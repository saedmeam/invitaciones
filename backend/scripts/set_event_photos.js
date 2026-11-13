const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const event = await prisma.event.findFirst({
    where: { slug: 'joselin-y-santiago-2027' }
  });

  if (!event) {
    console.error('Evento no encontrado');
    return;
  }

  const themeConfig = JSON.parse(event.themeConfig || '{}');
  const contentConfig = JSON.parse(event.contentConfig || '{}');

  // Asignar las imágenes subidas reales
  // 1. Portada: Si logo es el cover o WhatsApp Image es el cover
  // Vamos a poner el WhatsApp Image o logo
  themeConfig.coverImageUrl = '/uploads/assets/asset-1794522194642-WhatsApp_Image_2026-10-16_at_1.jpeg';
  contentConfig.galleryUrls = [
    '/uploads/assets/asset-1794522194642-WhatsApp_Image_2026-10-16_at_1.jpeg',
    '/uploads/assets/asset-1794522173224-logo__1_.png'
  ];

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      themeConfig: JSON.stringify(themeConfig),
      contentConfig: JSON.stringify(contentConfig),
    }
  });

  console.log('Evento actualizado exitosamente:');
  console.log('coverImageUrl:', JSON.parse(updated.themeConfig).coverImageUrl);
  console.log('galleryUrls:', JSON.parse(updated.contentConfig).galleryUrls);

  await prisma.$disconnect();
}

run().catch(console.error);
