import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Avyantrix Auth foundation...");

  // 1. Permissions
  const permissions = [
    { name: "user.read", description: "View public profile and user identity" },
    { name: "user.update", description: "Update own profile and settings" },
    { name: "user.delete", description: "Delete own account" },
    { name: "verification.submit", description: "Submit verification requests and evidence" },
    { name: "verification.review", description: "Review and approve/reject verification requests" },
    { name: "problem.create", description: "Create and publish problem statements" },
    { name: "challenge.create", description: "Organize and host engineering challenges" },
    { name: "mentor.access", description: "Access mentor channels and provide reviews" },
    { name: "admin.manage_users", description: "Manage users, suspend accounts, and assign roles" },
    { name: "admin.view_audit", description: "View security audit and login logs" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log("✓ Permissions seeded");

  // 2. Roles & Role-Permission mappings
  const rolesWithPerms = [
    {
      name: "BUILDER",
      description: "Verified builder contributing to Avyantrix projects and solutions",
      permissions: ["user.read", "user.update", "user.delete", "verification.submit"],
    },
    {
      name: "PROBLEM_OWNER",
      description: "Organisation or individual submitting real-world problem statements",
      permissions: ["user.read", "user.update", "problem.create", "verification.submit"],
    },
    {
      name: "CHALLENGE_ORGANIZER",
      description: "Host or partner managing hackathons and competitive challenges",
      permissions: ["user.read", "user.update", "challenge.create", "verification.submit"],
    },
    {
      name: "MENTOR",
      description: "Technical mentor and research advisor guiding builders",
      permissions: ["user.read", "user.update", "mentor.access", "verification.review"],
    },
    {
      name: "ADMIN",
      description: "Avyantrix platform super-administrator with full permissions",
      permissions: [
        "user.read",
        "user.update",
        "user.delete",
        "verification.submit",
        "verification.review",
        "problem.create",
        "challenge.create",
        "mentor.access",
        "admin.manage_users",
        "admin.view_audit",
      ],
    },
  ];

  for (const r of rolesWithPerms) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });

    for (const permName of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  console.log("✓ Roles & Permissions mapped");

  // 3. Technical Skills Taxonomy
  const defaultSkills = [
    { name: "TinyML & Edge AI", category: "AI/ML" },
    { name: "Embedded C/C++", category: "Embedded Hardware" },
    { name: "PCB Design & Altium", category: "Embedded Hardware" },
    { name: "Rust Systems Programming", category: "Systems Software" },
    { name: "Physiological Sensor Interfacing", category: "Biomedical" },
    { name: "Differential Pressure Spirometry", category: "Biomedical" },
    { name: "Next.js & React Architecture", category: "Systems Software" },
    { name: "PostgreSQL & Distributed Data", category: "Systems Software" },
    { name: "LoRaWAN & BLE Telemetry", category: "Embedded Hardware" },
    { name: "FPGA & RTL Verilog", category: "Embedded Hardware" },
  ];

  for (const skill of defaultSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }

  console.log("✓ Skills taxonomy seeded");

  // 4. Register First-Party OAuth Clients (Builds & Challenges)
  const oauthClients = [
    {
      clientId: "avyantrix_builds",
      name: "Avyantrix Builds",
      redirectUris: [
        "https://builds.avyantrix.com/api/auth/callback",
        "http://localhost:3002/api/auth/callback",
      ],
      allowedOrigins: ["https://builds.avyantrix.com", "http://localhost:3002"],
      isFirstParty: true,
    },
    {
      clientId: "avyantrix_challenges",
      name: "Avyantrix Challenges",
      redirectUris: [
        "https://challenges.avyantrix.com/api/auth/callback",
        "http://localhost:3003/api/auth/callback",
      ],
      allowedOrigins: ["https://challenges.avyantrix.com", "http://localhost:3003"],
      isFirstParty: true,
    },
  ];

  for (const client of oauthClients) {
    await prisma.oAuthClient.upsert({
      where: { clientId: client.clientId },
      update: {
        name: client.name,
        redirectUris: client.redirectUris,
        allowedOrigins: client.allowedOrigins,
      },
      create: client,
    });
  }

  console.log("✓ OAuth clients seeded (Builds & Challenges)");
  console.log("🎉 Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
