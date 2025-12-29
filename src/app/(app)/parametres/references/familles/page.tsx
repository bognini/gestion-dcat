'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderTree, 
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
  description: string | null;
  categorieId: string;
  categorie: Categorie;
  _count: { produits: number };
}

export default function FamillesPage() {
  const { toast } = useToast();
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFamille, setEditingFamille] = useState<Famille | null>(null);
  const [deletingFamille, setDeletingFamille] = useState<Famille | null>(null);
  const [formData, setFormData] = useState({ nom: '', description: '', categorieId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [famillesRes, categoriesRes] = await Promise.all([
        fetch('/api/familles'),
        fetch('/api/categories'),
      ]);
      if (famillesRes.ok) setFamilles(await famillesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingFamille(null);
    setFormData({ nom: '', description: '', categorieId: categories[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEditDialog = (famille: Famille) => {
    setEditingFamille(famille);
    setFormData({
      nom: famille.nom,
      description: famille.description || '',
      categorieId: famille.categorieId,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (famille: Famille) => {
    setDeletingFamille(famille);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Le nom est requis' });
      return;
    }
    if (!formData.categorieId) {
      toast({ variant: 'destructive', title: 'La catégorie est requise' });
      return;
    }

    setSaving(true);
    try {
      const url = editingFamille ? `/api/familles/${editingFamille.id}` : '/api/familles';
      const method = editingFamille ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: editingFamille ? 'Famille modifiée' : 'Famille créée' });
        setDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast({ variant: 'destructive', title: error.error || 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFamille) return;

    try {
      const res = await fetch(`/api/familles/${deletingFamille.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Famille supprimée' });
        fetchData();
      } else {
        const error = await res.json();
        toast({ variant: 'destructive', title: error.error || 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingFamille(null);
    }
  };

  const filteredFamilles = familles.filter(f => {
    const matchesSearch = f.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.categorie.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategorie = filterCategorie === 'all' || f.categorieId === filterCategorie;
    return matchesSearch && matchesCategorie;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/parametres/references">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderTree className="h-6 w-6" />
              Familles de produits
            </h2>
            <p className="text-muted-foreground">
              Gérez les familles de produits par catégorie
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle famille
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une famille..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
          <SelectTrigger className="w-full sm:w-64">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total familles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{familles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produits associés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{familles.reduce((sum, f) => sum + f._count.produits, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
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
            ) : filteredFamilles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery || filterCategorie !== 'all' ? 'Aucune famille trouvée' : 'Aucune famille créée'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFamilles.map((famille) => (
                <TableRow key={famille.id}>
                  <TableCell className="font-medium">{famille.nom}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{famille.categorie.nom}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {famille.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{famille._count.produits}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(famille)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(famille)}
                        disabled={famille._count.produits > 0}
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFamille ? 'Modifier la famille' : 'Nouvelle famille'}</DialogTitle>
            <DialogDescription>
              {editingFamille ? 'Modifiez les informations de la famille' : 'Ajoutez une nouvelle famille de produits'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categorieId">Catégorie *</Label>
              <Select
                value={formData.categorieId}
                onValueChange={(v) => setFormData({ ...formData, categorieId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la famille *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Microphones Dynamiques"
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFamille ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la famille ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la famille &quot;{deletingFamille?.nom}&quot; ?
              Cette action est irréversible.
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
