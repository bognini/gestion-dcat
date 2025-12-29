'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Loader2
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

interface Emplacement {
  id: string;
  nom: string;
  description: string | null;
  zone: string | null;
  allee: string | null;
  etagere: string | null;
  _count: { produits: number };
}

export default function EmplacementsPage() {
  const { toast } = useToast();
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmplacement, setEditingEmplacement] = useState<Emplacement | null>(null);
  const [deletingEmplacement, setDeletingEmplacement] = useState<Emplacement | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '', 
    zone: '', 
    allee: '', 
    etagere: '' 
  });
  const [saving, setSaving] = useState(false);

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
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les emplacements' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEmplacement(null);
    setFormData({ nom: '', description: '', zone: '', allee: '', etagere: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (emplacement: Emplacement) => {
    setEditingEmplacement(emplacement);
    setFormData({ 
      nom: emplacement.nom, 
      description: emplacement.description || '',
      zone: emplacement.zone || '',
      allee: emplacement.allee || '',
      etagere: emplacement.etagere || ''
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (emplacement: Emplacement) => {
    setDeletingEmplacement(emplacement);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const url = editingEmplacement ? `/api/emplacements/${editingEmplacement.id}` : '/api/emplacements';
      const method = editingEmplacement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: editingEmplacement ? 'Emplacement modifié' : 'Emplacement créé',
        description: `"${formData.nom}" a été ${editingEmplacement ? 'modifié' : 'créé'} avec succès`,
      });

      setDialogOpen(false);
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
    if (!deletingEmplacement) return;

    try {
      const res = await fetch(`/api/emplacements/${deletingEmplacement.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Emplacement supprimé',
        description: `"${deletingEmplacement.nom}" a été supprimé`,
      });

      setDeleteDialogOpen(false);
      fetchEmplacements();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const filteredEmplacements = emplacements.filter(e =>
    e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLocationLabel = (emp: Emplacement) => {
    const parts = [emp.zone, emp.allee, emp.etagere].filter(Boolean);
    return parts.length > 0 ? parts.join(' › ') : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres/references">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Emplacements</h2>
          <p className="text-muted-foreground">
            Gérez les zones de stockage et rangement
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel emplacement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Liste des emplacements
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
                <TableHead>Nom</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredEmplacements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Aucun emplacement trouvé' : 'Aucun emplacement créé'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmplacements.map((emplacement) => (
                  <TableRow key={emplacement.id}>
                    <TableCell className="font-medium">{emplacement.nom}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getLocationLabel(emplacement)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emplacement.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{emplacement._count.produits}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          onClick={() => openDeleteDialog(emplacement)}
                          disabled={emplacement._count.produits > 0}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEmplacement ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}
            </DialogTitle>
            <DialogDescription>
              {editingEmplacement
                ? 'Modifiez les informations de l\'emplacement'
                : 'Définissez une nouvelle zone de stockage'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Stock principal, Réserve 1..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Ex: A, B, C..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allee">Aile</Label>
                <Input
                  id="allee"
                  value={formData.allee}
                  onChange={(e) => setFormData({ ...formData, allee: e.target.value })}
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etagere">Étagère</Label>
                <Input
                  id="etagere"
                  value={formData.etagere}
                  onChange={(e) => setFormData({ ...formData, etagere: e.target.value })}
                  placeholder="Ex: H, M, B..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmplacement ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;emplacement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;emplacement &quot;{deletingEmplacement?.nom}&quot; ?
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
