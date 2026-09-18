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
  return process.env.SMTP_FROM || `Avyantrix ID <${process.env.SMTP_USER || "noreply@avyantrix.com"}>`;
}

const NOREPLY_HEADERS = {
  "Auto-Submitted": "auto-generated",
  "X-Auto-Response-Suppress": "All",
  "Precedence": "bulk",
};

const LOGO_URL = "https://www.avyantrix.com/brand/avyantrix-logo.png";

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
    .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo-img { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #27272A; background-color: #000000; vertical-align: middle; }
    .logo-text { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 10px; }
    .logo-text span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF !important; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${LOGO_URL}" alt="Avyantrix" class="logo-img" />
      <div class="logo-text">AVYANTRIX<span>.</span> AUTH</div>
    </div>
    <h1>Verify your Avyantrix account</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>Thank you for creating your central Avyantrix ID. Please verify your email address to activate your account and gain access to Avyantrix Builds, Challenges, and future platforms.</p>
    <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
    <p style="margin-top: 24px; font-size: 13px; color: #71717A;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #71717A; font-size: 11px;">Please do not reply to this email. This address is automated and unmonitored. Direct replies cannot be received.</p>
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
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
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
    .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo-img { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #27272A; background-color: #000000; vertical-align: middle; }
    .logo-text { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 10px; }
    .logo-text span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF !important; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${LOGO_URL}" alt="Avyantrix" class="logo-img" />
      <div class="logo-text">AVYANTRIX<span>.</span> AUTH</div>
    </div>
    <h1>Reset your Avyantrix password</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>We received a request to reset the password for your Avyantrix ID. Click the button below to choose a new password:</p>
    <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    <p style="margin-top: 24px; font-size: 13px; color: #71717A;">This link is valid for 1 hour and can only be used once. If you did not request a password reset, your account is safe and no action is required.</p>
    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #71717A; font-size: 11px;">Please do not reply to this email. This address is automated and unmonitored. Direct replies cannot be received.</p>
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
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: "Reset your Avyantrix Password",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", (error as Error).message);
    return false;
  }
}

