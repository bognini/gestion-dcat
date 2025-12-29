'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Briefcase,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Loader2,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Projet {
  id: string;
  nom: string;
}

interface User {
  id: string;
  nom: string;
  prenom: string | null;
  role: string;
}

interface Participant {
  id: string;
  utilisateurId: string;
  utilisateur: User;
  role: string | null;
  perDiem: number | null;
}

interface FicheMission {
  id: string;
  reference: string;
  titre: string;
  description: string | null;
  projet: Projet | null;
  destination: string;
  dateDepart: string;
  dateRetour: string | null;
  statut: string;
  budget: number | null;
  depensesReelles: number | null;
  objectifs: string | null;
  notes: string | null;
  participants: Participant[];
  createdAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planifiee: { label: 'Planifiée', color: 'bg-blue-500', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-orange-500', icon: PlayCircle },
  terminee: { label: 'Terminée', color: 'bg-green-500', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-gray-500', icon: XCircle },
};

export default function FichesMissionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [missions, setMissions] = useState<FicheMission[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    projetId: '',
    destination: '',
    dateDepart: '',
    dateRetour: '',
    budget: '',
    objectifs: '',
    notes: '',
    participantIds: [] as string[],
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<FicheMission | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [missionsRes, projetsRes, usersRes] = await Promise.all([
        fetch(`/api/fiches-mission${statusFilter !== 'all' ? `?statut=${statusFilter}` : ''}`),
        fetch('/api/projets'),
        fetch('/api/utilisateurs'),
      ]);
      
      if (missionsRes.ok) setMissions(await missionsRes.json());
      if (projetsRes.ok) setProjets(await projetsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titre: '',
      description: '',
      projetId: '',
      destination: '',
      dateDepart: '',
      dateRetour: '',
      budget: '',
      objectifs: '',
      notes: '',
      participantIds: [],
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  useEffect(() => {
    const shouldOpen = searchParams.get('new') === '1';
    if (shouldOpen) {
      openCreateDialog();
      router.replace('/technique/fiches-mission');
    }
  }, [searchParams, router]);

  const openEditDialog = (mission: FicheMission) => {
    setForm({
      titre: mission.titre,
      description: mission.description || '',
      projetId: mission.projet?.id || '',
      destination: mission.destination,
      dateDepart: mission.dateDepart.split('T')[0],
      dateRetour: mission.dateRetour?.split('T')[0] || '',
      budget: mission.budget?.toString() || '',
      objectifs: mission.objectifs || '',
      notes: mission.notes || '',
      participantIds: mission.participants.map(p => p.utilisateurId),
    });
    setEditingId(mission.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titre || !form.destination || !form.dateDepart) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : null,
        participants: form.participantIds.map(id => ({ employeId: id })),
      };

      const url = editingId ? `/api/fiches-mission/${editingId}` : '/api/fiches-mission';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingId ? 'Mission modifiée' : 'Mission créée' });
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      const res = await fetch(`/api/fiches-mission/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Mission supprimée' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleStatusChange = async (mission: FicheMission, newStatut: string) => {
    try {
      const res = await fetch(`/api/fiches-mission/${mission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mission, statut: newStatut }),
      });

      if (res.ok) {
        toast({ title: 'Statut mis à jour' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const filteredMissions = missions.filter(m =>
    m.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: missions.length,
    planifiees: missions.filter(m => m.statut === 'planifiee').length,
    enCours: missions.filter(m => m.statut === 'en_cours').length,
    terminees: missions.filter(m => m.statut === 'terminee').length,
  };

  const toggleParticipant = (employeId: string) => {
    setForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(employeId)
        ? prev.participantIds.filter(id => id !== employeId)
        : [...prev.participantIds, employeId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/technique">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Fiches de Mission
          </h2>
          <p className="text-muted-foreground">
            Gérez les missions et déplacements de l&apos;équipe
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier la mission' : 'Nouvelle mission'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Titre *</Label>
                  <Input
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="Titre de la mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination *</Label>
                  <Input
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="Ville / Lieu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Projet associé</Label>
                  <Select value={form.projetId || 'none'} onValueChange={(v) => setForm({ ...form, projetId: v === 'none' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {projets.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de départ *</Label>
                  <Input
                    type="date"
                    value={form.dateDepart}
                    onChange={(e) => setForm({ ...form, dateDepart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de retour</Label>
                  <Input
                    type="date"
                    value={form.dateRetour}
                    onChange={(e) => setForm({ ...form, dateRetour: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget prévisionnel (FCFA)</Label>
                  <MoneyInput
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Objectifs</Label>
                <Textarea
                  value={form.objectifs}
                  onChange={(e) => setForm({ ...form, objectifs: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Participants ({form.participantIds.length})</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                  {users.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        form.participantIds.includes(user.id)
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.participantIds.includes(user.id)}
                        onChange={() => toggleParticipant(user.id)}
                        className="sr-only"
                      />
                      <span className="text-sm">
                        {[user.prenom, user.nom].filter(Boolean).join(' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Enregistrer' : 'Créer la mission'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Planifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.planifiees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-orange-500" />
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats.enCours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="planifiee">Planifiée</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="terminee">Terminée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence / Budget</TableHead>
              <TableHead>Mission</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredMissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune mission trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredMissions.map((mission) => {
                const statutConfig = STATUTS[mission.statut] || STATUTS.planifiee;
                const StatutIcon = statutConfig.icon;
                
                return (
                  <TableRow key={mission.id}>
                    <TableCell>
                      <Link 
                        href={`/technique/fiches-mission/${mission.id}`}
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        {mission.reference}
                      </Link>
                      {mission.budget && (
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(mission.budget)}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{mission.titre}</p>
                      {mission.projet && (
                        <p className="text-xs text-muted-foreground">{mission.projet.nom}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {mission.destination}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(mission.dateDepart)}
                        </div>
                        {mission.dateRetour && (
                          <div className="text-xs text-muted-foreground mt-1">
                            → {formatDate(mission.dateRetour)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {mission.participants.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mission.statut}
                        onValueChange={(v) => handleStatusChange(mission, v)}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <Badge className={`${statutConfig.color} text-white gap-1`}>
                            <StatutIcon className="h-3 w-3" />
                            {statutConfig.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUTS).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(mission)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => setDeleteDialog(mission)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la mission ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement la mission{' '}
              <strong>{deleteDialog?.reference}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
