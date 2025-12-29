'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Loader2,
  Filter,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  description: string | null;
  tags?: string[];
  quantite: number;
  seuilAlerte: number | null;
  prixVenteMin: number | null;
  etat: string;
  categorie: { id: string; nom: string } | null;
  famille: { id: string; nom: string } | null;
  marque: { id: string; nom: string } | null;
  modele: { id: string; nom: string } | null;
  emplacement: { id: string; nom: string } | null;
}

interface Categorie {
  id: string;
  nom: string;
}

export default function ProduitsPage() {
  const { toast } = useToast();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduit, setDeletingProduit] = useState<Produit | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [produitsRes, categoriesRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/categories'),
      ]);
      
      if (produitsRes.ok) setProduits(await produitsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (produit: Produit) => {
    setDeletingProduit(produit);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduit) return;

    try {
      const res = await fetch(`/api/produits/${deletingProduit.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Produit supprimé',
        description: `"${deletingProduit.nom}" a été supprimé`,
      });

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const filteredProduits = produits.filter(p => {
    const terms = searchQuery.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const matchesSearch =
      terms.length === 0 ||
      terms.some((term) =>
        p.nom.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.tags?.some((t) => t.toLowerCase().includes(term))
      );
    const matchesCategorie = filterCategorie === 'all' || p.categorie?.id === filterCategorie;
    return matchesSearch && matchesCategorie;
  });

  const getStockBadge = (produit: Produit) => {
    if (produit.quantite === 0) {
      return <Badge variant="destructive">Épuisé</Badge>;
    }
    if (produit.seuilAlerte && produit.quantite <= produit.seuilAlerte) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Stock faible
        </Badge>
      );
    }
    return <Badge variant="secondary">En stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Produits</h2>
          <p className="text-muted-foreground">
            Gérez votre inventaire de produits
          </p>
        </div>
        <Button asChild>
          <Link href="/stock/produits/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Liste des produits ({filteredProduits.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie / Famille</TableHead>
                <TableHead>Marque / Modèle</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-right">Prix vente min.</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProduits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery || filterCategorie !== 'all' 
                      ? 'Aucun produit trouvé' 
                      : 'Aucun produit en stock'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProduits.map((produit) => (
                  <TableRow key={produit.id}>
                    <TableCell className="font-mono text-sm">{produit.sku || '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{produit.nom}</div>
                      {produit.emplacement && (
                        <div className="text-xs text-muted-foreground">
                          📍 {produit.emplacement.nom}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {produit.categorie && (
                          <Badge variant="outline">{produit.categorie.nom}</Badge>
                        )}
                        {produit.famille && (
                          <Badge variant="secondary" className="text-xs">{produit.famille.nom}</Badge>
                        )}
                        {!produit.categorie && !produit.famille && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[produit.marque?.nom, produit.modele?.nom].filter(Boolean).join(' - ') || '-'}
                    </TableCell>
                    <TableCell className="text-center font-medium">{produit.quantite}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {produit.prixVenteMin ? formatCurrency(produit.prixVenteMin) : '-'}
                    </TableCell>
                    <TableCell>{getStockBadge(produit)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/stock/produits/${produit.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/stock/produits/${produit.id}/modifier`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(produit)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletingProduit?.nom}&quot; ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
