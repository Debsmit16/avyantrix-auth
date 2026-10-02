import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "mail.avyantrix.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "noreply@avyantrix.com";
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

interface EmailLayoutOptions {
  preheader?: string;
  badge?: {
    text: string;
    variant?: "red" | "green" | "amber";
  };
  contentHtml: string;
}

/**
 * Bulletproof full-bleed email layout compatible with Gmail (Desktop White & Dark mode),
 * Apple Mail, Outlook, iOS, and Android.
 */
function renderEmailLayout({ preheader, badge, contentHtml }: EmailLayoutOptions): string {
  const badgeColors = {
    red: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#F87171" },
    green: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)", text: "#34D399" },
    amber: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", text: "#FBBF24" },
  };

  const selectedBadge = badge ? badgeColors[badge.variant || "red"] : null;
  const badgeHtml =
    badge && selectedBadge
      ? `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: ${selectedBadge.bg}; border: 1px solid ${selectedBadge.border}; color: ${selectedBadge.text}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${badge.text}
      </span>
    </div>
  `
      : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Avyantrix ID</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100%; background-color: #09090B !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body bgcolor="#09090B" style="margin: 0; padding: 0; width: 100% !important; background-color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
  
  <!-- OUTER FULL-WIDTH TABLE: Guarantees dark frame in desktop white mode Gmail -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090B" style="background-color: #09090B; width: 100% !important; min-width: 100%; margin: 0; padding: 48px 16px; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #09090B; padding: 0;">
        
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
        <tr>
        <td align="center" valign="top" width="560">
        <![endif]-->
        
        <!-- CARD CONTAINER -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #121215; border: 1px solid #27272A; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); text-align: left;">
          <tr>
            <td style="padding: 40px 36px; background-color: #121215;">
              
              <!-- BRAND HEADER (TABLE BASED FOR ZERO COLLAPSE) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="${LOGO_URL}" alt="Avyantrix" width="36" height="36" style="width: 36px; height: 36px; border-radius: 8px; border: 1px solid #27272A; display: block; background-color: #000000;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 17px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: inline-block;">AVYANTRIX<span style="color: #EF4444;">.</span> AUTH</span>
                  </td>
                </tr>
              </table>

              ${badgeHtml}

              <!-- CONTENT -->
              ${contentHtml}

              <!-- FOOTER -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #27272A;">
                <tr>
                  <td style="font-size: 11px; line-height: 1.6; color: #71717A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <p style="margin: 0 0 6px 0; color: #71717A;">Please do not reply to this email. This address is automated and unmonitored.</p>
                    <p style="margin: 0; color: #52525B;">&copy; ${new Date().getFullYear()} Avyantrix Engineering Collective. All rights reserved.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/verify-email?token=${token}`;

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">Verify your Avyantrix account</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Builder"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 28px 0;">Thank you for creating your central Avyantrix ID. Please verify your email address to activate your account and gain access to Avyantrix Builds, Challenges, and future platforms.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Verify Email Address &rarr;</a>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 13px; line-height: 1.5; color: #71717A; margin: 0;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  `;

  const html = renderEmailLayout({
    preheader: "Activate your Avyantrix ID account and verify your email.",
    contentHtml,
  });

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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/reset-password?token=${token}`;

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">Reset your Avyantrix password</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Builder"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 28px 0;">We received a request to reset the password for your Avyantrix ID. Click the button below to choose a new secure password:</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Reset Password &rarr;</a>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 13px; line-height: 1.5; color: #71717A; margin: 0;">This link is valid for 1 hour and can only be used once. If you did not request a password reset, your account is safe and no action is required.</p>
  `;

  const html = renderEmailLayout({
    preheader: "Reset instructions for your Avyantrix ID password.",
    contentHtml,
  });

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

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">🎉 Verification Approved</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Operative"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 24px 0;">Great news! Your verification request for <strong>${trackTitle}</strong> has been reviewed and officially approved by the Avyantrix team.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181B; border: 1px solid #27272A; border-left: 4px solid #10B981; border-radius: 8px; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 18px;">
          <div style="font-size: 15px; font-weight: 700; color: #10B981; margin: 0 0 6px 0;">&#10003; ${badgeLabel || "Verified Badge Issued"}</div>
          <p style="font-size: 13px; color: #D4D4D8; margin: 0; line-height: 1.5;">Your public profile and ecosystem permissions have been upgraded with verified privileges across Avyantrix Builds, Challenges, and partner portals.</p>
        </td>
      </tr>
    </table>

    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 28px 0;">You can now access your role workspace, manage briefs, advisory channels, or build solutions with full verified privileges.</p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Open Avyantrix Dashboard &rarr;</a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    preheader: `Congratulations! Your verification for ${trackTitle} has been approved.`,
    badge: { text: "Clearance Granted", variant: "green" },
    contentHtml,
  });

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

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">Verification Update: Additional Proof Needed</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Operative"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 24px 0;">Thank you for submitting your verification request for <strong>${trackTitle}</strong>. Our technical review team has evaluated your submission and requested additional details or updated links before clearance can be granted.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181B; border: 1px solid #3F3F46; border-left: 4px solid #F59E0B; border-radius: 8px; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 18px;">
          <div style="font-size: 14px; font-weight: 700; color: #F59E0B; margin: 0 0 8px 0;">Reviewer Feedback:</div>
          <div style="font-size: 13px; color: #E4E4E7; margin: 0; line-height: 1.6; white-space: pre-line;">${feedback || "Please ensure your code repositories are public or provide accessible live demo and portfolio links."}</div>
        </td>
      </tr>
    </table>

    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 28px 0;">You can update your proof links, credentials, or portfolio directly in the Verification Hub and re-submit for expedited review.</p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Update & Re-Submit Verification Proof &rarr;</a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    preheader: `Update regarding your Avyantrix verification for ${trackTitle}.`,
    badge: { text: "Action Required", variant: "amber" },
    contentHtml,
  });

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
  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #EF4444; letter-spacing: -0.5px; line-height: 1.3;">Security Notification: ${alertTitle}</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Builder"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin: 0 0 24px 0;">${alertDetails}</p>
    <p style="font-size: 13px; line-height: 1.6; color: #A1A1AA; margin: 0;">If you made this change, you can safely disregard this message. If you did NOT authorize this action, please sign in to <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/security" style="color: #EF4444; text-decoration: underline;">https://auth.avyantrix.com/security</a> immediately and revoke all active sessions.</p>
  `;

  const html = renderEmailLayout({
    preheader: `Security Alert: ${alertTitle}`,
    badge: { text: "Security Alert", variant: "red" },
    contentHtml,
  });

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

export async function sendMagicLinkEmail(to: string, name: string, token: string): Promise<boolean> {
  const magicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/magic-login?token=${token}`;

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">Sign in with Magic Link</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Builder"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 28px 0;">Click the button below to sign in directly to your Avyantrix ID account without entering a password:</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${magicUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Sign In to Avyantrix &rarr;</a>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 13px; line-height: 1.5; color: #71717A; margin: 0;">This magic link will expire in 15 minutes and can only be used once. If you did not request this login link, you can safely ignore this email.</p>
  `;

  const html = renderEmailLayout({
    preheader: "Your password-free magic login link for Avyantrix ID.",
    contentHtml,
  });

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: "Your Avyantrix ID Magic Login Link",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", (error as Error).message);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string, username?: string): Promise<boolean> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com"}/dashboard`;
  const profileHandle = username ? `@${username}` : "Builder";

  const contentHtml = `
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">Welcome to the Avyantrix Ecosystem</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #D4D4D8; margin: 0 0 14px 0;">Hello ${name || "Builder"},</p>
    <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin: 0 0 24px 0;">Your central Avyantrix ID (<strong>${profileHandle}</strong>) has been successfully activated. You now have single sign-on access to all Avyantrix products, hackathons, and builder tools.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181B; border: 1px solid #27272A; border-radius: 8px; margin: 0 0 28px 0;">
      <tr>
        <td style="padding: 20px;">
          
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td width="32" valign="top" style="font-size: 18px; line-height: 1; vertical-align: top;">🛡️</td>
              <td valign="top" style="padding-left: 12px; vertical-align: top;">
                <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-bottom: 2px;">Universal Developer Identity</div>
                <div style="font-size: 13px; color: #A1A1AA; line-height: 1.4;">Use one master account for all current and future Avyantrix portals and partner platforms.</div>
              </td>
            </tr>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td width="32" valign="top" style="font-size: 18px; line-height: 1; vertical-align: top;">⚡</td>
              <td valign="top" style="padding-left: 12px; vertical-align: top;">
                <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-bottom: 2px;">Clearance Verification Hub</div>
                <div style="font-size: 13px; color: #A1A1AA; line-height: 1.4;">Submit proof to earn verified clearances across Builder, Mentor, and Enterprise Problem Owner tracks.</div>
              </td>
            </tr>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="32" valign="top" style="font-size: 18px; line-height: 1; vertical-align: top;">🔒</td>
              <td valign="top" style="padding-left: 12px; vertical-align: top;">
                <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-bottom: 2px;">Enterprise-Grade Security</div>
                <div style="font-size: 13px; color: #A1A1AA; line-height: 1.4;">Protect your profile with two-factor authentication (TOTP) and active session management.</div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #EF4444;">
          <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #EF4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Launch Your Dashboard &rarr;</a>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; line-height: 1.5; color: #71717A; margin: 0;">Need assistance or have feedback? Reach out directly through the portal or join our developer community.</p>
  `;

  const html = renderEmailLayout({
    preheader: "Your central Avyantrix ID is ready. Welcome to the ecosystem.",
    badge: { text: "Central Identity Activated", variant: "red" },
    contentHtml,
  });

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      replyTo: "noreply@avyantrix.com",
      headers: NOREPLY_HEADERS,
      subject: "Welcome to Avyantrix ID — Your Developer Identity is Ready",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", (error as Error).message);
    return false;
  }
}
