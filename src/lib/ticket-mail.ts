import { prisma } from './prisma';
import { sendNotificationEmail } from './mail';
import { TICKET_MAIL_EVENT_KEY, ticketMailSubject, modeSignalementLabel } from './tickets';

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fullName(u: { nom: string; prenom: string | null } | null | undefined): string {
  if (!u) return '-';
  return [u.prenom, u.nom].filter(Boolean).join(' ');
}

/**
 * Envoie le mail « INCIDENT SIGNALE » au support DCAT pour un ticket
 * et trace l'envoi sur le ticket. Ne lève jamais : les erreurs sont journalisées.
 */
export async function sendTicketSupportMail(ticketId: string): Promise<{ sent: number; total: number }> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        partenaire: { select: { nom: true } },
        recuPar: { select: { nom: true, prenom: true } },
        priseEnChargePar: { select: { nom: true, prenom: true } },
      },
    });
    if (!ticket) return { sent: 0, total: 0 };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gestion.dcat.ci';
    const lien = `${appUrl}/technique/tickets/${ticket.id}`;
    const dateStr = ticket.dateSignalement.toLocaleString('fr-FR', {
      timeZone: 'Africa/Abidjan',
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const signalePar = [ticket.signaleParNom, ticket.signaleParPrenoms].filter(Boolean).join(' ');

    const row = (k: string, v: string) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;white-space:nowrap;">${k}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${v}</td></tr>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color:#1f2937;">
        <div style="background:#b91c1c;color:#fff;padding:18px 24px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;font-size:18px;">Incident signalé — ticket ${escapeHtml(ticket.numero)}</h2>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 10px 10px;">
          <table style="border-collapse:collapse;width:100%;background:#fff;">
            ${row('Client', escapeHtml(ticket.partenaire.nom))}
            ${row('Incident signalé', escapeHtml(ticket.incident).replace(/\n/g, '<br>'))}
            ${row('Date et heure de signalement', escapeHtml(dateStr))}
            ${row('Signalé par', escapeHtml(signalePar))}
            ${row('À', escapeHtml(fullName(ticket.recuPar)))}
            ${row('Mode de signalisation', escapeHtml(modeSignalementLabel(ticket.modeSignalement)))}
            ${row('Prise en charge par', escapeHtml(fullName(ticket.priseEnChargePar)))}
            ${row('Statut', escapeHtml(ticket.statut === 'ouvert' ? 'Ouvert' : ticket.statut))}
          </table>
          <p style="margin:20px 0 0;">
            <a href="${lien}" style="background:#0e6b85;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">Ouvrir le ticket dans Gestion DCAT</a>
          </p>
          <p style="margin-top:20px;color:#6b7280;font-size:12px;">Cette notification a été envoyée automatiquement par Gestion DCAT.</p>
        </div>
      </div>`;

    const result = await sendNotificationEmail(
      TICKET_MAIL_EVENT_KEY,
      ticketMailSubject(ticket.partenaire.nom, ticket.numero),
      html
    );

    if (result.sent > 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { mailSupportEnvoye: true, mailSupportAt: new Date() },
      });
    } else {
      console.warn(`Ticket ${ticket.numero}: mail support non envoyé (destinataires: ${result.total})`);
    }
    return result;
  } catch (error) {
    console.error('Error sending ticket support mail:', error);
    return { sent: 0, total: 0 };
  }
}