export async function sendVerificationApprovedEmail(
  to: string,
  name: string,
  category: string,
  badgeLabel: string
): Promise<boolean> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/dashboard`;

  const categoryTitles: Record<string, string> = {
    CAPABILITY_BUILDER: "Builder Capability Clearance",
    MENTOR: "Mentor & Advisory Track",
    PROBLEM_OWNER: "Enterprise Problem Owner Track",
    CHALLENGE_ORGANIZER: "Challenge & Hackathon Organizer Track",
    EDUCATION: "Academic & Research Clearance",
    IDENTITY: "Identity Clearance",
  };

  const trackTitle = categoryTitles[category] || category.replace("_", " ");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #121214; border: 1px solid #27272A; border-radius: 12px; padding: 36px; }
    .logo-container { display: flex; align-items: center; margin-bottom: 24px; }
    .logo-img { width: 40px; height: 40px; border-radius: 8px; border: 1px solid #27272A; background-color: #000000; vertical-align: middle; }
    .logo-text { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 12px; }
    .logo-text span { color: #EF4444; }
    .badge-card { background: #18181B; border: 1px solid #27272A; border-left: 4px solid #10B981; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .badge-title { font-size: 16px; font-weight: 700; color: #10B981; margin: 0 0 6px 0; }
    .badge-meta { font-size: 13px; color: #D4D4D8; margin: 0; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 18px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF !important; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${LOGO_URL}" alt="Avyantrix" class="logo-img" />
      <div class="logo-text">AVYANTRIX<span>.</span> AUTH</div>
    </div>
    <h1>🎉 Verification Approved</h1>
    <p>Hello ${name || "Operative"},</p>
    <p>Great news! Your verification request for <strong>${trackTitle}</strong> has been reviewed and officially approved by the Avyantrix team.</p>
    
    <div class="badge-card">
      <div class="badge-title">&#10003; ${badgeLabel || "Verified Badge Issued"}</div>
      <p class="badge-meta">Your public profile and ecosystem permissions have been upgraded with verified privileges across Avyantrix Builds, Challenges, and partner portals.</p>
    </div>

    <p>You can now access your role workspace, manage briefs, advisory channels, or build solutions with full verified privileges.</p>

    <div style="margin: 28px 0;">
      <a href="${dashboardUrl}" class="button" target="_blank">Open Avyantrix Dashboard</a>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #71717A; font-size: 11px;">Please do not reply to this email. This address is automated and unmonitored. Direct replies cannot be received.</p>
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
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: `🎉 Congratulations! Your Avyantrix ${trackTitle} was Approved`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification approved email:", (error as Error).message);
    return false;
  }
}

export async function sendVerificationRejectedEmail(
  to: string,
  name: string,
  category: string,
  feedback: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/verification?track=${category}`;

  const categoryTitles: Record<string, string> = {
    CAPABILITY_BUILDER: "Builder Capability Clearance",
    MENTOR: "Mentor & Advisory Track",
    PROBLEM_OWNER: "Enterprise Problem Owner Track",
    CHALLENGE_ORGANIZER: "Challenge & Hackathon Organizer Track",
    EDUCATION: "Academic & Research Clearance",
    IDENTITY: "Identity Clearance",
  };

  const trackTitle = categoryTitles[category] || category.replace("_", " ");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #121214; border: 1px solid #27272A; border-radius: 12px; padding: 36px; }
    .logo-container { display: flex; align-items: center; margin-bottom: 24px; }
    .logo-img { width: 40px; height: 40px; border-radius: 8px; border: 1px solid #27272A; background-color: #000000; vertical-align: middle; }
    .logo-text { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 12px; }
    .logo-text span { color: #EF4444; }
    .feedback-card { background: #18181B; border: 1px solid #3F3F46; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .feedback-title { font-size: 14px; font-weight: 700; color: #F59E0B; margin: 0 0 8px 0; }
    .feedback-body { font-size: 13px; color: #E4E4E7; margin: 0; line-height: 1.6; white-space: pre-line; }
    h1 { font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 18px; }
    .button { display: inline-block; background-color: #EF4444; color: #FFFFFF !important; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${LOGO_URL}" alt="Avyantrix" class="logo-img" />
      <div class="logo-text">AVYANTRIX<span>.</span> AUTH</div>
    </div>
    <h1>Verification Update: Additional Proof Needed</h1>
    <p>Hello ${name || "Operative"},</p>
    <p>Thank you for submitting your verification request for <strong>${trackTitle}</strong>. Our technical review team has evaluated your submission and requested additional details or updated links before clearance can be granted.</p>
    
    <div class="feedback-card">
      <div class="feedback-title">Reviewer Feedback:</div>
      <div class="feedback-body">${feedback || "Please ensure your code repositories are public or provide accessible live demo and portfolio links."}</div>
    </div>

    <p>You can update your proof links, credentials, or portfolio directly in the Verification Hub and re-submit for expedited review.</p>

    <div style="margin: 28px 0;">
      <a href="${verificationUrl}" class="button" target="_blank">Update & Re-Submit Verification Proof</a>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #71717A; font-size: 11px;">Please do not reply to this email. This address is automated and unmonitored. Direct replies cannot be received.</p>
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
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: `Verification Status Update for ${trackTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification rejected email:", (error as Error).message);
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
    .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo-img { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #27272A; background-color: #000000; vertical-align: middle; }
    .logo-text { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 10px; }
    .logo-text span { color: #EF4444; }
    h1 { font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #EF4444; }
    p { font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 24px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A; font-size: 12px; color: #71717A; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${LOGO_URL}" alt="Avyantrix" class="logo-img" />
      <div class="logo-text">AVYANTRIX<span>.</span> AUTH</div>
    </div>
    <h1>Security Notification: ${alertTitle}</h1>
    <p>Hello ${name || "Builder"},</p>
    <p>${alertDetails}</p>
    <p>If you made this change, you can safely disregard this message. If you did NOT authorize this action, please sign in to <a href="${process.env.NEXT_PUBLIC_APP_URL}/security" style="color:#EF4444;">https://auth.avyantrix.com/security</a> immediately and revoke all active sessions.</p>
    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #71717A; font-size: 11px;">Please do not reply to this email. This address is automated and unmonitored. Direct replies cannot be received.</p>
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
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: `[Security Alert] ${alertTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send security alert email:", (error as Error).message);
    return false;
  }
}
