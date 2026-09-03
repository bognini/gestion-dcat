import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Session simulée (admin) et mail neutralisé : on teste la logique métier, pas le SMTP.
const session = { id: '', role: 'admin', nom: 'Test', prenom: 'Admin', email: 't@t.t', username: 'test' };
vi.mock('@/lib/auth', () => ({ getSessionFromCookie: vi.fn(async () => session) }));
const mailSpy = vi.fn(async () => ({ sent: 1, total: 1 }));
vi.mock('@/lib/mail', () => ({ sendNotificationEmail: mailSpy }));

const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
const p = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!dbOk)('tickets d’incident (intégration DB)', () => {
  const stamp = Date.now();
  let userId = '';
  let partenaireId = '';
  const created: { tickets: string[]; interventions: string[] } = { tickets: [], interventions: [] };

  beforeAll(async () => {
    const user = await prisma.utilisateur.create({
      data: { username: `t${stamp}`, email: `t${stamp}@test.local`, password: 'x', nom: 'Testeur', role: 'admin' },
    });
    userId = user.id;
    session.id = user.id;
    const partenaire = await prisma.partenaire.create({ data: { nom: `Client Test ${stamp}`, type: 'client' } });
    partenaireId = partenaire.id;
  });

  afterAll(async () => {
    await prisma.intervention.deleteMany({ where: { id: { in: created.interventions } } });
    await prisma.ticket.deleteMany({ where: { id: { in: created.tickets } } });
    await prisma.partenaire.delete({ where: { id: partenaireId } }).catch(() => undefined);
    await prisma.utilisateur.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('crée un ticket ouvert, numéroté, et envoie le mail au support avec le bon objet', async () => {
    const { POST } = await import('@/app/api/tickets/route');
    const res = await POST(
      json('/api/tickets', 'POST', {
        partenaireId,
        incident: 'Serveur injoignable',
        dateSignalement: new Date().toISOString(),
        signaleParNom: 'Kouassi',
        signaleParPrenoms: 'Jean',
        modeSignalement: 'hotline_dcat',
      })
    );
    expect(res.status).toBe(201);
    const ticket = await res.json();
    created.tickets.push(ticket.id);
    expect(ticket.statut).toBe('ouvert');
    expect(ticket.numero).toMatch(/^TCK-\d{4}-\d{4}$/);
    expect(ticket.recuPar.id).toBe(userId);

    // envoi asynchrone : on laisse la promesse se résoudre
    await new Promise((r) => setTimeout(r, 300));
    expect(mailSpy).toHaveBeenCalled();
    const [eventKey, subject] = mailSpy.mock.calls[0] as unknown as [string, string];
    expect(eventKey).toBe('ticket_created');
    expect(subject).toBe(`Client Test ${stamp} INCIDENT SIGNALE ${ticket.numero}`);
    const refreshed = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(refreshed?.mailSupportEnvoye).toBe(true);
  });

  it('refuse un mode de signalisation inconnu et une date future', async () => {
    const { POST } = await import('@/app/api/tickets/route');
    const bad = await POST(
      json('/api/tickets', 'POST', { partenaireId, incident: 'x', signaleParNom: 'y', modeSignalement: 'pigeon' })
    );
    expect(bad.status).toBe(400);
    const future = await POST(
      json('/api/tickets', 'POST', {
        partenaireId,
        incident: 'x',
        signaleParNom: 'y',
        modeSignalement: 'mail',
        dateSignalement: new Date(Date.now() + 86_400_000).toISOString(),
      })
    );
    expect(future.status).toBe(400);
  });

  it('une intervention liée passe le ticket « en cours », puis « fermé » quand elle est terminée', async () => {
    const { POST: createTicket } = await import('@/app/api/tickets/route');
    const { POST: createIntervention } = await import('@/app/api/interventions/route');
    const { PUT: updateIntervention } = await import('@/app/api/interventions/[id]/route');
    const { PUT: updateTicket } = await import('@/app/api/tickets/[id]/route');

    const tRes = await createTicket(
      json('/api/tickets', 'POST', {
        partenaireId,
        incident: 'Onduleur en panne',
        signaleParNom: 'Diallo',
        modeSignalement: 'appel_telephonique',
        envoyerMailSupport: false,
      })
    );
    const ticket = await tRes.json();
    created.tickets.push(ticket.id);

    // Impossible de fermer le ticket à la main
    const close = await updateTicket(json(`/api/tickets/${ticket.id}`, 'PUT', { statut: 'ferme' }), p(ticket.id));
    expect(close.status).toBe(400);

    const iRes = await createIntervention(
      json('/api/interventions', 'POST', {
        ticketId: ticket.id,
        date: new Date().toISOString().slice(0, 10),
        typeMaintenance: 'corrective',
      })
    );
    expect(iRes.status).toBe(200);
    const intervention = await iRes.json();
    created.interventions.push(intervention.id);
    expect(intervention.partenaire.id).toBe(partenaireId);
    expect(intervention.problemeSignale).toBe('Onduleur en panne');
    expect(intervention.ticket.numero).toBe(ticket.numero);
    expect((await prisma.ticket.findUnique({ where: { id: ticket.id } }))?.statut).toBe('en_cours');

    const done = await updateIntervention(
      json(`/api/interventions/${intervention.id}`, 'PUT', { statut: 'termine' }),
      p(intervention.id)
    );
    expect(done.status).toBe(200);
    const closed = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(closed?.statut).toBe('ferme');
    expect(closed?.fermeAt).not.toBeNull();

    // Un ticket fermé avec interventions ne se supprime pas
    const { DELETE } = await import('@/app/api/tickets/[id]/route');
    const del = await DELETE(json(`/api/tickets/${ticket.id}`, 'DELETE'), p(ticket.id));
    expect(del.status).toBe(400);
  });

  it('refuse la création à un rôle sans droit technique', async () => {
    const { POST } = await import('@/app/api/tickets/route');
    const previous = session.role;
    session.role = 'comptable';
    const res = await POST(
      json('/api/tickets', 'POST', { partenaireId, incident: 'x', signaleParNom: 'y', modeSignalement: 'mail' })
    );
    session.role = previous;
    expect(res.status).toBe(403);
  });
});
