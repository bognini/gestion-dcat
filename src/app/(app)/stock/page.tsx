'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ArrowLeftRight, 
  FolderCog, 
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string;
  tags?: string[];
  quantite: number;
  seuilAlerte: number | null;
  prixVenteMin: number | null;
  categorie: { nom: string } | null;
  marque: { nom: string } | null;
}

export default function StockPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvementsCount, setMouvementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const [prodRes, mouvRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/mouvements?limit=1000'),
      ]);
      if (prodRes.ok) {
        setProduits(await prodRes.json());
      }
      if (mouvRes.ok) {
        const mouvements = await mouvRes.json();
        // Count movements from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = mouvements.filter((m: { date: string }) => new Date(m.date) >= thirtyDaysAgo).length;
        setMouvementsCount(recentCount);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProduits = produits.filter(p => {
    const terms = searchQuery.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return true;
    return terms.some((term) =>
      p.nom.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  const lowStockCount = produits.filter(p => p.seuilAlerte && p.seuilAlerte > 0 && p.quantite > 0 && p.quantite <= p.seuilAlerte).length;
  const totalValue = produits.reduce((sum, p) => sum + (p.prixVenteMin || 0) * p.quantite, 0);
  const totalItems = produits.reduce((sum, p) => sum + p.quantite, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion de Stock</h2>
          <p className="text-muted-foreground">
            Gérez votre inventaire, mouvements et emplacements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/stock/mouvements">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Mouvements
            </Link>
          </Button>
          <Button asChild>
            <Link href="/stock/produits/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total produits</CardDescription>
            <CardTitle className="text-2xl">{produits.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{totalItems} unités en stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valeur du stock</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Prix de vente total</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Stock faible</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {lowStockCount > 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              {lowStockCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Produits sous le seuil</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mouvements (30j)</CardDescription>
            <CardTitle className="text-2xl">{mouvementsCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Entrées et sorties</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/stock/produits">
            <CardHeader className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-t-lg p-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm">État de Stock</CardTitle>
                  <CardDescription className="text-green-100 text-xs">
                    Liste des produits
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/stock/mouvements">
            <CardHeader className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-t-lg p-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-6 w-6 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm">Mouvements</CardTitle>
                  <CardDescription className="text-emerald-100 text-xs">
                    Entrées et sorties
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/stock/rangement">
            <CardHeader className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-t-lg p-4">
              <div className="flex items-center gap-2">
                <FolderCog className="h-6 w-6 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm">Rangement</CardTitle>
                  <CardDescription className="text-teal-100 text-xs">
                    Emplacements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/stock/statistiques">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-lg p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm">Statistiques</CardTitle>
                  <CardDescription className="text-blue-100 text-xs">
                    Rapports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Products list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits en stock
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead>État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredProduits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit en stock'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProduits.slice(0, 10).map((produit) => (
                  <TableRow key={produit.id}>
                    <TableCell className="font-mono">{produit.sku || '-'}</TableCell>
                    <TableCell className="font-medium">{produit.nom}</TableCell>
                    <TableCell>{produit.categorie?.nom || '-'}</TableCell>
                    <TableCell>{produit.marque?.nom || '-'}</TableCell>
                    <TableCell className="text-right">{produit.quantite}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(produit.prixVenteMin || 0)}</TableCell>
                    <TableCell>
                      {produit.seuilAlerte && produit.quantite <= produit.seuilAlerte ? (
                        <Badge variant="destructive">Stock faible</Badge>
                      ) : produit.quantite === 0 ? (
                        <Badge variant="outline">Épuisé</Badge>
                      ) : (
                        <Badge variant="secondary">En stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filteredProduits.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/stock/produits">Voir tous les produits ({filteredProduits.length})</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
