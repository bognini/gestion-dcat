import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/boutique-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendMail } from '@/lib/mail';
import { verifyCaptcha } from '@/lib/captcha';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`boutique-register:${ip}`, { maxRequests: 5, windowSeconds: 600 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const { nom, prenom, email, telephone, password, adresse, ville, captchaToken, captchaAnswer } = await request.json();

    // Validate CAPTCHA
    if (!captchaToken || !captchaAnswer) {
      return NextResponse.json({ error: 'Veuillez compléter le captcha' }, { status: 400 });
    }
    const captchaResult = verifyCaptcha(captchaToken, String(captchaAnswer));
    if (!captchaResult.valid) {
      return NextResponse.json({ error: captchaResult.error || 'Captcha invalide' }, { status: 400 });
    }

    if (!nom || !email || !telephone || !password) {
      return NextResponse.json({ error: 'Nom, email, téléphone et mot de passe sont requis' }, { status: 400 });
    }

    if (nom.length > 100 || (prenom && prenom.length > 100) || email.length > 254 || telephone.length > 30 || password.length < 6) {
      return NextResponse.json({ error: 'Données invalides. Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.clientBoutique.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse email' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create client boutique account
    const clientBoutique = await prisma.clientBoutique.create({
      data: {
        nom: nom.trim(),
        prenom: prenom?.trim() || null,
        email: email.toLowerCase().trim(),
        telephone: telephone.trim(),
        passwordHash: hashedPassword,
        adresse: adresse?.trim() || null,
        ville: ville?.trim() || null,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpires,
      },
    });

    // Also create/link internal Client record
    let clientRecord = await prisma.client.findFirst({
      where: { OR: [{ telephone: telephone.trim() }, { email: email.toLowerCase().trim() }] },
    });

    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          nom: nom.trim(),
          prenom: prenom?.trim() || null,
          email: email.toLowerCase().trim(),
          telephone: telephone.trim(),
          adresse: adresse?.trim() || null,
          ville: ville?.trim() || null,
        },
      });
    }

    await prisma.clientBoutique.update({
      where: { id: clientBoutique.id },
      data: { clientId: clientRecord.id },
    });

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyLink = `${appUrl}/boutique/verify-email?token=${verificationToken}`;

    const emailSent = await sendMail(
      email.toLowerCase().trim(),
      'Vérifiez votre adresse email - DCAT E-Market',
      `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">DCAT E-Market</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Bienvenue ${nom} !</h2>
          <p>Merci de vous être inscrit(e) sur DCAT E-Market.</p>
          <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez ce lien :<br>
            <a href="${verifyLink}" style="color: #2563eb;">${verifyLink}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">Ce lien expire dans 24 heures.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Si vous n'avez pas créé ce compte, ignorez cet email.
          </p>
        </div>
      </body>
      </html>
      `
    );

    if (!emailSent) {
      console.error('BOUTIQUE REGISTER: Failed to send verification email to', email, '- rolling back account creation');
      // Rollback: delete the boutique account since verification is mandatory
      await prisma.clientBoutique.delete({ where: { id: clientBoutique.id } }).catch(() => {});
      return NextResponse.json({
        error: 'Impossible d\'envoyer l\'email de vérification. Veuillez réessayer plus tard ou contacter le support.',
      }, { status: 503 });
    }

    return NextResponse.json({
      message: 'Compte créé. Vérifiez votre boîte email pour activer votre compte.',
      id: clientBoutique.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering boutique client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
