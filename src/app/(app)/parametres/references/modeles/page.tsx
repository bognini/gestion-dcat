'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tags, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Loader2,
  Filter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Categorie {
  id: string;
  nom: string;
}

interface Famille {
  id: string;
  nom: string;
  categorieId: string;
  categorie: Categorie;
}

interface Marque {
  id: string;
  nom: string;
}

interface Modele {
  id: string;
  nom: string;
  description: string | null;
  marque: Marque;
  famille: Famille;
  _count: { produits: number };
}

export default function ModelesPage() {
  const { toast } = useToast();
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarque, setFilterMarque] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModele, setEditingModele] = useState<Modele | null>(null);
  const [deletingModele, setDeletingModele] = useState<Modele | null>(null);
  const [formData, setFormData] = useState({ nom: '', description: '', marqueId: '', familleId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelesRes, marquesRes, famillesRes] = await Promise.all([
        fetch('/api/modeles'),
        fetch('/api/marques'),
        fetch('/api/familles'),
      ]);
      
      if (modelesRes.ok) setModeles(await modelesRes.json());
      if (marquesRes.ok) setMarques(await marquesRes.json());
      if (famillesRes.ok) setFamilles(await famillesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingModele(null);
    setFormData({ nom: '', description: '', marqueId: '', familleId: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (modele: Modele) => {
    setEditingModele(modele);
    setFormData({ 
      nom: modele.nom, 
      description: modele.description || '',
      marqueId: modele.marque.id,
      familleId: modele.famille.id
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (modele: Modele) => {
    setDeletingModele(modele);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }
    if (!formData.marqueId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La marque est requise' });
      return;
    }
    if (!formData.familleId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La famille est requise' });
      return;
    }

    setSaving(true);
    try {
      const url = editingModele ? `/api/modeles/${editingModele.id}` : '/api/modeles';
      const method = editingModele ? 'PUT' : 'POST';

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
        title: editingModele ? 'Modèle modifié' : 'Modèle créé',
        description: `"${formData.nom}" a été ${editingModele ? 'modifié' : 'créé'} avec succès`,
      });

      setDialogOpen(false);
      fetchData();
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
    if (!deletingModele) return;

    try {
      const res = await fetch(`/api/modeles/${deletingModele.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Modèle supprimé',
        description: `"${deletingModele.nom}" a été supprimé`,
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

  const filteredModeles = modeles.filter(m => {
    const matchesSearch = m.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.marque.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMarque = filterMarque === 'all' || m.marque.id === filterMarque;
    return matchesSearch && matchesMarque;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres/references">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Modèles</h2>
          <p className="text-muted-foreground">
            Gérez les modèles par marque
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={marques.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {marques.length === 0 && !loading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-orange-800">
              Vous devez d&apos;abord créer des marques avant de pouvoir ajouter des modèles.{' '}
              <Link href="/parametres/references/marques" className="underline font-medium">
                Créer une marque
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Liste des modèles
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterMarque} onValueChange={setFilterMarque}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marques</SelectItem>
                  {marques.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
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
                <TableHead>Nom</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Famille</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-center">Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredModeles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery || filterMarque !== 'all' ? 'Aucun modèle trouvé' : 'Aucun modèle créé'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredModeles.map((modele) => (
                  <TableRow key={modele.id}>
                    <TableCell className="font-medium">{modele.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{modele.marque.nom}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{modele.famille.nom}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{modele.famille.categorie.nom}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{modele._count.produits}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(modele)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(modele)}
                          disabled={modele._count.produits > 0}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModele ? 'Modifier le modèle' : 'Nouveau modèle'}
            </DialogTitle>
            <DialogDescription>
              {editingModele
                ? 'Modifiez les informations du modèle'
                : 'Ajoutez un nouveau modèle de produit'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="familleId">Famille (Catégorie) *</Label>
              <Select 
                value={formData.familleId} 
                onValueChange={(v) => setFormData({ ...formData, familleId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une famille" />
                </SelectTrigger>
                <SelectContent>
                  {familles.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nom} ({f.categorie.nom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marqueId">Marque *</Label>
              <Select 
                value={formData.marqueId} 
                onValueChange={(v) => setFormData({ ...formData, marqueId: v })}
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
              <Label htmlFor="nom">Nom du modèle *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: SM7B, ProBook 450 G8..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModele ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le modèle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le modèle &quot;{deletingModele?.nom}&quot; ?
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
