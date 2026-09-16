import nodemailer from 'nodemailer';

async function testFromAddress(fromAddress) {
  const transporter = nodemailer.createTransport({
    host: 'mail.avyantrix.com',
    port: 465,
    secure: true,
    auth: {
      user: 'admin',
      pass: 'vk2auVLOKTz67BIpR1!',
    },
    tls: {
      rejectUnauthorized: false,
    }
  });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: 'debsmitmondal2006@gmail.com',
      subject: 'Avyantrix Auth Test',
      text: 'Test',
    });
    console.log(`[SUCCESS] from: ${fromAddress} -> Sent! MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.log(`[FAILED] from: ${fromAddress} -> ${err.message}`);
    return false;
  }
}

async function run() {
  const addresses = [
    'admin@avyantrix.com',
    'admin@mail.avyantrix.com',
    'admin',
    'postmaster@avyantrix.com',
    'postmaster@mail.avyantrix.com',
  ];

  for (const addr of addresses) {
    await testFromAddress(addr);
  }
}

run();
