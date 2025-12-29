import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateReference() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WEB-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, entreprise, email, telephone, adresse, message, lignes } = body;

    // Validate required fields
    if (!nom || (!email && !telephone)) {
      return NextResponse.json(
        { error: 'Informations manquantes' },
        { status: 400 }
      );
    }

    // Find a user to assign the devis to (System user or Admin)
    const systemUser = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'admin' },
          { role: 'commercial' },
          { isActive: true }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!systemUser) {
      console.error('No system user found to assign quote');
      return NextResponse.json(
        { error: 'Erreur configuration système' },
        { status: 500 }
      );
    }

    // Prepare content
    const reference = generateReference();
    const clientName = entreprise || nom;
    const contactInfo = [
      entreprise ? `Contact: ${nom}` : null,
      email ? `Email: ${email}` : null,
      telephone ? `Tél: ${telephone}` : null,
      adresse ? `Adresse: ${adresse}` : null
    ].filter(Boolean).join(' | ');

    // Create lines for requested products
    const devisLignes = lignes.map((l: any, index: number) => ({
      ordre: index + 1,
      reference: 'WEB-REQ',
      designation: l.description,
      quantite: l.quantite || 1,
      prixUnitaire: 0,
      montant: 0,
      unite: 'u'
    }));

    // Add a line for the message/details if present
    if (message) {
      devisLignes.push({
        ordre: devisLignes.length + 1,
        reference: 'NOTE',
        designation: 'Message du client',
        details: message,
        quantite: 1,
        prixUnitaire: 0,
        montant: 0,
        unite: 'u'
      });
    }

    // Add contact info as a note line
    devisLignes.push({
      ordre: devisLignes.length + 1,
      reference: 'INFO',
      designation: 'Informations de contact',
      details: contactInfo,
      quantite: 1,
      prixUnitaire: 0,
      montant: 0,
      unite: 'u'
    });

    const devis = await prisma.devis.create({
      data: {
        reference,
        objet: `Demande de devis Web - ${clientName}`,
        clientType: entreprise ? 'entreprise' : 'particulier',
        clientNom: clientName,
        clientAdresse: adresse || null,
        clientEmail: email || null,
        clientTelephone: telephone || null,
        statut: 'brouillon',
        validiteOffre: 15, // Default validity for web requests
        createdById: systemUser.id,
        lignes: {
          create: devisLignes
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      reference: devis.reference 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}
