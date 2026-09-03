import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';
import { parseDateMouvement } from '@/lib/stock';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const denied = requirePermission(user, 'stock', 'delete');
    if (denied) return denied;

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seul un administrateur peut supprimer un mouvement' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const mouvement = await prisma.mouvementStock.findUnique({
      where: { id },
      select: { id: true, type: true, quantite: true, produitId: true },
    });

    if (!mouvement) {
      return NextResponse.json({ error: 'Mouvement non trouvé' }, { status: 404 });
    }

    const produit = await prisma.produit.findUnique({
      where: { id: mouvement.produitId },
      select: { quantite: true, nom: true },
    });

    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Reverse the movement: ENTREE adds stock, so deletion subtracts. SORTIE subtracted, so deletion adds back.
    const stockDelta = mouvement.type === 'ENTREE' ? -mouvement.quantite : mouvement.quantite;
    const newStock = produit.quantite + stockDelta;

    if (newStock < 0) {
      return NextResponse.json(
        {
          error: `Suppression impossible : annuler cette entrée mettrait le stock de "${produit.nom}" à ${newStock}. Des sorties ont probablement été enregistrées depuis.`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.produit.update({
        where: { id: mouvement.produitId },
        data: { quantite: newStock },
      }),
      prisma.mouvementStock.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    console.error('Error deleting mouvement:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}

/**
 * PUT /api/mouvements/[id] — correction (admin) de la date et du commentaire d'un mouvement.
 * Les quantités ne sont pas modifiables : supprimer puis ressaisir le mouvement.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'stock', 'manage');
    if (denied) return denied;

    const { id } = await params;
    const data = await request.json();
    const existing = await prisma.mouvementStock.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Mouvement non trouvé' }, { status: 404 });
    }

    const updateData: { date?: Date; commentaire?: string | null } = {};
    if (data.date !== undefined) {
      const d = parseDateMouvement(data.date);
      if (d instanceof NextResponse) return d;
      updateData.date = d;
    }
    if (data.commentaire !== undefined) updateData.commentaire = data.commentaire?.trim() || null;

    const mouvement = await prisma.mouvementStock.update({
      where: { id },
      data: updateData,
      select: { id: true, date: true, commentaire: true },
    });
    return NextResponse.json(mouvement);
  } catch (error) {
    console.error('Error updating mouvement:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
