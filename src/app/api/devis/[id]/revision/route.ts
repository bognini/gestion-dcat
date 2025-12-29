import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

// Generate next revision letter (A, B, C, ...)
function getNextRevisionLetter(existingRevisions: string[]): string {
  if (existingRevisions.length === 0) return 'A';
  
  // Find the highest letter
  const letters = existingRevisions
    .map(r => r.match(/-([A-Z])$/)?.[1])
    .filter(Boolean) as string[];
  
  if (letters.length === 0) return 'A';
  
  const maxLetter = letters.sort().pop()!;
  return String.fromCharCode(maxLetter.charCodeAt(0) + 1);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Get the original devis
    const originalDevis = await prisma.devis.findUnique({
      where: { id },
      include: {
        lignes: true,
        revisions: {
          select: { reference: true },
        },
      },
    });

    if (!originalDevis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    // Determine the parent (original) devis ID
    const parentId = originalDevis.parentDevisId || originalDevis.id;
    
    // Get all existing revisions of this devis
    const allRevisions = await prisma.devis.findMany({
      where: {
        OR: [
          { id: parentId },
          { parentDevisId: parentId },
        ],
      },
      select: { reference: true },
    });

    // Get the base reference (without revision letter)
    const baseRef = originalDevis.reference.replace(/-[A-Z]$/, '');
    
    // Generate next revision letter
    const nextLetter = getNextRevisionLetter(allRevisions.map(r => r.reference));
    const newReference = `${baseRef}-${nextLetter}`;

    // Create the revision as a copy of the original
    const revision = await prisma.devis.create({
      data: {
        reference: newReference,
        date: new Date(),
        objet: originalDevis.objet,
        parentDevisId: parentId,
        revisionLetter: nextLetter,
        clientType: originalDevis.clientType,
        clientNom: originalDevis.clientNom,
        clientAdresse: originalDevis.clientAdresse,
        clientVille: originalDevis.clientVille,
        clientPays: originalDevis.clientPays,
        clientEmail: originalDevis.clientEmail,
        clientTelephone: originalDevis.clientTelephone,
        partenaireId: originalDevis.partenaireId,
        delaiLivraison: originalDevis.delaiLivraison,
        conditionLivraison: originalDevis.conditionLivraison,
        validiteOffre: originalDevis.validiteOffre,
        garantie: originalDevis.garantie,
        totalHT: originalDevis.totalHT,
        totalTTC: originalDevis.totalTTC,
        tauxTVA: originalDevis.tauxTVA,
        statut: 'brouillon',
        createdById: user.id,
        lignes: {
          create: originalDevis.lignes.map(l => ({
            ordre: l.ordre,
            produitId: l.produitId,
            reference: l.reference,
            designation: l.designation,
            details: l.details,
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

    return NextResponse.json(revision);
  } catch (error) {
    console.error('Error creating devis revision:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la révision' }, { status: 500 });
  }
}

// GET revisions for a devis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Get the devis
    const devis = await prisma.devis.findUnique({
      where: { id },
      select: { id: true, parentDevisId: true },
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    // Get the parent ID (original devis)
    const parentId = devis.parentDevisId || devis.id;

    // Get all revisions including the original
    const revisions = await prisma.devis.findMany({
      where: {
        OR: [
          { id: parentId },
          { parentDevisId: parentId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        reference: true,
        revisionLetter: true,
        date: true,
        statut: true,
        totalHT: true,
        createdAt: true,
      },
    });

    return NextResponse.json(revisions);
  } catch (error) {
    console.error('Error fetching devis revisions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
