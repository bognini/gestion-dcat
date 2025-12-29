'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Upload, X, GripVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SelectOption {
  id: string;
  nom: string;
}

interface Modele extends SelectOption {
  marque: { id: string; nom: string };
  famille: { 
    id: string; 
    nom: string; 
    categorieId: string;
    categorie: { id: string; nom: string };
  };
}

interface ExistingImage {
  id: string;
  filename: string;
  mime: string;
  sortOrder: number;
}

interface NewImage {
  file: File;
  preview: string;
}

const MAX_IMAGES = 6;

export default function ModifierProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [familles, setFamilles] = useState<{id: string; nom: string; categorieId: string}[]>([]);
  const [marques, setMarques] = useState<SelectOption[]>([]);
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [emplacements, setEmplacements] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productName, setProductName] = useState('');
  
  // Image management
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    sku: '',
    gtin: '',
    description: '',
    tags: '',
    categorieId: '',
    familleId: '',
    marqueId: '',
    modeleId: '',
    emplacementId: '',
    seuilAlerte: '',
    prixAchat: '',
    coutLogistique: '',
    prixVenteMin: '',
    poids: '',
    couleur: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [produitRes, catRes, famRes, marqRes, modRes, empRes, imagesRes] = await Promise.all([
        fetch(`/api/produits/${id}`),
        fetch('/api/categories'),
        fetch('/api/familles'),
        fetch('/api/marques'),
        fetch('/api/modeles'),
        fetch('/api/emplacements'),
        fetch(`/api/produits/${id}/images`),
      ]);
      
      if (!produitRes.ok) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Produit non trouvé' });
        router.push('/stock/produits');
        return;
      }

      const produit = await produitRes.json();
      setProductName(produit.nom);
      
      setFormData({
        nom: produit.nom || '',
        sku: produit.sku || '',
        gtin: produit.gtin || '',
        description: produit.description || '',
        tags: Array.isArray(produit.tags) ? produit.tags.join(', ') : '',
        categorieId: produit.categorieId || '',
        familleId: produit.familleId || '',
        marqueId: produit.marqueId || '',
        modeleId: produit.modeleId || '',
        emplacementId: produit.emplacementId || '',
        seuilAlerte: produit.seuilAlerte?.toString() || '',
        prixAchat: produit.prixAchat?.toString() || '',
        coutLogistique: produit.coutLogistique?.toString() || '',
        prixVenteMin: produit.prixVenteMin?.toString() || '',
        poids: produit.poids?.toString() || '',
        couleur: produit.couleur || '',
        notes: produit.notes || '',
      });
      
      if (catRes.ok) setCategories(await catRes.json());
      if (famRes.ok) setFamilles(await famRes.json());
      if (marqRes.ok) setMarques(await marqRes.json());
      if (modRes.ok) setModeles(await modRes.json());
      if (empRes.ok) setEmplacements(await empRes.json());
      if (imagesRes.ok) setExistingImages(await imagesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilles = formData.categorieId 
    ? familles.filter(f => f.categorieId === formData.categorieId)
    : familles;

  const filteredModeles = formData.marqueId 
    ? modeles.filter(m => m.marque.id === formData.marqueId)
    : modeles;

  // All images (existing that are not deleted + new)
  const allImagesCount = existingImages.filter(img => !imagesToDelete.includes(img.id)).length + newImages.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = MAX_IMAGES - allImagesCount;
    if (remainingSlots <= 0) {
      toast({ variant: 'destructive', title: 'Limite atteinte', description: `Maximum ${MAX_IMAGES} images autorisées` });
      return;
    }

    const imgs: NewImage[] = [];
    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (file.type.startsWith('image/')) {
        imgs.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });
    setNewImages(prev => [...prev, ...imgs]);
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].preview);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  // Drag handlers for existing images
  const handleExistingDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleExistingDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const visibleImages = existingImages.filter(img => !imagesToDelete.includes(img.id));
    const newImages = [...visibleImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    // Update the full existingImages array with new order
    const deletedImages = existingImages.filter(img => imagesToDelete.includes(img.id));
    setExistingImages([...newImages, ...deletedImages]);
    setDraggedIndex(index);
  };

  const handleExistingDragEnd = () => {
    setDraggedIndex(null);
  };

  // Calculate prix de revient (auto)
  const prixRevient = (Number(formData.prixAchat) || 0) + (Number(formData.coutLogistique) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/produits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom.trim(),
          sku: formData.sku.trim() || null,
          gtin: formData.gtin.trim() || null,
          description: formData.description.trim() || null,
          tags: formData.tags,
          seuilAlerte: formData.seuilAlerte ? Number(formData.seuilAlerte) : null,
          prixAchat: formData.prixAchat ? Number(formData.prixAchat) : null,
          coutLogistique: formData.coutLogistique ? Number(formData.coutLogistique) : null,
          prixVenteMin: formData.prixVenteMin ? Number(formData.prixVenteMin) : null,
          poids: formData.poids ? Number(formData.poids) : null,
          couleur: formData.couleur.trim() || null,
          notes: formData.notes.trim() || null,
          categorieId: formData.categorieId || null,
          marqueId: formData.marqueId || null,
          modeleId: formData.modeleId || null,
          emplacementId: formData.emplacementId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Delete images that were marked for deletion
      for (const imageId of imagesToDelete) {
        await fetch(`/api/produits/${id}/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId }),
        });
      }

      // Update image order for existing images
      const visibleExisting = existingImages.filter(img => !imagesToDelete.includes(img.id));
      if (visibleExisting.length > 0) {
        await fetch(`/api/produits/${id}/images`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageOrder: visibleExisting.map((img, idx) => ({ id: img.id, sortOrder: idx })),
          }),
        });
      }

      // Upload new images
      if (newImages.length > 0) {
        const formDataImg = new FormData();
        newImages.forEach((img, index) => {
          formDataImg.append(`image_${index}`, img.file);
        });
        await fetch(`/api/produits/${id}/images`, {
          method: 'POST',
          body: formDataImg,
        });
      }

      toast({
        title: 'Produit modifié',
        description: `"${formData.nom}" a été mis à jour`,
      });

      router.push(`/stock/produits/${id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setSaving(false);
    }
  };

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
          <Link href={`/stock/produits/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modifier le produit</h2>
          <p className="text-muted-foreground">{productName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails de base du produit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du produit *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Ordinateur portable HP ProBook"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Référence</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gtin">Code GTIN/EAN</Label>
                  <Input
                    id="gtin"
                    value={formData.gtin}
                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Mots-clés / Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Ex: hp, probook, i7, ordinateur"
                />
                <p className="text-xs text-muted-foreground">Séparez par des virgules.</p>
              </div>
            </CardContent>
          </Card>

          {/* Marque et modèle */}
          <Card>
            <CardHeader>
              <CardTitle>Marque et modèle</CardTitle>
              <CardDescription>Sélectionnez la marque et le modèle - la catégorie et famille seront remplies automatiquement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marqueId">Marque</Label>
                <Select 
                  value={formData.marqueId} 
                  onValueChange={(v) => setFormData({ ...formData, marqueId: v, modeleId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {marques.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modeleId">Modèle</Label>
                <Select 
                  value={formData.modeleId} 
                  onValueChange={(v) => {
                    const selectedModele = modeles.find(m => m.id === v);
                    if (selectedModele) {
                      setFormData({ 
                        ...formData, 
                        modeleId: v,
                        familleId: selectedModele.famille.id,
                        categorieId: selectedModele.famille.categorieId,
                      });
                    } else {
                      setFormData({ ...formData, modeleId: v });
                    }
                  }}
                  disabled={filteredModeles.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      filteredModeles.length === 0 
                        ? 'Aucun modèle disponible' 
                        : 'Sélectionner un modèle'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredModeles.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nom} ({m.famille.nom})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.modeleId && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Catégorie (auto)</Label>
                    <p className="font-medium">
                      {modeles.find(m => m.id === formData.modeleId)?.famille.categorie.nom || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Famille (auto)</Label>
                    <p className="font-medium">
                      {modeles.find(m => m.id === formData.modeleId)?.famille.nom || '-'}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poids">Poids (kg)</Label>
                  <Input
                    id="poids"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.poids}
                    onChange={(e) => setFormData({ ...formData, poids: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="couleur">Couleur</Label>
                  <Input
                    id="couleur"
                    value={formData.couleur}
                    onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                    placeholder="Ex: Noir"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emplacementId">Emplacement de rangement</Label>
                <Select 
                  value={formData.emplacementId} 
                  onValueChange={(v) => setFormData({ ...formData, emplacementId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Prix et coûts */}
          <Card>
            <CardHeader>
              <CardTitle>Prix et coûts</CardTitle>
              <CardDescription>Tarification du produit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prixAchat">Prix d&apos;achat (CFA)</Label>
                  <MoneyInput
                    id="prixAchat"
                    min="0"
                    value={formData.prixAchat}
                    onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coutLogistique">Coûts logistiques (CFA)</Label>
                  <MoneyInput
                    id="coutLogistique"
                    min="0"
                    value={formData.coutLogistique}
                    onChange={(e) => setFormData({ ...formData, coutLogistique: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix de revient (auto)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted text-muted-foreground flex items-center">
                    {formatCurrency(prixRevient)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prixVenteMin">Prix de vente minimum (CFA)</Label>
                  <MoneyInput
                    id="prixVenteMin"
                    min="0"
                    value={formData.prixVenteMin}
                    onChange={(e) => setFormData({ ...formData, prixVenteMin: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seuilAlerte">Seuil d&apos;alerte stock</Label>
                <Input
                  id="seuilAlerte"
                  type="number"
                  min="0"
                  value={formData.seuilAlerte}
                  onChange={(e) => setFormData({ ...formData, seuilAlerte: e.target.value })}
                  placeholder="Quantité minimum avant alerte"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images du produit</CardTitle>
              <CardDescription>Photos pour l&apos;identification (max {MAX_IMAGES})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allImagesCount < MAX_IMAGES && (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour ajouter des images ({allImagesCount}/{MAX_IMAGES})
                  </p>
                </div>
              )}
              
              {/* Existing Images */}
              {existingImages.filter(img => !imagesToDelete.includes(img.id)).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Glissez-déposez pour réorganiser. La première image sera l&apos;image principale.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages
                      .filter(img => !imagesToDelete.includes(img.id))
                      .map((img, index) => (
                        <div 
                          key={img.id} 
                          className={`relative group border-2 rounded-lg overflow-hidden cursor-move ${
                            draggedIndex === index ? 'border-primary opacity-50' : 'border-transparent'
                          } ${index === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          draggable
                          onDragStart={() => handleExistingDragStart(index)}
                          onDragOver={(e) => handleExistingDragOver(e, index)}
                          onDragEnd={handleExistingDragEnd}
                        >
                          <div className="absolute top-1 left-1 z-10 flex items-center gap-1">
                            <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                              {index === 0 ? 'Principal' : index + 1}
                            </span>
                            <GripVertical className="h-4 w-4 text-white drop-shadow" />
                          </div>
                          <img
                            src={`/api/produits/${id}/images/${img.id}`}
                            alt={img.filename}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Nouvelles images (seront ajoutées)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {newImages.map((img, index) => (
                      <div 
                        key={img.preview} 
                        className="relative group border-2 border-primary/50 rounded-lg overflow-hidden"
                      >
                        <img
                          src={img.preview}
                          alt={`Nouvelle ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Informations complémentaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes internes sur ce produit..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href={`/stock/produits/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
