'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  Loader2,
  MapPin,
  Tag,
  Building2,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Barcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  gtin: string | null;
  description: string | null;
  quantite: number;
  seuilAlerte: number | null;
  prixAchat: number | null;
  prixVenteMin: number | null;
  coutLogistique: number | null;
  notes: string | null;
  poids: number | null;
  couleur: string | null;
  tags: string[];
  categorie: { id: string; nom: string } | null;
  famille: { id: string; nom: string } | null;
  marque: { id: string; nom: string } | null;
  modele: { id: string; nom: string } | null;
  emplacement: { id: string; nom: string; zone?: string; allee?: string; etagere?: string } | null;
  mouvements: Mouvement[];
  createdAt: string;
  updatedAt: string;
}

interface Mouvement {
  id: string;
  date: string;
  type: string;
  quantite: number;
  commentaire: string | null;
  utilisateur: { nom: string; prenom: string };
  fournisseur: { nom: string } | null;
  destination: string | null;
}

interface ProduitImage {
  id: string;
  filename: string;
  mime: string;
  sortOrder: number;
}

export default function ProduitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [images, setImages] = useState<ProduitImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchProduit();
    fetchImages();
  }, [id]);

  const fetchProduit = async () => {
    try {
      const res = await fetch(`/api/produits/${id}`);
      if (res.ok) {
        setProduit(await res.json());
      } else if (res.status === 404) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Produit non trouvé' });
        router.push('/stock/produits');
      }
    } catch (error) {
      console.error('Error fetching produit:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le produit' });
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/produits/${id}/images`);
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/produits/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({ title: 'Produit supprimé', description: `"${produit?.nom}" a été supprimé` });
      router.push('/stock/produits');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const getStockBadge = () => {
    if (!produit) return null;
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
    return <Badge variant="secondary" className="bg-green-100 text-green-700">En stock</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!produit) {
    return null;
  }

  const prixRevient = (produit.prixAchat || 0) + (produit.coutLogistique || 0);
  const marge = produit.prixVenteMin && prixRevient > 0
    ? ((produit.prixVenteMin - prixRevient) / produit.prixVenteMin * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock/produits">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{produit.nom}</h2>
            {getStockBadge()}
          </div>
          <p className="text-muted-foreground">
            {produit.sku && <span className="font-mono">{produit.sku}</span>}
            {produit.sku && produit.categorie && ' • '}
            {produit.categorie?.nom}
            {produit.famille && ` / ${produit.famille.nom}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/stock/produits/${id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Images Gallery */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Photos du produit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Main Image */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={`/api/produits/${id}/images/${images[selectedImageIndex]?.id}`}
                    alt={images[selectedImageIndex]?.filename || 'Image produit'}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, index) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={`/api/produits/${id}/images/${img.id}`}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {produit.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{produit.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {produit.tags && produit.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Mots-clés / Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {produit.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  {produit.marque && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Marque</p>
                        <p className="font-medium">{produit.marque.nom}</p>
                      </div>
                    </div>
                  )}
                  {produit.modele && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Modèle</p>
                        <p className="font-medium">{produit.modele.nom}</p>
                      </div>
                    </div>
                  )}
                  {produit.gtin && (
                    <div className="flex items-center gap-3">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Code GTIN/EAN</p>
                        <p className="font-mono">{produit.gtin}</p>
                      </div>
                    </div>
                  )}
                  </div>
                <div className="space-y-4">
                  {produit.couleur && (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: produit.couleur }} />
                      <div>
                        <p className="text-sm text-muted-foreground">Couleur</p>
                        <p className="font-medium">{produit.couleur}</p>
                      </div>
                    </div>
                  )}
                  {produit.poids && (
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Poids</p>
                        <p className="font-medium">{produit.poids} kg</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mouvements récents</CardTitle>
              <CardDescription>Historique des entrées et sorties</CardDescription>
            </CardHeader>
            <CardContent>
              {produit.mouvements.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun mouvement enregistré</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead>Opérateur</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produit.mouvements.slice(0, 10).map((mouvement) => (
                      <TableRow key={mouvement.id}>
                        <TableCell className="text-sm">{formatDate(mouvement.date)}</TableCell>
                        <TableCell>
                          {mouvement.type === 'ENTREE' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Entrée
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Sortie
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                        </TableCell>
                        <TableCell className="text-sm">
                          {mouvement.utilisateur.prenom} {mouvement.utilisateur.nom}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mouvement.fournisseur?.nom || mouvement.destination || mouvement.commentaire || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {produit.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{produit.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{produit.quantite}</p>
                <p className="text-muted-foreground">unités en stock</p>
              </div>
              {produit.seuilAlerte && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Seuil d&apos;alerte: </span>
                  <span className="font-medium">{produit.seuilAlerte}</span>
                </div>
              )}
              <Separator />
              <Button className="w-full" asChild>
                <Link href={`/stock/mouvements/nouveau?produit=${id}`}>
                  Nouveau mouvement
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Prix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {produit.prixAchat !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix d&apos;achat</span>
                  <span className="font-medium">{formatCurrency(produit.prixAchat)}</span>
                </div>
              )}
              {produit.coutLogistique !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coût logistique</span>
                  <span className="font-medium">{formatCurrency(produit.coutLogistique)}</span>
                </div>
              )}
              {prixRevient > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix de revient</span>
                  <span className="font-medium">{formatCurrency(prixRevient)}</span>
                </div>
              )}
              <Separator />
              {produit.prixVenteMin !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix de vente min.</span>
                  <span className="font-bold text-lg">{formatCurrency(produit.prixVenteMin)}</span>
                </div>
              )}
              {marge && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marge</span>
                  <Badge variant={parseFloat(marge) > 20 ? 'default' : 'secondary'}>{marge}%</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {produit.emplacement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Emplacement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{produit.emplacement.nom}</p>
                {(produit.emplacement.zone || produit.emplacement.allee || produit.emplacement.etagere) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[produit.emplacement.zone, produit.emplacement.allee, produit.emplacement.etagere]
                      .filter(Boolean)
                      .join(' → ')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Créé le {formatDate(produit.createdAt)}</p>
                <p>Modifié le {formatDate(produit.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{produit.nom}&quot; ?
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
