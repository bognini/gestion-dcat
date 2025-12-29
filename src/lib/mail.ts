import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  secure: boolean;
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getNotificationRecipients(eventKey: string): Promise<string[]> {
  const key = eventKey.trim();
  if (!key) return [];

  try {
    const perEvent = await prisma.notificationEmailList.findUnique({
      where: { eventKey: key },
      select: { emails: true },
    });

    if (perEvent) {
      return (perEvent.emails || []).map((e) => e.trim()).filter(Boolean).filter(isLikelyEmail);
    }

    const mailConfig = await prisma.mailConfig.findFirst({
      select: { notificationEmails: true },
    });
    const fallback = (mailConfig?.notificationEmails || []).map((e) => e.trim()).filter(Boolean);
    return fallback.filter(isLikelyEmail);
  } catch (error) {
    console.error('Error resolving notification recipients:', error);
    return [];
  }
}

export async function sendNotificationEmail(
  eventKey: string,
  subject: string,
  html: string
): Promise<{ sent: number; total: number }>{
  const recipients = await getNotificationRecipients(eventKey);
  const total = recipients.length;
  if (total === 0) return { sent: 0, total: 0 };

  const ok = await sendMail(recipients.join(', '), subject, html);
  return { sent: ok ? total : 0, total };
}

async function getMailConfig(): Promise<MailConfig | null> {
  const config = await prisma.mailConfig.findFirst();
  
  if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPass) {
    // Fallback to environment variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || 'noreply@dcat.ci',
        fromName: 'Gestion DCAT',
        secure: process.env.SMTP_PORT === '465',
      };
    }
    return null;
  }

  return {
    host: config.smtpHost,
    port: config.smtpPort || 587,
    user: config.smtpUser,
    pass: config.smtpPass,
    from: config.smtpFrom || 'noreply@dcat.ci',
    fromName: config.smtpFromName || 'Gestion DCAT',
    secure: config.smtpSecure,
  };
}

async function createTransporter() {
  const config = await getMailConfig();
  if (!config) {
    throw new Error('Configuration SMTP non disponible');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const config = await getMailConfig();
    if (!config) {
      console.error('SMTP not configured');
      return false;
    }

    const transporter = await createTransporter();
    
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendInvitationEmail(
  email: string,
  nom: string,
  inviteToken: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://testerp.dcat.ci';
  const inviteLink = `${appUrl}/register?token=${inviteToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Gestion DCAT</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Bienvenue ${nom} !</h2>
        <p>Vous avez été invité(e) à rejoindre l'application de gestion DCAT.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer votre compte :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Créer mon compte
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Ce lien expire dans 7 jours.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Cet email a été envoyé automatiquement par l'application Gestion DCAT.<br>
          Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendMail(email, 'Invitation à rejoindre Gestion DCAT', html);
}

export async function sendPasswordResetEmail(
  email: string,
  nom: string,
  resetToken: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://testerp.dcat.ci';
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Gestion DCAT</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Réinitialisation du mot de passe</h2>
        <p>Bonjour ${nom},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Ce lien expire dans 1 heure.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.<br>
          Votre mot de passe restera inchangé.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendMail(email, 'Réinitialisation de votre mot de passe - Gestion DCAT', html);
}

export async function sendReminderEmail(
  email: string,
  nom: string,
  eventTitle: string,
  eventDate: Date,
  eventLocation?: string
): Promise<boolean> {
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Rappel d'événement</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Bonjour ${nom},</h2>
        <p>Ceci est un rappel pour l'événement suivant :</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${eventTitle}</h3>
          <p style="margin: 5px 0; color: #4b5563;">
            <strong>Date :</strong> ${formattedDate}
          </p>
          ${eventLocation ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Lieu :</strong> ${eventLocation}</p>` : ''}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Cet email a été envoyé automatiquement par l'application Gestion DCAT.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendMail(email, `Rappel : ${eventTitle}`, html);
}
