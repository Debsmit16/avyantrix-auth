import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendMagicLinkEmail,
  sendSecurityAlertEmail,
} from "../src/lib/mail/mailer";

async function run() {
  const recipient = "shadow.ujan@gmail.com";
  console.log(`\n========================================`);
  console.log(`Starting End-to-End Mailer Pipeline Test`);
  console.log(`Recipient: ${recipient}`);
  console.log(`SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`========================================\n`);

  console.log("1. Testing sendVerificationEmail...");
  const vOk = await sendVerificationEmail(recipient, "Test Builder", "diag-token-123456");
  console.log("   Result:", vOk ? "SUCCESS (Dispatched & Accepted)" : "FAILED");

  console.log("\n2. Testing sendPasswordResetEmail...");
  const pOk = await sendPasswordResetEmail(recipient, "Test Builder", "reset-token-abcdef");
  console.log("   Result:", pOk ? "SUCCESS (Dispatched & Accepted)" : "FAILED");

  console.log("\n3. Testing sendWelcomeEmail...");
  const wOk = await sendWelcomeEmail(recipient, "Test Builder", "testbuilder");
  console.log("   Result:", wOk ? "SUCCESS (Dispatched & Accepted)" : "FAILED");

  console.log("\n========================================");
  console.log("All mailer tests finished!");
  console.log("========================================\n");
}

run().catch(console.error);
