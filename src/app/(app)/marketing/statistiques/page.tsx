'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Loader2,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  commandesByStatus: { statut: string; count: number }[];
  topProducts: {
    produitId: string;
    nom: string;
    sku: string;
    quantite: number;
    montant: number;
  }[];
  monthlyRevenue: { month: string; revenue: number }[];
  recentCommandes: {
    id: string;
    reference: string;
    clientNom: string;
    totalTTC: number;
    statut: string;
    lignesCount: number;
    createdAt: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500' },
  confirmee: { label: 'Confirmée', color: 'bg-blue-500' },
  en_preparation: { label: 'En préparation', color: 'bg-indigo-500' },
  expediee: { label: 'Expédiée', color: 'bg-purple-500' },
  livree: { label: 'Livrée', color: 'bg-green-500' },
  terminee: { label: 'Terminée', color: 'bg-emerald-600' },
  annulee: { label: 'Annulée', color: 'bg-red-500' },
};

export default function MarketingStatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/marketing/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Impossible de charger les statistiques
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Tableau de Bord Marketing
        </h2>
        <p className="text-muted-foreground">
          Statistiques et performances du DCAT E-Market
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overview.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs">
              {stats.overview.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={stats.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.overview.revenueGrowth > 0 ? '+' : ''}{stats.overview.revenueGrowth}%
              </span>
              <span className="text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commandes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalCommandes}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">
                {stats.overview.commandesThisMonth} ce mois
              </span>
              {stats.overview.commandesGrowth !== 0 && (
                <span className={stats.overview.commandesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ({stats.overview.commandesGrowth > 0 ? '+' : ''}{stats.overview.commandesGrowth}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalClients}</div>
            <div className="text-xs text-muted-foreground">
              +{stats.overview.newClientsThisMonth} nouveaux ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenu ce mois
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.overview.revenueThisMonth)}
            </div>
            <div className="text-xs text-muted-foreground">
              Depuis le 1er du mois
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthlyRevenue.map((month) => (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">{month.month}</span>
                  <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-md transition-all"
                      style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.commandesByStatus.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Aucune donnée</p>
              ) : (
                stats.commandesByStatus.map((status) => {
                  const config = STATUS_CONFIG[status.statut] || { label: status.statut, color: 'bg-gray-500' };
                  const percentage = stats.overview.totalCommandes 
                    ? Math.round((status.count / stats.overview.totalCommandes) * 100) 
                    : 0;
                  return (
                    <div key={status.statut} className="flex items-center gap-3">
                      <Badge className={`${config.color} text-white w-28 justify-center`}>
                        {config.label}
                      </Badge>
                      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                        <div
                          className={`h-full ${config.color} rounded-md transition-all opacity-80`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {status.count} ({percentage}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits les plus vendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">Aucune vente</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((product, idx) => (
                    <TableRow key={product.produitId || idx}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nom}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{product.quantite}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(product.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dernières commandes</CardTitle>
              <CardDescription>Commandes récentes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/marketing/emarket/commandes">
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentCommandes.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">Aucune commande</p>
            ) : (
              <div className="space-y-3">
                {stats.recentCommandes.map((commande) => {
                  const statusConfig = STATUS_CONFIG[commande.statut] || { label: commande.statut, color: 'bg-gray-500' };
                  return (
                    <div key={commande.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/marketing/emarket/commandes/${commande.id}`}
                            className="font-mono font-medium text-blue-600 hover:underline"
                          >
                            {commande.reference}
                          </Link>
                          <Badge className={`${statusConfig.color} text-white text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {commande.clientNom} • {commande.lignesCount} article(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(commande.totalTTC)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(commande.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
