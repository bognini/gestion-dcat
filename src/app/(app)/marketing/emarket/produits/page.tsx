'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Eye, 
  EyeOff, 
  Star,
  StarOff,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Percent,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  prixVente: number | null;
  prixVenteMin: number | null;
  promoPrice: number | null;
  promoStart: string | Date | null;
  promoEnd: string | Date | null;
  quantite: number;
  isPublished: boolean;
  isFeatured: boolean;
  categorie: { id: string; nom: string } | null;
  marque: { id: string; nom: string } | null;
  images: string[];
}

interface Category {
  id: string;
  nom: string;
}

export default function EmarketProduitsPage() {
  const { toast } = useToast();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  
  // Dialog for promo price
  const [promoDialog, setPromoDialog] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [promoPrice, setPromoPrice] = useState('');
  const [promoType, setPromoType] = useState<'forever' | 'period'>('forever');
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [produitsRes, categoriesRes] = await Promise.all([
        fetch('/api/produits?limit=1000'),
        fetch('/api/categories'),
      ]);
      
      if (produitsRes.ok) {
        const data = await produitsRes.json();
        setProduits(data.produits || data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePublished = async (produit: Produit) => {
    setSaving(produit.id);
    try {
      const res = await fetch(`/api/produits/${produit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !produit.isPublished }),
      });

      if (res.ok) {
        setProduits(prev => prev.map(p => 
          p.id === produit.id ? { ...p, isPublished: !p.isPublished } : p
        ));
        toast({ 
          title: produit.isPublished ? 'Produit retiré' : 'Produit publié',
          description: `"${produit.nom}" ${produit.isPublished ? 'retiré de' : 'publié sur'} la boutique` 
        });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le produit' });
    } finally {
      setSaving(null);
    }
  };

  const toggleFeatured = async (produit: Produit) => {
    setSaving(produit.id);
    try {
      const res = await fetch(`/api/produits/${produit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !produit.isFeatured }),
      });

      if (res.ok) {
        setProduits(prev => prev.map(p => 
          p.id === produit.id ? { ...p, isFeatured: !p.isFeatured } : p
        ));
        toast({ 
          title: produit.isFeatured ? 'Vedette retirée' : 'Produit mis en vedette',
        });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le produit' });
    } finally {
      setSaving(null);
    }
  };

  const openPromoDialog = (produit: Produit) => {
    setSelectedProduit(produit);
    setPromoPrice(produit.promoPrice?.toString() || '');
    // Determine promo type based on dates
    // Note: We need to cast produit to access these fields if they aren't in the interface yet
    // but they were added to the API update. We should update the interface too.
    const p = produit as any;
    if (p.promoStart || p.promoEnd) {
      setPromoType('period');
      setPromoStart(p.promoStart ? new Date(p.promoStart).toISOString().split('T')[0] : '');
      setPromoEnd(p.promoEnd ? new Date(p.promoEnd).toISOString().split('T')[0] : '');
    } else {
      setPromoType('forever');
      setPromoStart('');
      setPromoEnd('');
    }
    setPromoDialog(true);
  };

  const savePromoPrice = async () => {
    if (!selectedProduit) return;
    
    setSaving(selectedProduit.id);
    try {
      const newPromoPrice = promoPrice ? parseFloat(promoPrice) : null;
      
      const payload: any = { promoPrice: newPromoPrice };
      
      if (promoType === 'period') {
        payload.promoStart = promoStart || null;
        payload.promoEnd = promoEnd || null;
      } else {
        payload.promoStart = null;
        payload.promoEnd = null;
      }

      const res = await fetch(`/api/produits/${selectedProduit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProduits(prev => prev.map(p => 
          p.id === selectedProduit.id ? { 
            ...p, 
            promoPrice: newPromoPrice,
            // Update dates in local state too for immediate feedback if we added them to interface
             ...((payload.promoStart !== undefined) ? { promoStart: payload.promoStart } : {}),
             ...((payload.promoEnd !== undefined) ? { promoEnd: payload.promoEnd } : {})
          } : p
        ));
        toast({ 
          title: newPromoPrice ? 'Prix promo appliqué' : 'Prix promo retiré',
          description: `"${selectedProduit.nom}"` 
        });
        setPromoDialog(false);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le prix' });
    } finally {
      setSaving(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    
    setBulkAction(action);
    const ids = Array.from(selectedIds);
    
    try {
      for (const id of ids) {
        const update: Record<string, boolean> = {};
        if (action === 'publish') update.isPublished = true;
        if (action === 'unpublish') update.isPublished = false;
        if (action === 'feature') update.isFeatured = true;
        if (action === 'unfeature') update.isFeatured = false;
        
        await fetch(`/api/produits/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
      }
      
      await fetchData();
      setSelectedIds(new Set());
      toast({ 
        title: 'Modifications appliquées',
        description: `${ids.length} produit(s) modifié(s)` 
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Certaines modifications ont échoué' });
    } finally {
      setBulkAction(null);
    }
  };

  // Filter products
  const filteredProduits = produits.filter(p => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && 
        !p.sku?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categorieFilter !== 'all' && p.categorie?.id !== categorieFilter) return false;
    if (publishedFilter === 'published' && !p.isPublished) return false;
    if (publishedFilter === 'unpublished' && p.isPublished) return false;
    if (publishedFilter === 'featured' && !p.isFeatured) return false;
    if (publishedFilter === 'promo' && !p.promoPrice) return false;
    return true;
  });

  // Stats
  const stats = {
    total: produits.length,
    published: produits.filter(p => p.isPublished).length,
    featured: produits.filter(p => p.isFeatured).length,
    promo: produits.filter(p => p.promoPrice).length,
    inStock: produits.filter(p => p.quantite > 0).length,
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProduits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProduits.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/marketing/emarket">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des produits</h2>
            <p className="text-muted-foreground">
              Publiez et gérez les produits sur DCAT E-Market
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" asChild>
            <Link href="/boutique" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la boutique
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total produits</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Publiés</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En vedette</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.featured}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En promo</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.promo}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En stock</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.inStock}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="unpublished">Non publiés</SelectItem>
                <SelectItem value="featured">En vedette</SelectItem>
                <SelectItem value="promo">En promo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-4">
              <span className="text-sm font-medium">{selectedIds.size} produit(s) sélectionné(s)</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('publish')}
                  disabled={!!bulkAction}
                >
                  {bulkAction === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                  Publier
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('unpublish')}
                  disabled={!!bulkAction}
                >
                  {bulkAction === 'unpublish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  Retirer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('feature')}
                  disabled={!!bulkAction}
                >
                  {bulkAction === 'feature' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 mr-1" />}
                  Mettre en vedette
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('unfeature')}
                  disabled={!!bulkAction}
                >
                  {bulkAction === 'unfeature' ? <Loader2 className="h-4 w-4 animate-spin" /> : <StarOff className="h-4 w-4 mr-1" />}
                  Retirer vedette
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProduits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun produit trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.size === filteredProduits.length && filteredProduits.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Prix promo</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Publié</TableHead>
                  <TableHead className="text-center">Vedette</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProduits.map((produit) => {
                  const basePrice = produit.prixVenteMin || produit.prixVente || 0;
                  const hasPromo = produit.promoPrice && produit.promoPrice > 0 && basePrice > 0 && produit.promoPrice < basePrice;
                  const discount = hasPromo 
                    ? Math.round((1 - produit.promoPrice! / basePrice) * 100) 
                    : 0;

                  return (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(produit.id)}
                          onCheckedChange={() => toggleSelect(produit.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                            {produit.images?.[0] ? (
                              <img src={produit.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{produit.nom}</p>
                            {produit.sku && <p className="text-xs text-muted-foreground">{produit.sku}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {produit.categorie?.nom || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        {(produit.prixVenteMin || produit.prixVente) ? formatCurrency(produit.prixVenteMin || produit.prixVente || 0) : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {hasPromo ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-red-600 whitespace-nowrap">{formatCurrency(produit.promoPrice!)}</span>
                            <Badge variant="destructive" className="text-xs whitespace-nowrap">-{discount}%</Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={produit.quantite > 0 ? 'default' : 'secondary'}>
                          {produit.quantite}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublished(produit)}
                          disabled={saving === produit.id}
                          className={produit.isPublished ? 'text-green-600' : 'text-muted-foreground'}
                        >
                          {saving === produit.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : produit.isPublished ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFeatured(produit)}
                          disabled={saving === produit.id}
                          className={produit.isFeatured ? 'text-amber-500' : 'text-muted-foreground'}
                        >
                          {saving === produit.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : produit.isFeatured ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={hasPromo ? "default" : "outline"}
                          size="sm"
                          onClick={() => openPromoDialog(produit)}
                          className={hasPromo ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          <Percent className="h-4 w-4 mr-1" />
                          {hasPromo ? `${discount}% Promo` : 'Promo'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Promo Dialog */}
      <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prix promotionnel</DialogTitle>
            <DialogDescription>
              Définir un prix promo pour "{selectedProduit?.nom}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prix normal</Label>
              <p className="text-lg font-mono">{formatCurrency(selectedProduit?.prixVenteMin || selectedProduit?.prixVente || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoPrice">Prix promotionnel (FCFA)</Label>
              <Input
                id="promoPrice"
                type="number"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="Laisser vide pour retirer la promo"
                className="money-input"
              />
              {promoPrice && (selectedProduit?.prixVenteMin || selectedProduit?.prixVente) && parseFloat(promoPrice) < (selectedProduit?.prixVenteMin || selectedProduit?.prixVente || 0) && (
                <p className="text-sm text-green-600">
                  Réduction de {Math.round((1 - parseFloat(promoPrice) / (selectedProduit?.prixVenteMin || selectedProduit?.prixVente || 1)) * 100)}%
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label>Durée de la promotion</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="forever"
                    name="promoType"
                    value="forever"
                    checked={promoType === 'forever'}
                    onChange={() => setPromoType('forever')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <Label htmlFor="forever" className="font-normal">Indéterminée</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="period"
                    name="promoType"
                    value="period"
                    checked={promoType === 'period'}
                    onChange={() => setPromoType('period')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <Label htmlFor="period" className="font-normal">Période spécifique</Label>
                </div>
              </div>

              {promoType === 'period' && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="promoStart">Date de début</Label>
                    <Input
                      id="promoStart"
                      type="date"
                      value={promoStart}
                      onChange={(e) => setPromoStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoEnd">Date de fin</Label>
                    <Input
                      id="promoEnd"
                      type="date"
                      value={promoEnd}
                      onChange={(e) => setPromoEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog(false)}>
              Annuler
            </Button>
            <Button onClick={savePromoPrice} disabled={saving === selectedProduit?.id}>
              {saving === selectedProduit?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
