import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { sendNotificationEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const produitId = request.nextUrl.searchParams.get('produitId');
    const type = request.nextUrl.searchParams.get('type');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (produitId) where.produitId = produitId;
    if (type) where.type = type;

    const mouvements = await prisma.mouvementStock.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        date: true,
        type: true,
        quantite: true,
        commentaire: true,
        destination: true,
        prixVenteDefinitif: true,
        etat: true,
        produit: { select: { id: true, nom: true, sku: true } },
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        fournisseur: { select: { id: true, nom: true } },
        demandeur: { select: { id: true, nom: true, prenom: true } },
        partenaireDst: { select: { id: true, nom: true } },
        projet: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json(mouvements);
  } catch (error) {
    console.error('Error fetching mouvements:', error);
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

    if (!data.produitId) {
      return NextResponse.json({ error: 'Le produit est requis' }, { status: 400 });
    }

    if (!data.type || !['ENTREE', 'SORTIE'].includes(data.type)) {
      return NextResponse.json({ error: 'Le type doit être ENTREE ou SORTIE' }, { status: 400 });
    }

    if (!data.quantite || data.quantite <= 0) {
      return NextResponse.json({ error: 'La quantité doit être positive' }, { status: 400 });
    }

    // Get current product
    const produit = await prisma.produit.findUnique({
      where: { id: data.produitId },
    });

    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Check if we have enough stock for exit
    if (data.type === 'SORTIE' && produit.quantite < data.quantite) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${produit.quantite}` 
      }, { status: 400 });
    }

    // Calculate new quantity
    const newQuantite = data.type === 'ENTREE' 
      ? produit.quantite + data.quantite 
      : produit.quantite - data.quantite;

    // Create movement and update product in transaction
    const [mouvement] = await prisma.$transaction([
      prisma.mouvementStock.create({
        data: {
          type: data.type,
          quantite: data.quantite,
          produitId: data.produitId,
          utilisateurId: user.id,
          // Entry-specific
          fournisseurId: data.fournisseurId || null,
          etat: data.etat || null,
          // Exit-specific
          demandeurId: data.demandeurId || null,
          prixVenteDefinitif: data.prixVenteDefinitif || null,
          destinationType: data.destinationType || null,
          partenaireDstId: data.partenaireDstId || null,
          destination: data.destination?.trim() || null,
          destinationContact: data.destinationContact?.trim() || null,
          // Common
          projetId: data.projetId || null,
          serialNumbers: data.serialNumbers || [],
          commentaire: data.commentaire?.trim() || null,
        },
        include: {
          produit: { select: { id: true, nom: true, sku: true } },
          utilisateur: { select: { id: true, nom: true, prenom: true } },
          fournisseur: { select: { id: true, nom: true } },
          demandeur: { select: { id: true, nom: true, prenom: true } },
          partenaireDst: { select: { id: true, nom: true } },
        },
      }),
      prisma.produit.update({
        where: { id: data.produitId },
        data: { quantite: newQuantite },
      }),
    ]);

    // Check for low stock alert (only on SORTIE)
    if (data.type === 'SORTIE' && produit.seuilAlerte && newQuantite <= produit.seuilAlerte) {
      sendNotificationEmail(
        'low_stock',
        `⚠️ Alerte stock faible: ${produit.nom}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Alerte Stock Faible</h2>
            <p>Le stock d'un produit est passé sous le seuil d'alerte.</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Produit</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${produit.nom}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">SKU</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${produit.sku || '-'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Quantité actuelle</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${newQuantite}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Seuil d'alerte</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${produit.seuilAlerte}</td></tr>
            </table>
            <p style="margin-top: 16px;">Veuillez réapprovisionner ce produit dès que possible.</p>
            <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Cette notification a été envoyée automatiquement par Gestion DCAT.</p>
          </div>
        `
      ).catch(console.error);
    }

    return NextResponse.json(mouvement);
  } catch (error) {
    console.error('Error creating mouvement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
