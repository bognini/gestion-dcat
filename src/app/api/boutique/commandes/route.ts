import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function generateReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EM${year}${month}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 orders per 5 minutes per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`order:${ip}`, { maxRequests: 10, windowSeconds: 300 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de commandes. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { client, adresseLivraison, modePaiement, notes, lignes } = body;

    // Validate required fields
    if (!client?.nom || !client?.telephone || !lignes?.length) {
      return NextResponse.json(
        { error: 'Informations manquantes' },
        { status: 400 }
      );
    }

    // Input length validation
    if (client.nom.length > 200 || client.telephone.length > 30 || (client.email && client.email.length > 254)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    if (lignes.length > 50) {
      return NextResponse.json({ error: 'Trop de lignes dans la commande' }, { status: 400 });
    }

    // Find or create client
    let clientRecord = await prisma.client.findFirst({
      where: {
        OR: [
          { telephone: client.telephone },
          client.email ? { email: client.email } : {},
        ],
      },
    });

    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          nom: client.nom,
          prenom: client.prenom || null,
          email: client.email || null,
          telephone: client.telephone,
          ville: client.ville || null,
        },
      });
    }

    // Calculate totals
    let totalHT = 0;
    const lignesData = [];

    // Fetch products to verify prices and stock
    const productIds = lignes.map((l: any) => l.produitId);
    const products = await prisma.produit.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        nom: true,
        prixVente: true,
        prixVenteMin: true,
        promoPrice: true,
        promoStart: true,
        promoEnd: true,
        quantite: true,
        isPublished: true,
      }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    for (const ligne of lignes) {
      const product = productMap.get(ligne.produitId);

      if (!product) {
        return NextResponse.json(
          { error: `Produit introuvable: ${ligne.designation}` },
          { status: 400 }
        );
      }

      if (!product.isPublished) {
        return NextResponse.json(
          { error: `Le produit "${product.nom}" n'est plus disponible` },
          { status: 400 }
        );
      }

      if (product.quantite < ligne.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${product.nom}" (Disponible: ${product.quantite})` },
          { status: 400 }
        );
      }

      // Determine valid price (same logic as frontend)
      const basePrice = product.prixVenteMin || product.prixVente || 0;
      let finalPrice = basePrice;
      
      const now = new Date();
      const isPromoValid = 
        product.promoPrice && 
        product.promoPrice > 0 && 
        basePrice > 0 && 
        product.promoPrice < basePrice &&
        (!product.promoStart || new Date(product.promoStart) <= now) &&
        (!product.promoEnd || new Date(product.promoEnd) >= now);
        
      if (isPromoValid && product.promoPrice) {
        finalPrice = product.promoPrice;
      }

      const montant = ligne.quantite * finalPrice;
      totalHT += montant;

      lignesData.push({
        produitId: ligne.produitId,
        designation: product.nom,
        quantite: ligne.quantite,
        prixUnitaire: finalPrice,
        montant,
      });
    }

    // Create order
    const commande = await prisma.commande.create({
      data: {
        reference: generateReference(),
        clientId: clientRecord.id,
        date: new Date(),
        statut: 'en_attente',
        statutPaiement: 'en_attente',
        modePaiement: modePaiement || null,
        adresseLivraison: adresseLivraison || null,
        notes: notes || null,
        totalHT,
        totalTTC: totalHT, // No tax for now
        lignes: {
          create: lignesData,
        },
      },
      include: {
        client: true,
        lignes: true,
      },
    });

    // Update product stock
    for (const ligne of lignes) {
      await prisma.produit.update({
        where: { id: ligne.produitId },
        data: {
          quantite: {
            decrement: ligne.quantite,
          },
        },
      });
    }

    return NextResponse.json(commande, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    );
  }
}
