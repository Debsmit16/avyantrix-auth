import nodemailer from 'nodemailer';

async function testNoReply() {
  console.log('--- Testing noreply@avyantrix.com SMTPS ---');
  const transporter = nodemailer.createTransport({
    host: 'mail.avyantrix.com',
    port: 465,
    secure: true,
    auth: {
      user: 'noreply@avyantrix.com',
      pass: 'AvyantrixNoReply2026!#Auth',
    },
    tls: {
      rejectUnauthorized: false,
    }
  });

  try {
    await transporter.verify();
    console.log('[SUCCESS] noreply@avyantrix.com verified on port 465 SMTPS!');

    const info = await transporter.sendMail({
      from: '"Avyantrix ID" <noreply@avyantrix.com>',
      to: 'debsmitmondal2006@gmail.com',
      subject: 'Avyantrix Auth - noreply@avyantrix.com Verification Test',
      text: 'Hello! This email confirms that noreply@avyantrix.com is fully active on Stalwart Mail Server.',
      html: '<h3>Hello!</h3><p>This email confirms that <b>noreply@avyantrix.com</b> is fully active and authenticated on <code>mail.avyantrix.com</code>.</p>',
    });

    console.log('[SUCCESS] Email sent from noreply@avyantrix.com! MessageId:', info.messageId);
    return true;
  } catch (err) {
    console.error('[FAILED] noreply@avyantrix.com:', err.message);
    return false;
  }
}

testNoReply();
