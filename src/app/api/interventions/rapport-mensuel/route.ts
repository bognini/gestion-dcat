import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partenaireId = searchParams.get('partenaireId');
    const mois = searchParams.get('mois'); // Format: YYYY-MM

    if (!partenaireId || !mois) {
      return NextResponse.json({ error: 'partenaireId et mois requis' }, { status: 400 });
    }

    // Parse month
    const [year, month] = mois.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get partenaire info
    const partenaire = await prisma.partenaire.findUnique({
      where: { id: partenaireId },
      select: { id: true, nom: true, adresse: true, ville: true, telephone1: true, email: true },
    });

    if (!partenaire) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
    }

    // Get interventions for the month
    const interventions = await prisma.intervention.findMany({
      where: {
        partenaireId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
        contrat: {
          select: { id: true, numero: true, titre: true },
        },
      },
    });

    // Calculate statistics
    const totalInterventions = interventions.length;
    const totalMinutes = interventions.reduce((sum, i) => sum + (i.dureeMinutes || 0), 0);
    const totalHeures = Math.floor(totalMinutes / 60);
    const minutesRestantes = totalMinutes % 60;

    const byType: Record<string, number> = {};
    const byStatut: Record<string, number> = {};
    
    interventions.forEach(i => {
      byType[i.typeMaintenance] = (byType[i.typeMaintenance] || 0) + 1;
      byStatut[i.statut] = (byStatut[i.statut] || 0) + 1;
    });

    // Format interventions for report
    const interventionsFormatted = interventions.map(i => ({
      id: i.id,
      reference: i.reference,
      date: i.date,
      problemeSignale: i.problemeSignale,
      typeMaintenance: i.typeMaintenance,
      typeDefaillance: i.typeDefaillance,
      rapport: i.rapport,
      recommandations: i.recommandations,
      dureeMinutes: i.dureeMinutes,
      dureeFormatted: i.dureeMinutes 
        ? `${Math.floor(i.dureeMinutes / 60)}h${(i.dureeMinutes % 60).toString().padStart(2, '0')}`
        : '-',
      statut: i.statut,
      modeIntervention: i.modeIntervention,
      lieu: i.lieu,
      intervenants: i.intervenants.map(int => 
        [int.utilisateur.prenom, int.utilisateur.nom].filter(Boolean).join(' ')
      ).join(', '),
      contrat: i.contrat ? `${i.contrat.numero} - ${i.contrat.titre}` : null,
    }));

    return NextResponse.json({
      partenaire,
      mois: {
        annee: year,
        mois: month,
        label: new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()),
      },
      statistiques: {
        totalInterventions,
        totalHeures,
        minutesRestantes,
        totalMinutes,
        dureeFormatted: `${totalHeures}h${minutesRestantes.toString().padStart(2, '0')}`,
        parType: byType,
        parStatut: byStatut,
      },
      interventions: interventionsFormatted,
    });
  } catch (error) {
    console.error('Error generating rapport mensuel:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
