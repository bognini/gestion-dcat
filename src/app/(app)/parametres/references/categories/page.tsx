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

interface Categorie {
  id: string;
  nom: string;
  description: string | null;
  _count: { produits: number };
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null);
  const [deletingCategorie, setDeletingCategorie] = useState<Categorie | null>(null);
  const [formData, setFormData] = useState({ nom: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les catégories' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCategorie(null);
    setFormData({ nom: '', description: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (categorie: Categorie) => {
    setEditingCategorie(categorie);
    setFormData({ nom: categorie.nom, description: categorie.description || '' });
    setDialogOpen(true);
  };

  const openDeleteDialog = (categorie: Categorie) => {
    setDeletingCategorie(categorie);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const url = editingCategorie ? `/api/categories/${editingCategorie.id}` : '/api/categories';
      const method = editingCategorie ? 'PUT' : 'POST';

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
        title: editingCategorie ? 'Catégorie modifiée' : 'Catégorie créée',
        description: `"${formData.nom}" a été ${editingCategorie ? 'modifiée' : 'créée'} avec succès`,
      });

      setDialogOpen(false);
      fetchCategories();
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
    if (!deletingCategorie) return;

    try {
      const res = await fetch(`/api/categories/${deletingCategorie.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Catégorie supprimée',
        description: `"${deletingCategorie.nom}" a été supprimée`,
      });

      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const filteredCategories = categories.filter(c =>
    c.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres/references">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Catégories</h2>
          <p className="text-muted-foreground">
            Gérez les catégories de produits
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Liste des catégories
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
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Aucune catégorie trouvée' : 'Aucune catégorie créée'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((categorie) => (
                  <TableRow key={categorie.id}>
                    <TableCell className="font-medium">{categorie.nom}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {categorie.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{categorie._count.produits}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(categorie)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(categorie)}
                          disabled={categorie._count.produits > 0}
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
              {editingCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategorie
                ? 'Modifiez les informations de la catégorie'
                : 'Créez une nouvelle catégorie de produits'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Informatique, Réseau, Sécurité..."
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
              {editingCategorie ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie &quot;{deletingCategorie?.nom}&quot; ?
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
