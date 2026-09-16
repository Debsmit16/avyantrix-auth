import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1] || args[0];
  const secretArg = args.find((a) => a.startsWith("--secret="))?.split("=")[1] || process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!emailArg) {
    console.error("Usage: pnpm run admin:bootstrap --email=user@avyantrix.com [--secret=YOUR_SECRET]");
    process.exit(1);
  }

  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (expectedSecret && secretArg !== expectedSecret) {
    console.error("Error: Invalid ADMIN_BOOTSTRAP_SECRET. Access denied.");
    process.exit(1);
  }

  const targetEmail = emailArg.toLowerCase().trim();
  console.log(`[BOOTSTRAP] Initiating admin provisioning for: ${targetEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    console.error(`Error: User with email '${targetEmail}' not found. Please register first at https://auth.avyantrix.com/register`);
    process.exit(1);
  }

  // Ensure ADMIN role exists in database
  let adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "ADMIN",
        description: "Full system administration and capability verification authority",
      },
    });
  }

  // Mark email verified
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
    console.log(`[BOOTSTRAP] Marked email as verified.`);
  }

  // Assign ADMIN role
  const hasAdmin = user.userRoles.some((ur) => ur.role.name === "ADMIN");
  if (!hasAdmin) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
    console.log(`[BOOTSTRAP] ADMIN role assigned successfully.`);
  } else {
    console.log(`[BOOTSTRAP] User already has ADMIN role.`);
  }

  // Record audit trail event in PostgreSQL
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "ADMIN_GRANTED",
      metadata: {
        method: "cli_bootstrap_script",
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log(`[BOOTSTRAP] Immutable audit event 'ADMIN_GRANTED' logged.`);
  console.log(`[BOOTSTRAP] Admin setup complete for ${targetEmail}. You can now access https://auth.avyantrix.com/admin`);
}

main()
  .catch((e) => {
    console.error("Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
