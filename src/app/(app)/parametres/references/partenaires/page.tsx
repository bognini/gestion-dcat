'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Loader2,
  Filter,
  Building2,
  User,
  Mail,
  Phone,
  UserPlus,
  Star,
  X,
  Eye,
  MapPin,
  Globe,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Contact {
  id?: string;
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  estPrincipal: boolean;
  isNew?: boolean;
  toDelete?: boolean;
}

interface Partenaire {
  id: string;
  nom: string;
  type: string;
  secteur: string | null;
  email: string | null;
  telephone1: string | null;
  telephone2: string | null;
  ville: string | null;
  pays: string | null;
  adresse: string | null;
  siteWeb: string | null;
  notes: string | null;
  contacts?: Contact[];
}

const TYPES = [
  { value: 'client', label: 'Client' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'prestataire', label: 'Prestataire' },
];

export default function PartenairesPage() {
  const { toast } = useToast();
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPartenaire, setEditingPartenaire] = useState<Partenaire | null>(null);
  const [deletingPartenaire, setDeletingPartenaire] = useState<Partenaire | null>(null);
  const [viewingPartenaire, setViewingPartenaire] = useState<Partenaire | null>(null);
  const [viewingContacts, setViewingContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'client',
    secteur: '',
    email: '',
    telephone1: '',
    telephone2: '',
    adresse: '',
    ville: '',
    pays: 'Côte d\'Ivoire',
    siteWeb: '',
    notes: ''
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPartenaires();
  }, []);

  const fetchPartenaires = async () => {
    try {
      const res = await fetch('/api/partenaires');
      if (res.ok) {
        const data = await res.json();
        setPartenaires(data);
      }
    } catch (error) {
      console.error('Error fetching partenaires:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les partenaires' });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (partenaireId: string) => {
    try {
      const res = await fetch(`/api/contacts?partenaireId=${partenaireId}`);
      if (res.ok) {
        const data = await res.json();
        return data.map((c: { id: string; nom: string; prenom: string | null; fonction: string | null; email: string | null; telephone: string | null; estPrincipal: boolean }) => ({ 
          id: c.id,
          nom: c.nom || '',
          prenom: c.prenom || '',
          fonction: c.fonction || '',
          email: c.email || '',
          telephone: c.telephone || '',
          estPrincipal: c.estPrincipal,
          isNew: false, 
          toDelete: false 
        }));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
    return [];
  };

  const openCreateDialog = () => {
    setEditingPartenaire(null);
    setFormData({
      nom: '',
      type: 'client',
      secteur: '',
      email: '',
      telephone1: '',
      telephone2: '',
      adresse: '',
      ville: '',
      pays: 'Côte d\'Ivoire',
      siteWeb: '',
      notes: ''
    });
    setContacts([]);
    setDialogOpen(true);
  };

  const openEditDialog = async (partenaire: Partenaire) => {
    setEditingPartenaire(partenaire);
    setFormData({
      nom: partenaire.nom,
      type: partenaire.type,
      secteur: partenaire.secteur || '',
      email: partenaire.email || '',
      telephone1: partenaire.telephone1 || '',
      telephone2: '',
      adresse: '',
      ville: partenaire.ville || '',
      pays: partenaire.pays || 'Côte d\'Ivoire',
      siteWeb: '',
      notes: ''
    });
    const partenaireContacts = await fetchContacts(partenaire.id);
    setContacts(partenaireContacts);
    setDialogOpen(true);
  };

  const openDeleteDialog = (partenaire: Partenaire) => {
    setDeletingPartenaire(partenaire);
    setDeleteDialogOpen(true);
  };

  const openViewDialog = async (partenaire: Partenaire) => {
    setViewingPartenaire(partenaire);
    const partenaireContacts = await fetchContacts(partenaire.id);
    setViewingContacts(partenaireContacts);
    setViewDialogOpen(true);
  };

  const addContact = () => {
    setContacts([...contacts, {
      nom: '',
      prenom: '',
      fonction: '',
      email: '',
      telephone: '',
      estPrincipal: contacts.length === 0,
      isNew: true
    }]);
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const newContacts = [...contacts];
    if (field === 'estPrincipal' && value === true) {
      // Unset all other principals
      newContacts.forEach((c, i) => {
        if (i !== index) c.estPrincipal = false;
      });
    }
    const contact = newContacts[index];
    if (field === 'nom') contact.nom = value as string;
    else if (field === 'prenom') contact.prenom = value as string;
    else if (field === 'fonction') contact.fonction = value as string;
    else if (field === 'email') contact.email = value as string;
    else if (field === 'telephone') contact.telephone = value as string;
    else if (field === 'estPrincipal') contact.estPrincipal = value as boolean;
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    const contact = contacts[index];
    if (contact.id) {
      // Mark for deletion instead of removing
      const newContacts = [...contacts];
      newContacts[index].toDelete = true;
      setContacts(newContacts);
    } else {
      // Remove unsaved contact
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom est requis' });
      return;
    }

    setSaving(true);
    try {
      const url = editingPartenaire ? `/api/partenaires/${editingPartenaire.id}` : '/api/partenaires';
      const method = editingPartenaire ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const partenaireData = await res.json();

      if (!res.ok) {
        throw new Error(partenaireData.error || 'Erreur');
      }

      const partenaireId = partenaireData.id;

      // Handle contacts
      for (const contact of contacts) {
        if (contact.toDelete && contact.id) {
          await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
        } else if (contact.isNew && !contact.toDelete && contact.nom.trim()) {
          await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...contact, partenaireId }),
          });
        } else if (contact.id && !contact.toDelete) {
          await fetch(`/api/contacts/${contact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact),
          });
        }
      }

      toast({
        title: editingPartenaire ? 'Partenaire modifié' : 'Partenaire créé',
        description: `"${formData.nom}" a été ${editingPartenaire ? 'modifié' : 'créé'} avec succès`,
      });

      setDialogOpen(false);
      fetchPartenaires();
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
    if (!deletingPartenaire) return;

    try {
      const res = await fetch(`/api/partenaires/${deletingPartenaire.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: 'Partenaire supprimé',
        description: `"${deletingPartenaire.nom}" a été supprimé`,
      });

      setDeleteDialogOpen(false);
      fetchPartenaires();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const filteredPartenaires = partenaires.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return <Badge className="bg-blue-500">Client</Badge>;
      case 'fournisseur':
        return <Badge className="bg-emerald-500">Fournisseur</Badge>;
      case 'partenaire':
        return <Badge className="bg-purple-500">Partenaire</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const visibleContacts = contacts.filter(c => !c.toDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres/references">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Partenaires & Clients</h2>
          <p className="text-muted-foreground">
            Gérez vos contacts commerciaux
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau partenaire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des partenaires
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Localisation</TableHead>
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
              ) : filteredPartenaires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery || filterType !== 'all' ? 'Aucun partenaire trouvé' : 'Aucun partenaire créé'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartenaires.map((partenaire) => (
                  <TableRow key={partenaire.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {partenaire.type === 'client' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{partenaire.nom}</div>
                          {partenaire.secteur && (
                            <div className="text-xs text-muted-foreground">{partenaire.secteur}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(partenaire.type)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {partenaire.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {partenaire.email}
                          </div>
                        )}
                        {partenaire.telephone1 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {partenaire.telephone1}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[partenaire.ville, partenaire.pays].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(partenaire)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(partenaire)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(partenaire)}
                          title="Supprimer"
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartenaire ? 'Modifier le partenaire' : 'Nouveau partenaire'}
            </DialogTitle>
            <DialogDescription>
              {editingPartenaire
                ? 'Modifiez les informations du partenaire'
                : 'Ajoutez un nouveau client, fournisseur ou partenaire'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom / Raison sociale *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom du partenaire"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secteur">Secteur d&apos;activité</Label>
                <Input
                  id="secteur"
                  value={formData.secteur}
                  onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  placeholder="Ex: Informatique, BTP, Commerce..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail général</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone1">Téléphone 1</Label>
                <Input
                  id="telephone1"
                  value={formData.telephone1}
                  onChange={(e) => setFormData({ ...formData, telephone1: e.target.value })}
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone2">Téléphone 2</Label>
                <Input
                  id="telephone2"
                  value={formData.telephone2}
                  onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Abidjan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                />
              </div>
            </div>

            {/* Contacts Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Contacts</Label>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un contact
                </Button>
              </div>
              
              {visibleContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun contact. Cliquez sur &quot;Ajouter un contact&quot; pour en créer un.
                </p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => !contact.toDelete && (
                    <div key={contact.id || `new-${index}`} className="border rounded-lg p-4 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeContact(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid gap-3 md:grid-cols-2 pr-8">
                        <div className="space-y-1">
                          <Label className="text-xs">Nom *</Label>
                          <Input
                            value={contact.nom}
                            onChange={(e) => updateContact(index, 'nom', e.target.value)}
                            placeholder="Nom"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Prénom</Label>
                          <Input
                            value={contact.prenom}
                            onChange={(e) => updateContact(index, 'prenom', e.target.value)}
                            placeholder="Prénom"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Fonction</Label>
                          <Input
                            value={contact.fonction}
                            onChange={(e) => updateContact(index, 'fonction', e.target.value)}
                            placeholder="Ex: Directeur, Responsable IT..."
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Téléphone</Label>
                          <Input
                            value={contact.telephone}
                            onChange={(e) => updateContact(index, 'telephone', e.target.value)}
                            placeholder="+225 XX XX XX XX XX"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">E-mail</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            placeholder="email@exemple.com"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Checkbox
                          id={`principal-${index}`}
                          checked={contact.estPrincipal}
                          onCheckedChange={(checked: boolean) => updateContact(index, 'estPrincipal', checked)}
                        />
                        <Label htmlFor={`principal-${index}`} className="text-xs flex items-center gap-1 cursor-pointer">
                          <Star className="h-3 w-3" />
                          Contact principal
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes internes..."
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
              {editingPartenaire ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le partenaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletingPartenaire?.nom}&quot; ?
              Tous les contacts associés seront également supprimés.
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {viewingPartenaire?.nom}
            </DialogTitle>
            <DialogDescription>
              Informations détaillées du partenaire
            </DialogDescription>
          </DialogHeader>
          
          {viewingPartenaire && (
            <div className="space-y-6 py-4">
              {/* Type & Sector */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">
                  {TYPES.find(t => t.value === viewingPartenaire.type)?.label || viewingPartenaire.type}
                </Badge>
                {viewingPartenaire.secteur && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {viewingPartenaire.secteur}
                  </Badge>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid gap-4 md:grid-cols-2">
                {viewingPartenaire.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${viewingPartenaire.email}`} className="text-primary hover:underline">
                      {viewingPartenaire.email}
                    </a>
                  </div>
                )}
                {viewingPartenaire.telephone1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${viewingPartenaire.telephone1}`} className="hover:underline">
                      {viewingPartenaire.telephone1}
                    </a>
                  </div>
                )}
                {viewingPartenaire.telephone2 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${viewingPartenaire.telephone2}`} className="hover:underline">
                      {viewingPartenaire.telephone2}
                    </a>
                  </div>
                )}
                {viewingPartenaire.siteWeb && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={viewingPartenaire.siteWeb.startsWith('http') ? viewingPartenaire.siteWeb : `https://${viewingPartenaire.siteWeb}`} 
                       target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {viewingPartenaire.siteWeb}
                    </a>
                  </div>
                )}
              </div>

              {/* Address */}
              {(viewingPartenaire.adresse || viewingPartenaire.ville || viewingPartenaire.pays) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    {viewingPartenaire.adresse && <p>{viewingPartenaire.adresse}</p>}
                    <p>{[viewingPartenaire.ville, viewingPartenaire.pays].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Contacts */}
              {viewingContacts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contacts ({viewingContacts.length})
                  </h4>
                  <div className="grid gap-3">
                    {viewingContacts.map((contact) => (
                      <div key={contact.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {contact.prenom} {contact.nom}
                              {contact.estPrincipal && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Principal
                                </Badge>
                              )}
                            </div>
                            {contact.fonction && (
                              <p className="text-sm text-muted-foreground">{contact.fonction}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </a>
                          )}
                          {contact.telephone && (
                            <a href={`tel:${contact.telephone}`} className="flex items-center gap-1 hover:underline">
                              <Phone className="h-3 w-3" />
                              {contact.telephone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingPartenaire.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingPartenaire.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (viewingPartenaire) openEditDialog(viewingPartenaire);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
