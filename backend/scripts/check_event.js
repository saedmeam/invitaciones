const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const event = await prisma.event.findFirst({
    where: { slug: 'joselin-y-santiago-2027' }
  });
  console.log(JSON.stringify(event, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
