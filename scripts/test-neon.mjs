import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Neon DB connection...');
  const roles = await prisma.role.findMany();
  console.log('Roles in DB:', roles.map(r => r.name));
  const clients = await prisma.oAuthClient.findMany();
  console.log('OAuth Clients in DB:', clients.map(c => ({ id: c.clientId, name: c.name })));
  const users = await prisma.user.findMany({ 
    select: { 
      id: true, 
      email: true, 
      emailVerified: true,
      profile: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
        }
      }
    } 
  });
  console.log(`Users in DB (${users.length}):`, JSON.stringify(users, null, 2));
}

main()
  .catch(err => {
    console.error('Error connecting to Neon DB:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
