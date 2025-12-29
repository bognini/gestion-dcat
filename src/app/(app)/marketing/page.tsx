'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Eye,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Stats {
  overview: {
    totalCommandes: number;
    commandesThisMonth: number;
    commandesGrowth: number;
    totalClients: number;
    newClientsThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    revenueGrowth: number;
  };
  recentCommandes: {
    id: string;
    reference: string;
    clientNom: string;
    totalTTC: number;
    statut: string;
    createdAt: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  en_attente: { label: 'En attente', variant: 'outline' },
  confirmee: { label: 'Confirmée', variant: 'default' },
  en_preparation: { label: 'En préparation', variant: 'default' },
  expediee: { label: 'Expédiée', variant: 'default' },
  livree: { label: 'Livrée', variant: 'secondary' },
  terminee: { label: 'Terminée', variant: 'secondary' },
  annulee: { label: 'Annulée', variant: 'destructive' },
};

export default function MarketingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/marketing/stats')
      .then(res => res.ok ? res.json() : null)
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing & Commercial</h2>
          <p className="text-muted-foreground">
            E-commerce et statistiques de vente
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/emarket/produits">
            <Store className="mr-2 h-4 w-4" />
            Gérer les produits
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventes (mois)</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats?.overview.revenueThisMonth || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.overview.revenueGrowth !== 0 && (
              <p className={`text-xs flex items-center gap-1 ${stats.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.overview.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stats.overview.revenueGrowth > 0 ? '+' : ''}{stats.overview.revenueGrowth}% vs mois dernier
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Commandes</CardDescription>
            <CardTitle className="text-2xl">{stats?.overview.totalCommandes || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.overview.commandesThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-2xl">{stats?.overview.totalClients || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              +{stats?.overview.newClientsThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CA Total</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(stats?.overview.totalRevenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Toutes commandes livrées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/marketing/emarket">
            <CardHeader className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Store className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">DCAT E-Market</CardTitle>
                  <CardDescription className="text-violet-100">
                    Boutique en ligne
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Gestion des produits publiés
              </li>
              <li className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                Suivi des commandes
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Gestion des clients
              </li>
              <li className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Promotions et tarifs
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="https://emarket.dcat.ci" target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir la boutique
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/marketing/statistiques">
            <CardHeader className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Statistiques</CardTitle>
                  <CardDescription className="text-purple-100">
                    Analyses et rapports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Évolution des ventes
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Produits les plus vendus
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Analyse clients
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Tendances et prévisions
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/marketing/statistiques">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Voir les rapports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commandes récentes
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketing/emarket/commandes">Voir tout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!stats?.recentCommandes?.length ? (
            <p className="text-center py-4 text-muted-foreground">Aucune commande</p>
          ) : (
            <div className="space-y-4">
              {stats.recentCommandes.slice(0, 5).map((commande) => {
                const statusCfg = STATUS_CONFIG[commande.statut] || { label: commande.statut, variant: 'default' as const };
                return (
                  <div key={commande.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Link 
                        href={`/marketing/emarket/commandes/${commande.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {commande.reference}
                      </Link>
                      <p className="text-sm text-muted-foreground">Client: {commande.clientNom}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(commande.totalTTC)}</p>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
