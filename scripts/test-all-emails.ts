import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { sendVerificationEmail, sendPasswordResetEmail, sendSecurityAlertEmail } from '../src/lib/mail/mailer';

async function testAllEmails() {
  const recipient = 'ghosh.debsmit1611@gmail.com';
  console.log(`Sending verification, reset, and alert emails to: ${recipient}...`);

  console.log('\n1. Testing sendVerificationEmail...');
  const vResult = await sendVerificationEmail(recipient, 'Debsmit Ghosh', 'sample-verification-token-123456');
  console.log('sendVerificationEmail result:', vResult ? 'SUCCESS ✅' : 'FAILED ❌');

  console.log('\n2. Testing sendPasswordResetEmail...');
  const rResult = await sendPasswordResetEmail(recipient, 'Debsmit Ghosh', 'sample-reset-token-abcdef');
  console.log('sendPasswordResetEmail result:', rResult ? 'SUCCESS ✅' : 'FAILED ❌');

  console.log('\n3. Testing sendSecurityAlertEmail...');
  const aResult = await sendSecurityAlertEmail(recipient, 'Debsmit Ghosh', 'New Login to Avyantrix ID', 'A new sign-in was recorded from a Windows device on Chrome at 18:35 IST.');
  console.log('sendSecurityAlertEmail result:', aResult ? 'SUCCESS ✅' : 'FAILED ❌');
}

testAllEmails();

