'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  User
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

interface Fournisseur {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  _count: { mouvements: number };
}

export default function FournisseursPage() {
  const { toast } = useToast();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [deletingFournisseur, setDeletingFournisseur] = useState<Fournisseur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    email: '',
    telephone: '',
    adresse: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    try {
      const res = await fetch('/api/fournisseurs');
      if (res.ok) {
        const data = await res.json();
        setFournisseurs(data);
      }
    } catch (error) {
      console.error('Error fetching fournisseurs:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les fournisseurs' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingFournisseur(null);
    setFormData({
      nom: '',
      contact: '',
      email: '',
      telephone: '',
      adresse: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      contact: fournisseur.contact || '',
      email: fournisseur.email || '',
      telephone: fournisseur.telephone || '',
      adresse: fournisseur.adresse || ''
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (fournisseur: Fournisseur) => {
    setDeletingFournisseur(fournisseur);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const url = editingFournisseur ? `/api/fournisseurs/${editingFournisseur.id}` : '/api/fournisseurs';
      const method = editingFournisseur ? 'PUT' : 'POST';

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
        title: editingFournisseur ? 'Fournisseur modifié' : 'Fournisseur créé',
        description: `"${formData.nom}" a été ${editingFournisseur ? 'modifié' : 'créé'} avec succès`,
      });

      setDialogOpen(false);
      fetchFournisseurs();
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
    if (!deletingFournisseur) return;

    try {
      const res = await fetch(`/api/fournisseurs/${deletingFournisseur.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Fournisseur supprimé',
        description: `"${deletingFournisseur.nom}" a été supprimé`,
      });

      setDeleteDialogOpen(false);
      fetchFournisseurs();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const filteredFournisseurs = fournisseurs.filter(f =>
    f.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.contact?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-2xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos fournisseurs pour les entrées de stock
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Liste des fournisseurs
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
                <TableHead>Contact</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead className="text-center">Mouvements</TableHead>
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
              ) : filteredFournisseurs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur créé'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFournisseurs.map((fournisseur) => (
                  <TableRow key={fournisseur.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{fournisseur.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fournisseur.contact ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {fournisseur.contact}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {fournisseur.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {fournisseur.email}
                          </div>
                        )}
                        {fournisseur.telephone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {fournisseur.telephone}
                          </div>
                        )}
                        {fournisseur.adresse && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {fournisseur.adresse}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{fournisseur._count.mouvements}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(fournisseur)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(fournisseur)}
                          disabled={fournisseur._count.mouvements > 0}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </DialogTitle>
            <DialogDescription>
              {editingFournisseur
                ? 'Modifiez les informations du fournisseur'
                : 'Ajoutez un nouveau fournisseur'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du fournisseur *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: HP, Dell, Hikvision..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Personne de contact</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Nom du contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@fournisseur.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+225 XX XX XX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète..."
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
              {editingFournisseur ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletingFournisseur?.nom}&quot; ?
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
