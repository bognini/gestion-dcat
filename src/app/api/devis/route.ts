import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

// Generate devis reference: YYYYMM/DD-NN where NN is sequential for the day
async function generateReference(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = `${year}${month}/${day}-`;
  
  // Find the highest number for today
  const todayDevis = await prisma.devis.findMany({
    where: {
      reference: {
        startsWith: prefix,
      },
    },
    select: { reference: true },
  });
  
  // Extract numbers and find max (ignore revision letters like -01-A)
  let maxNum = 0;
  todayDevis.forEach(d => {
    const match = d.reference.match(new RegExp(`^${prefix.replace('/', '\\/')}(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  
  const nextNum = String(maxNum + 1).padStart(2, '0');
  return `${prefix}${nextNum}`;
}

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const devisList = await prisma.devis.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reference: true,
        date: true,
        clientNom: true,
        objet: true,
        totalHT: true,
        statut: true,
      },
    });

    return NextResponse.json(devisList);
  } catch (error) {
    console.error('Error fetching devis:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();
    const {
      objet,
      clientType,
      clientNom,
      clientAdresse,
      clientVille,
      clientPays,
      clientEmail,
      clientTelephone,
      partenaireId,
      delaiLivraison,
      conditionLivraison,
      validiteOffre,
      garantie,
      lignes,
      generatePdf,
    } = data;

    // Validate required fields
    if (!objet?.trim()) {
      return NextResponse.json({ error: 'L\'objet du devis est requis' }, { status: 400 });
    }
    if (!clientNom?.trim()) {
      return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 });
    }
    if (!lignes || lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 });
    }

    // Generate unique reference
    const reference = await generateReference();

    // Calculate total
    const totalHT = lignes.reduce((sum: number, l: { montant: number }) => sum + (l.montant || 0), 0);

    // Create devis with lignes
    const devis = await prisma.devis.create({
      data: {
        reference,
        objet,
        clientType,
        clientNom,
        clientAdresse,
        clientVille,
        clientPays: clientPays || 'Côte d\'Ivoire',
        clientEmail,
        clientTelephone,
        partenaireId: partenaireId || null,
        delaiLivraison,
        conditionLivraison,
        validiteOffre: validiteOffre || 30,
        garantie,
        totalHT,
        totalTTC: totalHT, // No TVA for now
        statut: 'brouillon',
        createdById: user.id,
        lignes: {
          create: lignes.map((l: {
            ordre: number;
            produitId?: string;
            reference: string;
            designation: string;
            details?: string;
            quantite: number;
            unite: string;
            prixUnitaire: number;
            montant: number;
          }) => ({
            ordre: l.ordre,
            produitId: l.produitId || null,
            reference: l.reference,
            designation: l.designation,
            details: l.details || null,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: l.prixUnitaire,
            montant: l.montant,
          })),
        },
      },
      include: {
        lignes: true,
      },
    });

    // Generate PDF if requested
    if (generatePdf) {
      // PDF generation will be handled separately
      await prisma.devis.update({
        where: { id: devis.id },
        data: { pdfGenerated: true },
      });
    }

    return NextResponse.json(devis);
  } catch (error) {
    console.error('Error creating devis:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du devis' }, { status: 500 });
  }
}
