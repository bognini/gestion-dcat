'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FilePlus2, Receipt, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  devisEnAttente: number;
  devisAcceptes: number;
  facturesImpayees: number;
  totalEncaisse: number;
}

export default function FinanceComptabilitePage() {
  const [stats, setStats] = useState<Stats>({
    devisEnAttente: 0,
    devisAcceptes: 0,
    facturesImpayees: 0,
    totalEncaisse: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [devisRes, facturesRes, paiementsRes] = await Promise.all([
        fetch('/api/devis'),
        fetch('/api/factures'),
        fetch('/api/paiements'),
      ]);

      if (devisRes.ok) {
        const devisList = await devisRes.json();
        setStats(prev => ({
          ...prev,
          devisEnAttente: devisList.filter((d: { statut: string }) => d.statut === 'envoye').length,
          devisAcceptes: devisList.filter((d: { statut: string }) => d.statut === 'accepte').length,
        }));
      }

      if (facturesRes.ok) {
        const facturesList = await facturesRes.json();
        setStats(prev => ({
          ...prev,
          facturesImpayees: facturesList.filter((f: { statut: string }) => 
            f.statut === 'envoyee' || f.statut === 'payee_partiellement'
          ).length,
        }));
      }

      if (paiementsRes.ok) {
        const paiementsList = await paiementsRes.json();
        const total = paiementsList.reduce((sum: number, p: { montant: number }) => sum + p.montant, 0);
        setStats(prev => ({ ...prev, totalEncaisse: total }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finance et Comptabilité</h2>
          <p className="text-muted-foreground">
            Gérez les devis, factures et paiements de l&apos;entreprise
          </p>
        </div>
        <Button asChild>
          <Link href="/administration/finance-comptabilite/devis/nouveau">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nouveau Devis
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Devis en attente</CardDescription>
            <CardTitle className="text-2xl">{stats.devisEnAttente}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">En cours de validation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Devis acceptés</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.devisAcceptes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Prêts à facturer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Factures impayées</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.facturesImpayees}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">En attente de paiement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total encaissé</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalEncaisse)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" /> Tous les paiements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/finance-comptabilite/devis">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <FilePlus2 className="h-8 w-8" />
                <div>
                  <CardTitle>Générer un Devis</CardTitle>
                  <CardDescription className="text-blue-100">
                    Créer et gérer les devis clients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Créer un nouveau devis</li>
              <li>• Convertir un devis en facture</li>
              <li>• Générer un PDF professionnel</li>
              <li>• Suivre le statut des devis</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/finance-comptabilite/factures">
            <CardHeader className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Receipt className="h-8 w-8" />
                <div>
                  <CardTitle>Factures</CardTitle>
                  <CardDescription className="text-indigo-100">
                    Gestion des factures
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Créer une nouvelle facture</li>
              <li>• Suivre les paiements</li>
              <li>• Relances automatiques</li>
              <li>• Export comptable</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/finance-comptabilite/paiements">
            <CardHeader className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8" />
                <div>
                  <CardTitle>Paiements</CardTitle>
                  <CardDescription className="text-emerald-100">
                    Suivi des encaissements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Enregistrer les paiements</li>
              <li>• Historique des transactions</li>
              <li>• Rapports financiers</li>
              <li>• Alertes de retard</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/finance-comptabilite/remboursements">
            <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                <div>
                  <CardTitle>Créances</CardTitle>
                  <CardDescription className="text-orange-100">
                    Suivi des remboursements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Créances clients</li>
              <li>• Suivi des paiements</li>
              <li>• Échéances</li>
              <li>• Historique</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
