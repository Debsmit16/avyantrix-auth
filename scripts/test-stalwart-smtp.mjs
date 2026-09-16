import nodemailer from 'nodemailer';

async function testSmtp(options, name) {
  console.log(`\n--- Testing ${name} ---`);
  console.log(`Host: ${options.host}, Port: ${options.port}, Secure: ${options.secure}, User: ${options.auth.user}`);
  
  const transporter = nodemailer.createTransport(options);

  try {
    const verified = await transporter.verify();
    console.log(`[SUCCESS] ${name} verified:`, verified);
    return true;
  } catch (err) {
    console.log(`[FAILED] ${name}:`, err.message);
    return false;
  }
}

async function run() {
  const passwordsToTest = [
    '8dUpcFFSmBZBZUquB2!',
    'vk2auVLOKTz67BIpR1!',
    '187f60a633b2607b25887fe9f0ec02c2146566ea62d9300f',
  ];

  const usernames = [
    'admin',
    'admin@avyantrix.com',
    'noreply@avyantrix.com',
    'noreply'
  ];

  for (const user of usernames) {
    for (const pass of passwordsToTest) {
      await testSmtp({
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
      }, `Port 465 SMTPS (User: ${user}, Pass: ${pass.substring(0, 4)}...)`);
    }
  }
}

run();
