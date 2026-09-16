import nodemailer from 'nodemailer';

async function testUser(user, pass) {
  console.log(`\n--- Testing user: ${user} ---`);
  const transporter = nodemailer.createTransport({
    host: 'mail.avyantrix.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log(`[SUCCESS] ${user} verified on port 465 SMTPS!`);

    const info = await transporter.sendMail({
      from: `"Avyantrix ID" <${user}>`,
      to: 'debsmitmondal2006@gmail.com',
      subject: 'Avyantrix Auth SMTP Integration Verification',
      text: `Hello! This is a test email sent from ${user} on mail.avyantrix.com.`,
      html: `<b>Hello!</b><p>This is a verified test email sent from <code>${user}</code> on <code>mail.avyantrix.com</code>.</p>`,
    });
    console.log(`[SUCCESS] Email sent from ${user}! MessageId:`, info.messageId);
    return true;
  } catch (err) {
    console.log(`[FAILED] ${user}:`, err.message);
    return false;
  }
}

async function run() {
  await testUser('hr@avyantrix.com', 'Debsmit@16112003');
  await testUser('hello@avyantrix.com', 'hs3fqjJzSURL4ZY5M1!');
  await testUser('team@avyantrix.com', 'FtD6WEzA86bbxbPGM1!');
}

run();
