import nodemailer from 'nodemailer';

async function testSend() {
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
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('[SUCCESS] Transporter verified.');

    console.log('Attempting to send email from "Avyantrix ID <noreply@avyantrix.com>" to "test@avyantrix.com"...');
    // Note: If we don't want to actually send to an external recipient or if test recipient doesn't exist, we can test envelope or self delivery.
    const info = await transporter.sendMail({
      from: '"Avyantrix ID" <noreply@avyantrix.com>',
      to: 'admin@avyantrix.com',
      subject: 'Avyantrix Auth SMTP Integration Test',
      text: 'This is a test verification email from Avyantrix Auth system.',
      html: '<b>This is a test verification email from Avyantrix Auth system.</b>',
    });

    console.log('[SUCCESS] Email sent:', info.messageId, info.response);
  } catch (err) {
    console.error('[ERROR] Sending email failed:', err);
  }
}

testSend();
