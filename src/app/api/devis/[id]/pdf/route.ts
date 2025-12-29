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

    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
          include: {
            produit: {
              include: {
                images: { 
                  orderBy: { sortOrder: 'asc' },
                  take: 1 
                },
              },
            },
          },
        },
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    // Get product image URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getProductImageUrl = (ligne: any) => {
      if (ligne.produit?.images?.[0]?.id) {
        return `/api/produits/${ligne.produit.id}/images/${ligne.produit.images[0].id}`;
      }
      return null;
    };

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${devis.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm 15mm 25mm 15mm; }
    html, body { height: 100%; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; }
    
    /* Header: Logo left, Date right */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #2563eb; }
    .header-logo img { height: 50px; width: auto; }
    .header-date { text-align: right; font-size: 12px; color: #666; }
    
    /* Devis ref and client info on same line */
    .doc-client-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .doc-ref { font-size: 16px; font-weight: bold; color: #2563eb; }
    .client-info { text-align: right; }
    .client-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
    .client-detail { font-size: 10px; color: #666; margin-bottom: 2px; }
    
    .objet { background: #f8fafc; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
    .objet-title { font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 4px; font-weight: bold; }
    .objet-text { font-size: 12px; font-weight: 500; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #2563eb; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
    th:last-child, th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
    td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
    td:last-child, td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
    tr:nth-child(even) { background: #f9fafb; }
    .ligne-ref { font-family: monospace; font-size: 9px; color: #888; }
    .ligne-designation { font-weight: 500; }
    .ligne-details { font-size: 9px; color: #666; margin-top: 4px; }
    .ligne-image { margin-top: 8px; }
    .ligne-image img { max-width: 80px; max-height: 60px; border-radius: 4px; border: 1px solid #e5e7eb; }
    
    .totals { width: 220px; margin-left: auto; background: #f8fafc; border-radius: 4px; padding: 10px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; }
    
    .conditions { margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 4px; }
    .conditions-title { font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #333; }
    .conditions-item { font-size: 10px; color: #666; margin-bottom: 3px; }
    
    .footer { 
      padding: 10px 0; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      font-size: 7px; 
      color: #888; 
      line-height: 1.3; 
      background: white;
      margin-top: auto;
    }
    .signature { margin-top: 25px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; }
    .signature-title { font-size: 10px; margin-bottom: 40px; }
    .signature-line { border-top: 1px solid #333; padding-top: 6px; font-size: 9px; }
    .content-wrapper { flex: 1; }
    
    @media print {
      @page { size: A4; margin: 10mm 15mm 15mm 15mm; }
      html, body { height: 100%; }
      .container { min-height: 100vh; display: flex; flex-direction: column; }
      .content-wrapper { flex: 1; }
      .footer { 
        margin-top: auto;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header: Logo left, Date right -->
    <div class="header">
      <div class="header-logo">
        <img src="/dcat-logo.png" alt="DCAT" />
      </div>
      <div class="header-date">
        ${formatDate(devis.date.toISOString())}
      </div>
    </div>

    <div class="content-wrapper">
    <!-- Devis ref left, Client right -->
    <div class="doc-client-row">
      <div class="doc-ref">DEVIS N° ${devis.reference}</div>
      <div class="client-info">
        <div class="client-name">${devis.clientNom}</div>
        ${devis.clientAdresse ? `<div class="client-detail">${devis.clientAdresse}</div>` : ''}
        ${devis.clientVille ? `<div class="client-detail">${devis.clientVille}${devis.clientPays ? `, ${devis.clientPays}` : ''}</div>` : ''}
        ${devis.clientTelephone ? `<div class="client-detail">Tél: ${devis.clientTelephone}</div>` : ''}
        ${devis.clientEmail ? `<div class="client-detail">${devis.clientEmail}</div>` : ''}
      </div>
    </div>

    <div class="objet">
      <div class="objet-title">Objet du devis</div>
      <div class="objet-text">${devis.objet}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 70px;">Réf.</th>
          <th>Désignation</th>
          <th style="width: 50px;">Qté</th>
          <th style="width: 45px;">Unité</th>
          <th style="width: 90px;">P.U.</th>
          <th style="width: 100px;">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${devis.lignes.map(ligne => {
          const imageUrl = getProductImageUrl(ligne);
          return `
          <tr>
            <td class="ligne-ref">${ligne.reference}</td>
            <td>
              <div class="ligne-designation">${ligne.designation}</div>
              ${ligne.details ? `<div class="ligne-details">${ligne.details}</div>` : ''}
              ${imageUrl ? `<div class="ligne-image"><img src="${imageUrl}" alt="${ligne.designation}" /></div>` : ''}
            </td>
            <td>${ligne.quantite}</td>
            <td>${ligne.unite}</td>
            <td>${formatCurrency(ligne.prixUnitaire)}</td>
            <td>${formatCurrency(ligne.montant)}</td>
          </tr>
        `}).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Total</span>
        <span>${formatCurrency(devis.totalHT)}</span>
      </div>
    </div>

    <div class="conditions">
      <div class="conditions-title">Conditions</div>
      ${devis.validiteOffre ? `<div class="conditions-item">• Validité: ${devis.validiteOffre} jours</div>` : ''}
      ${devis.delaiLivraison ? `<div class="conditions-item">• Délai de livraison: ${devis.delaiLivraison}</div>` : ''}
      ${devis.conditionLivraison ? `<div class="conditions-item">• Condition de livraison: ${devis.conditionLivraison}</div>` : ''}
    </div>

    <div class="signature">
      <div class="signature-box">
        <div class="signature-title">Pour DCAT</div>
        <div class="signature-line">Date et signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Bon pour accord - ${devis.clientNom}</div>
        <div class="signature-line">Date et signature</div>
      </div>
    </div>
    </div>

    <div class="footer">
      <div>DCAT (Data Communications & All Technologies) • E-Mail : info@dcat.ci • Site Web : www.dcat.ci</div>
      <div>S.A.R.L. au Capital de 10.000.000 FCFA • R.C. N° CI-ABJ-2004-B-4038 • C.C. N° 0411512 K • Régime d'imposition : Réel Normal • Centre d'imposition : D.G.E.</div>
      <div>Compte GTBANK N°CI007 01030 059262300100 RIB=65 • Angré Château, Imm.BATIM, 1er Etage, Porte A108 - 27 B.P 826 Abidjan 27 • Tél.: (+225) 27 21 37 33 63 / 27 22 46 82 07</div>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML that can be printed/saved as PDF by the browser
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Devis-${devis.reference}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
