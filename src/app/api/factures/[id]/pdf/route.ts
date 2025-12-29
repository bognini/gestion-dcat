import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
        },
        paiements: {
          orderBy: { date: 'desc' },
        },
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture not found' }, { status: 404 });
    }

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${facture.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; min-height: 100vh; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #4f46e5; }
    .logo-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 8px; }
    .doc-ref { font-size: 14px; color: #666; }
    .doc-date { font-size: 12px; color: #888; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 45%; }
    .party-title { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: 1px; }
    .party-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .party-detail { font-size: 11px; color: #666; margin-bottom: 2px; }
    .objet { background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 25px; }
    .objet-title { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .objet-text { font-size: 13px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #4f46e5; color: white; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    th:last-child, th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
    td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    td:last-child, td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
    tr:nth-child(even) { background: #f9fafb; }
    .ligne-ref { font-family: monospace; font-size: 10px; color: #888; }
    .ligne-details { font-size: 10px; color: #666; margin-top: 2px; }
    .totals { width: 300px; margin-left: auto; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total-row.final { border-bottom: none; border-top: 2px solid #4f46e5; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: bold; color: #4f46e5; }
    .total-row.paid { color: #16a34a; }
    .total-row.remaining { color: #ea580c; font-weight: bold; }
    .payments { margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; }
    .payments-title { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #16a34a; }
    .payment-item { font-size: 11px; margin-bottom: 4px; display: flex; justify-content: space-between; }
    .footer { margin-top: auto; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 8px; color: #888; line-height: 1.4; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .status-payee { background: #dcfce7; color: #16a34a; }
    .status-partiel { background: #fed7aa; color: #ea580c; }
    .status-impayee { background: #fecaca; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <img src="/dcat-logo.png" alt="DCAT" style="height: 50px; width: auto;" />
        <div class="logo-sub">Data Communications & All Technologies</div>
      </div>
      <div class="doc-info">
        <div class="doc-title">FACTURE</div>
        <div class="doc-ref">${facture.reference}</div>
        <div class="doc-date">Date: ${formatDate(facture.date.toISOString())}</div>
        ${facture.dateEcheance ? `<div class="doc-date">Échéance: ${formatDate(facture.dateEcheance.toISOString())}</div>` : ''}
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-title">Émetteur</div>
        <div class="party-name">DCAT SARL</div>
        <div class="party-detail">Angré Château, Imm.BATIM, 1er Etage, Porte A108</div>
        <div class="party-detail">27 B.P 826 Abidjan 27</div>
        <div class="party-detail">Tél.: (+225) 27 21 37 33 63 / 27 22 46 82 07</div>
        <div class="party-detail">info@dcat.ci</div>
      </div>
      <div class="party">
        <div class="party-title">Client</div>
        <div class="party-name">${facture.clientNom}</div>
        ${facture.clientAdresse ? `<div class="party-detail">${facture.clientAdresse}</div>` : ''}
        ${facture.clientVille ? `<div class="party-detail">${facture.clientVille}${facture.clientPays ? `, ${facture.clientPays}` : ''}</div>` : ''}
        ${facture.clientTelephone ? `<div class="party-detail">Tél: ${facture.clientTelephone}</div>` : ''}
        ${facture.clientEmail ? `<div class="party-detail">${facture.clientEmail}</div>` : ''}
      </div>
    </div>

    ${facture.objet ? `
    <div class="objet">
      <div class="objet-title">Objet</div>
      <div class="objet-text">${facture.objet}</div>
    </div>
    ` : ''}

    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Réf.</th>
          <th>Désignation</th>
          <th style="width: 60px;">Qté</th>
          <th style="width: 50px;">Unité</th>
          <th style="width: 100px;">P.U.</th>
          <th style="width: 110px;">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${facture.lignes.map(ligne => `
          <tr>
            <td class="ligne-ref">${ligne.reference}</td>
            <td>
              ${ligne.designation}
              ${ligne.details ? `<div class="ligne-details">${ligne.details}</div>` : ''}
            </td>
            <td>${ligne.quantite}</td>
            <td>${ligne.unite}</td>
            <td>${formatCurrency(ligne.prixUnitaire)}</td>
            <td>${formatCurrency(ligne.montant)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Total HT</span>
        <span>${formatCurrency(facture.totalHT)}</span>
      </div>
      <div class="total-row">
        <span>TVA (18%)</span>
        <span>${formatCurrency(facture.totalTVA)}</span>
      </div>
      <div class="total-row final">
        <span>Total TTC</span>
        <span>${formatCurrency(facture.totalTTC)}</span>
      </div>
      ${facture.montantPaye > 0 ? `
      <div class="total-row paid">
        <span>Montant payé</span>
        <span>${formatCurrency(facture.montantPaye)}</span>
      </div>
      ` : ''}
      ${facture.resteAPayer > 0 ? `
      <div class="total-row remaining">
        <span>Reste à payer</span>
        <span>${formatCurrency(facture.resteAPayer)}</span>
      </div>
      ` : ''}
    </div>

    ${facture.paiements.length > 0 ? `
    <div class="payments">
      <div class="payments-title">Paiements reçus</div>
      ${facture.paiements.map(p => `
        <div class="payment-item">
          <span>${formatDate(p.date.toISOString())} - ${p.modePaiement}</span>
          <span>${formatCurrency(p.montant)}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <div>DCAT (Data Communications & All Technologies) • E-Mail : info@dcat.ci • Site Web : www.dcat.ci</div>
      <div style="margin-top: 4px;">S.A.R.L. au Capital de 10.000.000 FCFA • R.C. N° CI-ABJ-2004-B-4038 • C.C. N° 0411512 K • Régime d'imposition : Réel Normal • Centre d'imposition : D.G.E.</div>
      <div style="margin-top: 4px;">Compte GTBANK N°CI007 01030 059262300100 RIB=65 • Angré Château, Imm.BATIM, 1er Etage, Porte A108 - 27 B.P 826 Abidjan 27 • Tél.: (+225) 27 21 37 33 63 / 27 22 46 82 07</div>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Facture-${facture.reference}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
