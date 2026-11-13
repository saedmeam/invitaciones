const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: 'joselin-y-santiago-2027' },
    });
    if (!event) {
      console.log('Event not found');
      return;
    }
    const config = JSON.parse(event.themeConfig || '{}');
    config.particleEffect = 'ROSE_PETALS';
    config.backgroundClean = true;
    config.waxSealMonogram = 'S&J';
    config.waxSealColor = 'burgundy';

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        themeConfig: JSON.stringify(config),
      },
    });
    console.log('Successfully updated themeConfig:');
    console.log(JSON.parse(updated.themeConfig));
  } catch (err) {
    console.error('Error updating event:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
