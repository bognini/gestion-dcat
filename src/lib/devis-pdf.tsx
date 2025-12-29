import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 50,
    objectFit: 'contain',
  },
  date: {
    fontSize: 11,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  reference: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  clientBox: {
    borderWidth: 1,
    borderColor: '#1e40af',
    padding: 10,
    marginLeft: 'auto',
    width: '50%',
    marginBottom: 15,
  },
  clientText: {
    textAlign: 'center',
    fontSize: 9,
  },
  clientName: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  objet: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 25,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  colRef: {
    width: '10%',
    padding: 5,
  },
  colDesignation: {
    width: '40%',
    padding: 5,
  },
  colQte: {
    width: '8%',
    padding: 5,
    textAlign: 'center',
  },
  colUte: {
    width: '7%',
    padding: 5,
    textAlign: 'center',
  },
  colPU: {
    width: '17%',
    padding: 5,
    textAlign: 'right',
  },
  colMontant: {
    width: '18%',
    padding: 5,
    textAlign: 'right',
  },
  designationMain: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  designationDetails: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalLabel: {
    width: '82%',
    padding: 8,
    textAlign: 'right',
    fontSize: 10,
  },
  totalValue: {
    width: '18%',
    padding: 8,
    textAlign: 'right',
    fontSize: 11,
  },
  amountInWords: {
    marginTop: 5,
    fontSize: 9,
  },
  amountInWordsLabel: {
    fontStyle: 'italic',
    fontSize: 8,
  },
  amountInWordsValue: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  footer: {
    marginTop: 20,
    fontSize: 9,
  },
  footerRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  footerLabel: {
    fontWeight: 'bold',
    width: 140,
  },
  footerValue: {
    flex: 1,
  },
  companyInfo: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    textAlign: 'right',
    fontSize: 8,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1e40af',
  },
  companyTagline: {
    fontSize: 7,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  signature: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 9,
    fontStyle: 'italic',
  },
});

// Number to French words converter
function numberToFrenchWords(num: number): string {
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF', 'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  const tens = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT'];
  
  if (num === 0) return 'ZÉRO';
  if (num < 0) return 'MOINS ' + numberToFrenchWords(-num);
  
  let words = '';
  
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    words += (millions === 1 ? 'UN MILLION' : numberToFrenchWords(millions) + ' MILLIONS') + ' ';
    num %= 1000000;
  }
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    words += (thousands === 1 ? 'MILLE' : numberToFrenchWords(thousands) + ' MILLE') + ' ';
    num %= 1000;
  }
  
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    words += (hundreds === 1 ? 'CENT' : units[hundreds] + ' CENT') + ' ';
    num %= 100;
  }
  
  if (num >= 20) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      words += tens[ten] + '-' + units[10 + unit] + ' ';
    } else if (ten === 8) {
      words += tens[ten] + (unit > 0 ? '-' : '') + units[unit] + ' ';
    } else {
      words += tens[ten] + (unit === 1 ? ' ET ' : unit > 0 ? '-' : '') + units[unit] + ' ';
    }
  } else if (num > 0) {
    words += units[num] + ' ';
  }
  
  return words.trim();
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

interface DevisLigne {
  reference: string;
  designation: string;
  details?: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
}

interface DevisData {
  reference: string;
  date: Date | string;
  objet: string;
  clientNom: string;
  clientAdresse?: string;
  clientVille?: string;
  clientPays: string;
  delaiLivraison?: string;
  conditionLivraison?: string;
  validiteOffre: number;
  garantie?: string;
  totalHT: number;
  lignes: DevisLigne[];
}

export function DevisPDF({ devis }: { devis: DevisData }) {
  const dateFormatted = new Date(devis.date).toLocaleDateString('fr-FR');
  const totalInWords = numberToFrenchWords(Math.round(devis.totalHT)) + ' FRANCS CFA';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src="/dcat-logo.png" style={styles.logo} />
          </View>
          <Text style={styles.date}>{dateFormatted}</Text>
        </View>

        {/* Reference */}
        <Text style={styles.reference}>DEVIS N° {devis.reference}</Text>

        {/* Client Box */}
        <View style={styles.clientBox}>
          <Text style={styles.clientText}>A l&apos;attention de <Text style={styles.clientName}>{devis.clientNom}</Text></Text>
          {devis.clientVille && <Text style={styles.clientText}>de {devis.clientPays}</Text>}
          {devis.clientAdresse && <Text style={styles.clientText}>{devis.clientVille}, {devis.clientAdresse}</Text>}
        </View>

        {/* Objet */}
        <Text style={styles.objet}>{devis.objet}</Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colRef}>REF.</Text>
            <Text style={styles.colDesignation}>DESIGNATION</Text>
            <Text style={styles.colQte}>QTE</Text>
            <Text style={styles.colUte}>Uté</Text>
            <Text style={styles.colPU}>P.U</Text>
            <Text style={styles.colMontant}>MONTANT</Text>
          </View>

          {/* Rows */}
          {devis.lignes.map((ligne, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.colRef}>{ligne.reference}</Text>
              <View style={styles.colDesignation}>
                <Text style={styles.designationMain}>{ligne.designation}</Text>
                {ligne.details && <Text style={styles.designationDetails}>- {ligne.details}</Text>}
              </View>
              <Text style={styles.colQte}>{ligne.quantite}</Text>
              <Text style={styles.colUte}>{ligne.unite}</Text>
              <Text style={styles.colPU}>{formatAmount(ligne.prixUnitaire)}</Text>
              <Text style={styles.colMontant}>{formatAmount(ligne.montant)}</Text>
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL GENERAL HT</Text>
            <Text style={styles.totalValue}>{formatAmount(devis.totalHT)}</Text>
          </View>
        </View>

        {/* Amount in words */}
        <View style={styles.amountInWords}>
          <Text style={styles.amountInWordsLabel}>Arrêté le présent devis à la somme de :</Text>
          <Text style={styles.amountInWordsValue}>{totalInWords}</Text>
        </View>

        {/* Footer conditions */}
        <View style={styles.footer}>
          {devis.delaiLivraison && (
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Delai de livraison :</Text>
              <Text style={styles.footerValue}>{devis.delaiLivraison}</Text>
            </View>
          )}
          {devis.conditionLivraison && (
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Condition de livraison :</Text>
              <Text style={styles.footerValue}>{devis.conditionLivraison}</Text>
            </View>
          )}
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Validité de l&apos;offre :</Text>
            <Text style={styles.footerValue}>{devis.validiteOffre} Jours</Text>
          </View>
          {devis.garantie && (
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Garantie :</Text>
              <Text style={styles.footerValue}>{devis.garantie}</Text>
            </View>
          )}
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>DCAT</Text>
          <Text style={styles.companyTagline}>Data Communications & All Technologies</Text>
          <Text>Angré Château d&apos;eau Imm. BATIM 1</Text>
          <Text>18 BP 2353 Abidjan 18</Text>
          <Text>Tel: 21 37 33 63</Text>
          <Text>www.dcat.ci</Text>
        </View>
      </Page>
    </Document>
  );
}
