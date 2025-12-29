'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FolderCog, 
  MapPin, 
  Package,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Emplacement {
  id: string;
  nom: string;
  description: string | null;
  bureau: string | null;
  armoire: string | null;
  aile: string | null;
  etagere: string | null;
  _count?: { produits: number };
}

const DEFAULT_BUREAUX = ['BUREAU DG', 'BUREAU IT', 'ATELIER'];

const ARMOIRES = [
  { value: 'Armoire', label: 'Armoire' },
  { value: 'Grille', label: 'Grille' },
];

const AILES = [
  { value: 'Droite', label: 'Droite' },
  { value: 'Gauche', label: 'Gauche' },
];

const ETAGERES_STANDARD = ['1', '2', '3', '4', '5'];
const ETAGERES_ATELIER = ['Mobile', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function RangementPage() {
  const { toast } = useToast();
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmplacement, setEditingEmplacement] = useState<Emplacement | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    bureau: '',
    customBureau: '',
    armoire: '',
    aile: '',
    etagere: '',
  });
  const [showCustomBureau, setShowCustomBureau] = useState(false);

  // Get unique bureaux from existing emplacements
  const existingBureaux = [...new Set(emplacements.map(e => e.bureau).filter(Boolean))] as string[];
  const allBureaux = [...new Set([...DEFAULT_BUREAUX, ...existingBureaux])];

  useEffect(() => {
    fetchEmplacements();
  }, []);

  const fetchEmplacements = async () => {
    try {
      const res = await fetch('/api/emplacements');
      if (res.ok) {
        const data = await res.json();
        setEmplacements(data);
      }
    } catch (error) {
      console.error('Error fetching emplacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const effectiveName = formData.nom.trim() || generateName();
    if (!effectiveName.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const url = editingEmplacement 
        ? `/api/emplacements/${editingEmplacement.id}` 
        : '/api/emplacements';
      const method = editingEmplacement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: effectiveName.trim(),
          description: formData.description.trim() || null,
          bureau: showCustomBureau ? formData.customBureau.trim() : formData.bureau || null,
          armoire: formData.armoire || null,
          aile: formData.aile || null,
          etagere: formData.etagere || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: editingEmplacement ? 'Emplacement modifié' : 'Emplacement créé',
        description: `"${effectiveName}" a été ${editingEmplacement ? 'modifié' : 'créé'}`,
      });

      setDialogOpen(false);
      resetForm();
      fetchEmplacements();
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

  const handleDelete = async () => {
    if (!editingEmplacement) return;

    try {
      const res = await fetch(`/api/emplacements/${editingEmplacement.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Emplacement supprimé',
        description: `"${editingEmplacement.nom}" a été supprimé`,
      });

      setDeleteDialogOpen(false);
      setEditingEmplacement(null);
      fetchEmplacements();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingEmplacement(null);
    setDialogOpen(true);
  };

  const openEditDialog = (emplacement: Emplacement) => {
    setEditingEmplacement(emplacement);
    setFormData({
      nom: emplacement.nom,
      description: emplacement.description || '',
      bureau: emplacement.bureau || '',
      customBureau: '',
      armoire: emplacement.armoire || '',
      aile: emplacement.aile || '',
      etagere: emplacement.etagere || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      bureau: '',
      customBureau: '',
      armoire: '',
      aile: '',
      etagere: '',
    });
    setShowCustomBureau(false);
  };

  // Auto-generate name based on selections
  const generateName = () => {
    const parts = [];
    const bureauName = showCustomBureau ? formData.customBureau : formData.bureau;
    if (bureauName) parts.push(bureauName);
    if (formData.armoire) parts.push(formData.armoire);
    if (formData.aile) parts.push(`Aile ${formData.aile}`);
    if (formData.etagere) parts.push(`Ét.${formData.etagere}`);
    return parts.join(' - ');
  };

  // Get the effective bureau value
  const getEffectiveBureau = () => showCustomBureau ? formData.customBureau : formData.bureau;

  const filteredEmplacements = emplacements.filter(e =>
    e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bureau?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stock">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderCog className="h-6 w-6" />
              Rangement
            </h2>
            <p className="text-muted-foreground">
              Gérez les emplacements de stockage
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel emplacement
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un emplacement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmplacements.map((emplacement) => (
          <Card key={emplacement.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{emplacement.nom}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openEditDialog(emplacement)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingEmplacement(emplacement);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {emplacement.description && (
                <CardDescription>{emplacement.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                {emplacement.bureau && (
                  <Badge variant="outline">{emplacement.bureau}</Badge>
                )}
                {emplacement.armoire && (
                  <Badge variant="outline">{emplacement.armoire}</Badge>
                )}
                {emplacement.aile && (
                  <Badge variant="outline">Aile {emplacement.aile}</Badge>
                )}
                {emplacement.etagere && (
                  <Badge variant="outline">Ét. {emplacement.etagere}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{emplacement._count?.produits || 0} produit(s)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmplacements.length === 0 && (
        <div className="text-center py-12">
          <FolderCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucun emplacement</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Aucun résultat pour cette recherche' : 'Créez votre premier emplacement de stockage'}
          </p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmplacement ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}
            </DialogTitle>
            <DialogDescription>
              {editingEmplacement 
                ? 'Modifiez les informations de l\'emplacement' 
                : 'Créez un nouvel emplacement de stockage'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bureau *</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    setShowCustomBureau(!showCustomBureau);
                    if (!showCustomBureau) {
                      setFormData({ ...formData, bureau: '', armoire: '', aile: '', etagere: '' });
                    } else {
                      setFormData({ ...formData, customBureau: '', armoire: '', aile: '', etagere: '' });
                    }
                  }}
                >
                  {showCustomBureau ? 'Choisir existant' : '+ Nouveau bureau'}
                </Button>
              </div>
              {showCustomBureau ? (
                <Input
                  value={formData.customBureau}
                  onChange={(e) => setFormData({ ...formData, customBureau: e.target.value.toUpperCase(), armoire: '', aile: '', etagere: '' })}
                  placeholder="Ex: BUREAU COMMERCIAL"
                />
              ) : (
                <Select 
                  value={formData.bureau} 
                  onValueChange={(v) => {
                    const isAtelier = v === 'ATELIER' || v.toUpperCase().includes('ATELIER');
                    const newArmoire = isAtelier ? 'Grille' : 'Armoire';
                    setFormData({ ...formData, bureau: v, armoire: newArmoire, aile: '', etagere: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBureaux.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getEffectiveBureau()?.toUpperCase().includes('ATELIER') ? 'Structure' : 'Armoire'}</Label>
                <Select 
                  value={formData.armoire} 
                  onValueChange={(v) => setFormData({ ...formData, armoire: v, aile: '', etagere: '' })}
                  disabled={!getEffectiveBureau()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {getEffectiveBureau()?.toUpperCase().includes('ATELIER') ? (
                      <SelectItem value="Grille">Grille</SelectItem>
                    ) : (
                      <SelectItem value="Armoire">Armoire</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {!getEffectiveBureau()?.toUpperCase().includes('ATELIER') && (
                <div className="space-y-2">
                  <Label>Aile</Label>
                  <Select 
                    value={formData.aile} 
                    onValueChange={(v) => setFormData({ ...formData, aile: v })}
                    disabled={!formData.armoire}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {AILES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              </div>
            <div className="space-y-2">
              <Label>Étagère *</Label>
              <Select 
                value={formData.etagere} 
                onValueChange={(v) => {
                  setFormData({ ...formData, etagere: v });
                }}
                disabled={getEffectiveBureau()?.toUpperCase().includes('ATELIER') ? !formData.armoire : !formData.aile}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(getEffectiveBureau()?.toUpperCase().includes('ATELIER') ? ETAGERES_ATELIER : ETAGERES_STANDARD).map((e) => (
                    <SelectItem key={e} value={e}>{e === 'Mobile' ? 'Étagère Mobile' : `Étagère ${e}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l'emplacement</Label>
              <Input
                id="nom"
                value={formData.nom || generateName()}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Généré automatiquement"
              />
              <p className="text-xs text-muted-foreground">Le nom est généré automatiquement mais peut être modifié</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'emplacement..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmplacement ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;emplacement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{editingEmplacement?.nom}&quot; ?
              {editingEmplacement?._count?.produits ? (
                <span className="block mt-2 text-orange-600">
                  Attention : {editingEmplacement._count.produits} produit(s) sont associés à cet emplacement.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
