import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';
import { sendTicketSupportMail } from '@/lib/ticket-mail';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'technique', 'write');
    if (denied) return denied;

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    const result = await sendTicketSupportMail(id);
    if (result.total === 0) {
      return NextResponse.json(
        { error: 'Aucun destinataire configuré pour « Support DCAT — nouveau ticket » (Paramètres → Options)' },
        { status: 400 }
      );
    }
    if (result.sent === 0) {
      return NextResponse.json({ error: "L'envoi du mail a échoué (vérifiez la configuration SMTP)" }, { status: 502 });
    }
    return NextResponse.json({ success: true, sent: result.sent });
  } catch (error) {
    console.error('Error resending ticket mail:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
