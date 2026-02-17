import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        client: true,
        lignes: {
          include: { produit: { select: { nom: true } } },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Get shop info from settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'boutique_phone',
            'boutique_phone_2',
            'boutique_address',
            'boutique_website',
            'boutique_name',
          ],
        },
      },
    });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const shopName = settingsMap['boutique_name'] || 'DCAT E-Market';
    const phone1 = settingsMap['boutique_phone'] || '+225 27 21 37 33 63';
    const phone2 = settingsMap['boutique_phone_2'] || '';
    const address = settingsMap['boutique_address'] || 'Angré Château, Immeuble BATIM, Cocody';
    const website = settingsMap['boutique_website'] || 'www.dcat.ci';

    const orderDate = new Date(commande.date);
    const clientName = [commande.client.nom, commande.client.prenom].filter(Boolean).join(' ');

    // Generate 80mm thermal receipt HTML (80mm ≈ 302px at 96dpi, we use 72mm printable area ≈ 272px)
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu #${commande.reference}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .shop-name {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    .shop-info {
      text-align: center;
      font-size: 11px;
      color: #333;
      margin-bottom: 4px;
    }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-double {
      border: none;
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .row .label { }
    .row .value { text-align: right; font-weight: bold; }
    .section-title {
      font-weight: bold;
      text-decoration: underline;
      margin: 8px 0 4px;
      font-size: 13px;
    }
    .article {
      margin-bottom: 4px;
    }
    .article-name {
      font-weight: bold;
      font-size: 11px;
    }
    .article-detail {
      font-size: 10px;
      color: #444;
      padding-left: 8px;
    }
    .article-price {
      display: flex;
      justify-content: space-between;
      padding-left: 8px;
      font-size: 11px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: bold;
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      font-style: italic;
      margin-top: 8px;
      color: #333;
    }
    .address-footer {
      text-align: center;
      font-size: 10px;
      margin-top: 8px;
      color: #555;
    }
    .address-footer .pin {
      font-style: normal;
    }
    @media print {
      body { width: 80mm; }
    }
    @media screen {
      body {
        margin: 20px auto;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 6mm;
      }
    }
  </style>
</head>
<body>
  <div class="shop-name">${shopName.toUpperCase()}</div>
  <div class="shop-info">
    ${phone1}${phone2 ? ' | ' + phone2 : ''}<br>
    ${website}
  </div>

  <hr class="divider-double">

  <div class="row">
    <span class="label">N° Commande:</span>
    <span class="value">#${commande.reference}</span>
  </div>
  <div class="row">
    <span class="label">Date:</span>
    <span class="value">${formatDate(orderDate)}</span>
  </div>
  <div class="row">
    <span class="label">Heure:</span>
    <span class="value">${formatTime(orderDate)}</span>
  </div>

  <hr class="divider">

  <div class="section-title">INFORMATIONS CLIENT</div>
  <div style="margin-bottom:2px">Nom: ${clientName}</div>
  <div style="margin-bottom:2px">Téléphone: ${commande.client.telephone || 'N/A'}</div>
  ${commande.adresseLivraison ? `<div style="margin-bottom:2px">Adresse: ${commande.adresseLivraison}</div>` : ''}

  <hr class="divider">

  <div class="section-title">ARTICLES</div>
  ${commande.lignes.map(ligne => `
  <div class="article">
    <div class="article-name">${ligne.designation}</div>
    <div class="article-price">
      <span>Qté: ${ligne.quantite}</span>
      <span>${formatPrice(ligne.montant)}</span>
    </div>
  </div>`).join('')}

  <hr class="divider-double">

  <div class="total-row">
    <span>TOTAL</span>
    <span>${formatPrice(commande.totalTTC)}</span>
  </div>

  <hr class="divider">

  <div class="footer">
    Merci pour votre commande !<br>
    Elle est en cours de traitement.<br>
    Vous serez livré(e) sous 1 à 3 jours<br>
    ouvrés.
  </div>

  <div class="address-footer">
    <span class="pin">📍</span> ${address}
  </div>

  <script>
    // Auto-print when opened
    if (window.location.search.includes('print=1')) {
      window.onload = () => { window.print(); };
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
