'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart3, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  quantite: number;
  seuilAlerte: number | null;
  prixAchat: number | null;
  prixVenteMin: number | null;
  categorie: { nom: string } | null;
}

interface Mouvement {
  id: string;
  type: string;
  quantite: number;
  date: string;
  prixVenteDefinitif: number | null;
  produit: { nom: string };
}

interface Stats {
  totalProduits: number;
  totalUnites: number;
  valeurStock: number;
  valeurRevient: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentEntrees: number;
  recentSorties: number;
  totalVentes: number;
}

export default function StatistiquesPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [produitsRes, mouvementsRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/mouvements?limit=100'),
      ]);

      if (produitsRes.ok) setProduits(await produitsRes.json());
      if (mouvementsRes.ok) setMouvements(await mouvementsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats: Stats = {
    totalProduits: produits.length,
    totalUnites: produits.reduce((sum, p) => sum + p.quantite, 0),
    valeurStock: produits.reduce((sum, p) => sum + (p.prixVenteMin || 0) * p.quantite, 0),
    valeurRevient: produits.reduce((sum, p) => sum + (p.prixAchat || 0) * p.quantite, 0),
    lowStockCount: produits.filter(p => p.seuilAlerte && p.quantite > 0 && p.quantite <= p.seuilAlerte).length,
    outOfStockCount: produits.filter(p => p.quantite === 0).length,
    recentEntrees: mouvements.filter(m => m.type === 'ENTREE').reduce((sum, m) => sum + m.quantite, 0),
    recentSorties: mouvements.filter(m => m.type === 'SORTIE').reduce((sum, m) => sum + m.quantite, 0),
    totalVentes: mouvements.filter(m => m.type === 'SORTIE' && m.prixVenteDefinitif).reduce((sum, m) => sum + (m.prixVenteDefinitif || 0), 0),
  };

  // Top products by quantity
  const topByQuantity = [...produits].sort((a, b) => b.quantite - a.quantite).slice(0, 5);

  // Low stock products
  const lowStockProducts = produits
    .filter(p => p.seuilAlerte && p.quantite <= p.seuilAlerte)
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 5);

  // Products by category
  const categoryStats = produits.reduce((acc, p) => {
    const cat = p.categorie?.nom || 'Non catégorisé';
    if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
    acc[cat].count += p.quantite;
    acc[cat].value += (p.prixVenteMin || 0) * p.quantite;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Statistiques du Stock
          </h2>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble et analyses
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="min-w-0">
          <CardHeader className="pb-2 px-4">
            <CardDescription className="text-xs">Produits</CardDescription>
            <CardTitle className="text-2xl whitespace-nowrap">{stats.totalProduits}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">
              {stats.totalUnites} unités
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2 px-4">
            <CardDescription className="text-xs">Valeur Stock</CardDescription>
            <CardTitle className="text-xl text-green-600 whitespace-nowrap">{formatCurrency(stats.valeurStock)}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Revient: {formatCurrency(stats.valeurRevient)}
            </p>
          </CardContent>
        </Card>

        <Card className={`min-w-0 ${stats.lowStockCount > 0 ? 'border-orange-500' : ''}`}>
          <CardHeader className="pb-2 px-4">
            <CardDescription className="flex items-center gap-1 text-xs">
              {stats.lowStockCount > 0 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
              Stock Faible
            </CardDescription>
            <CardTitle className="text-2xl whitespace-nowrap">{stats.lowStockCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">
              {stats.outOfStockCount} en rupture
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2 px-4">
            <CardDescription className="text-xs">Mouvements</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2 whitespace-nowrap">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-4 w-4" />
                {stats.recentEntrees}
              </span>
              <span className="text-red-600 flex items-center">
                <ArrowDownRight className="h-4 w-4" />
                {stats.recentSorties}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Entrées / Sorties
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2 px-4">
            <CardDescription className="text-xs">Total Ventes</CardDescription>
            <CardTitle className="text-xl text-blue-600 whitespace-nowrap">{formatCurrency(stats.totalVentes)}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Prix définitif
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 5 - Quantité en Stock
            </CardTitle>
            <CardDescription>Produits avec le plus de stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topByQuantity.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {idx + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{p.nom}</p>
                      {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                    </div>
                  </div>
                  <Badge>{p.quantite} unités</Badge>
                </div>
              ))}
              {topByQuantity.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucun produit</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={lowStockProducts.length > 0 ? 'border-orange-500/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Alertes Stock Faible
            </CardTitle>
            <CardDescription>Produits à réapprovisionner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.nom}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant={p.quantite === 0 ? 'destructive' : 'secondary'}>
                      {p.quantite} / {p.seuilAlerte}
                    </Badge>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">Stock OK pour tous les produits</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Répartition par Catégorie
          </CardTitle>
          <CardDescription>Stock et valeur par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(categoryStats).map(([cat, data]) => (
              <Card key={cat} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-2xl font-bold">{data.count}</p>
                  <p className="text-xs text-muted-foreground">unités</p>
                  <p className="text-sm text-green-600 font-medium">{formatCurrency(data.value)}</p>
                </CardContent>
              </Card>
            ))}
            {Object.keys(categoryStats).length === 0 && (
              <p className="text-muted-foreground col-span-3 text-center py-4">Aucune donnée</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
