import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();

    // Get existing config or use provided values
    const existingConfig = await prisma.mailConfig.findFirst();

    const smtpHost = data.smtpHost || existingConfig?.smtpHost;
    const smtpPort = parseInt(data.smtpPort) || existingConfig?.smtpPort || 587;
    const smtpUser = data.smtpUser || existingConfig?.smtpUser;
    const smtpPass = data.smtpPassword || existingConfig?.smtpPass;
    const smtpSecure = data.smtpSecure ?? existingConfig?.smtpSecure ?? false;
    const senderEmail = data.senderEmail || existingConfig?.smtpFrom || 'noreply@dcat.ci';
    const senderName = data.senderName || existingConfig?.smtpFromName || 'Gestion DCAT';

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ 
        error: 'Configuration SMTP incomplète. Veuillez renseigner le serveur, l\'utilisateur et le mot de passe.' 
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    // Verify connection
    await transporter.verify();

    // Send test email to the user
    const testEmail = data.testEmail || user.email;
    
    if (testEmail) {
      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: testEmail,
        subject: '✅ Test SMTP - Gestion DCAT',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; text-align: center;">✅ Test SMTP Réussi</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Bonjour,</p>
              <p>Ce message confirme que votre configuration SMTP est correctement paramétrée.</p>
              <table style="width: 100%; margin: 20px 0;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Serveur:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${smtpHost}:${smtpPort}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Utilisateur:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${smtpUser}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>SSL/TLS:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${smtpSecure ? 'Activé' : 'Désactivé'}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Date du test:</strong></td><td style="padding: 8px 0;">${new Date().toLocaleString('fr-FR')}</td></tr>
              </table>
              <p style="color: #6b7280; font-size: 12px;">Les notifications par e-mail fonctionneront correctement avec cette configuration.</p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({ 
        success: true, 
        message: `Connexion SMTP réussie. Un email de test a été envoyé à ${testEmail}.` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connexion SMTP réussie. Le serveur de messagerie est correctement configuré.' 
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Provide user-friendly error messages
    let userMessage = 'Impossible de se connecter au serveur SMTP.';
    if (errorMessage.includes('ECONNREFUSED')) {
      userMessage = 'Connexion refusée. Vérifiez le serveur et le port.';
    } else if (errorMessage.includes('ETIMEDOUT')) {
      userMessage = 'Délai d\'attente dépassé. Le serveur ne répond pas.';
    } else if (errorMessage.includes('ENOTFOUND')) {
      userMessage = 'Serveur introuvable. Vérifiez l\'adresse du serveur SMTP.';
    } else if (errorMessage.includes('auth') || errorMessage.includes('AUTH')) {
      userMessage = 'Échec de l\'authentification. Vérifiez l\'utilisateur et le mot de passe.';
    } else if (errorMessage.includes('certificate')) {
      userMessage = 'Erreur de certificat SSL. Essayez de désactiver SSL/TLS ou vérifiez le certificat.';
    }

    return NextResponse.json({ 
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 });
  }
}
