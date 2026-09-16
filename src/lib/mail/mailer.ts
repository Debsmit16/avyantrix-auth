import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "mail.avyantrix.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "no-reply@avyantrix.com";
  const pass = process.env.SMTP_PASSWORD || "";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

function getFromHeader() {
  return process.env.SMTP_FROM || `Avyantrix ID <${process.env.SMTP_USER || "hello@avyantrix.com"}>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 40px 20px; }
    .container { max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid #27272A; border-radius: 12px; padding: 36px; }
    .logo { font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; margin-bottom: 24px; }
    .logo span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AVYANTRIX<span>.</span> AUTH</div>
    <h1>Verify your Avyantrix account</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>Thank you for creating your central Avyantrix ID. Please verify your email address to activate your account and gain access to Avyantrix Builds, Challenges, and future platforms.</p>
    <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
    <p style="margin-top: 24px; font-size: 13px; color: #71717A;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Avyantrix Engineering Collective. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: "Verify your Avyantrix Identity",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", (error as Error).message);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 40px 20px; }
    .container { max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid #27272A; border-radius: 12px; padding: 36px; }
    .logo { font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; margin-bottom: 24px; }
    .logo span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AVYANTRIX<span>.</span> AUTH</div>
    <h1>Reset your Avyantrix password</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>We received a request to reset the password for your Avyantrix ID. Click the button below to choose a new password:</p>
    <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    <p style="margin-top: 24px; font-size: 13px; color: #71717A;">This link is valid for 1 hour and can only be used once. If you did not request a password reset, your account is safe and no action is required.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Avyantrix Engineering Collective. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: "Reset your Avyantrix Password",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", (error as Error).message);
    return false;
  }
}

export async function sendSecurityAlertEmail(
  to: string,
  name: string,
  alertTitle: string,
  alertDetails: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 40px 20px; }
    .container { max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid #EF4444; border-radius: 12px; padding: 36px; }
    .logo { font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; margin-bottom: 24px; }
    .logo span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #EF4444; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AVYANTRIX<span>.</span> AUTH</div>
    <h1>Security Notification: ${alertTitle}</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>${alertDetails}</p>
    <p>If you made this change, you can safely disregard this message. If you did NOT authorize this action, please sign in to <a href="${process.env.NEXT_PUBLIC_APP_URL}/security" style="color:#EF4444;">https://auth.avyantrix.com/security</a> immediately and revoke all active sessions.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Avyantrix Engineering Collective. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: `[Security Alert] ${alertTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send security alert email:", (error as Error).message);
    return false;
  }
}
