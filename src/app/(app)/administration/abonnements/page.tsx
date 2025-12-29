'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Repeat,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Bell,
  Upload,
  FileText,
  X,
  CalendarPlus
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
  DialogDescription,
  DialogFooter,
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

interface Echeance {
  id: string;
  dateEcheance: string;
  montant: number;
  statut: string;
  datePaiement: string | null;
  documentPath: string | null;
  documentName: string | null;
}

interface Abonnement {
  id: string;
  nom: string;
  type: string;
  fournisseur: string;
  montant: number;
  periodicite: string;
  dateDebut: string;
  dateProchainePaiement: string | null;
  dateExpiration: string | null;
  statut: string;
  reference: string | null;
  notes: string | null;
  alerteJours: number;
  echeances: Echeance[];
  createdAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  actif: { label: 'Actif', color: 'bg-green-500', icon: CheckCircle },
  suspendu: { label: 'Suspendu', color: 'bg-orange-500', icon: Clock },
  expire: { label: 'Expiré', color: 'bg-gray-500', icon: XCircle },
  resilie: { label: 'Résilié', color: 'bg-red-500', icon: AlertTriangle },
};

const TYPES = [
  { value: 'internet', label: 'Internet' },
  { value: 'hosting', label: 'Hébergement Web' },
  { value: 'electricity', label: 'Électricité' },
  { value: 'water', label: 'Eau' },
  { value: 'software', label: 'Logiciel' },
  { value: 'ai', label: 'Intelligence Artificielle' },
  { value: 'antivirus', label: 'Antivirus / Sécurité' },
  { value: 'telecom', label: 'Télécom' },
  { value: 'other', label: 'Autre' },
];

const PERIODICITES = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'annuel', label: 'Annuel' },
];

export default function AbonnementsPage() {
  const { toast } = useToast();
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '',
    type: 'internet',
    fournisseur: '',
    montant: '',
    periodicite: 'mensuel',
    dateDebut: '',
    dateExpiration: '',
    reference: '',
    notes: '',
    alerteJours: '7',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<Abonnement | null>(null);

  // Échéance dialog
  const [echeanceDialogOpen, setEcheanceDialogOpen] = useState(false);
  const [selectedAbonnementForEcheance, setSelectedAbonnementForEcheance] = useState<Abonnement | null>(null);
  const [echeanceForm, setEcheanceForm] = useState({
    periode: '',
    datePaiement: new Date().toISOString().split('T')[0],
    isPaid: true,
  });
  const [savingEcheance, setSavingEcheance] = useState(false);

  // Document upload for écheances
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleEcheanceDocUpload = async (abonnementId: string, echeanceId: string, file: File) => {
    setUploadingDoc(echeanceId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/abonnements/${abonnementId}/echeances/${echeanceId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Justificatif ajouté' });
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleEcheanceDocDelete = async (abonnementId: string, echeanceId: string) => {
    setUploadingDoc(echeanceId);
    try {
      const res = await fetch(`/api/abonnements/${abonnementId}/echeances/${echeanceId}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Justificatif supprimé' });
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('statut', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const res = await fetch(`/api/abonnements?${params}`);
      if (res.ok) setAbonnements(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nom: '',
      type: 'internet',
      fournisseur: '',
      montant: '',
      periodicite: 'mensuel',
      dateDebut: '',
      dateExpiration: '',
      reference: '',
      notes: '',
      alerteJours: '7',
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (abonnement: Abonnement) => {
    setForm({
      nom: abonnement.nom,
      type: abonnement.type,
      fournisseur: abonnement.fournisseur,
      montant: abonnement.montant.toString(),
      periodicite: abonnement.periodicite,
      dateDebut: abonnement.dateDebut.split('T')[0],
      dateExpiration: abonnement.dateExpiration?.split('T')[0] || '',
      reference: abonnement.reference || '',
      notes: abonnement.notes || '',
      alerteJours: abonnement.alerteJours.toString(),
    });
    setEditingId(abonnement.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.fournisseur || !form.montant || !form.dateDebut) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/abonnements/${editingId}` : '/api/abonnements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          montant: parseFloat(form.montant),
          alerteJours: parseInt(form.alerteJours),
        }),
      });

      if (res.ok) {
        toast({ title: editingId ? 'Abonnement modifié' : 'Abonnement créé' });
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
      const res = await fetch(`/api/abonnements/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Abonnement supprimé' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleOpenEcheanceDialog = (abonnement: Abonnement) => {
    setSelectedAbonnementForEcheance(abonnement);
    // Calculate current period based on periodicite
    const today = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let periode = '';
    
    if (abonnement.periodicite === 'annuel') {
      periode = `Année ${today.getFullYear()}`;
    } else {
      periode = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    }
    
    setEcheanceForm({
      periode,
      datePaiement: today.toISOString().split('T')[0],
      isPaid: true,
    });
    setEcheanceDialogOpen(true);
  };

  const handleSaveEcheance = async () => {
    if (!selectedAbonnementForEcheance) return;
    
    setSavingEcheance(true);
    try {
      // Calculate next payment date
      const currentDate = new Date(echeanceForm.datePaiement);
      let nextPaymentDate = new Date(currentDate);
      if (selectedAbonnementForEcheance.periodicite === 'annuel') {
        nextPaymentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        nextPaymentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Create a depense entry to record this payment
      const depenseRes = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `${selectedAbonnementForEcheance.nom} - ${echeanceForm.periode}${echeanceForm.isPaid ? ' (Payé)' : ' (Non payé)'}`,
          montant: selectedAbonnementForEcheance.montant,
          categorie: selectedAbonnementForEcheance.type || 'abonnement',
          date: echeanceForm.datePaiement,
        }),
      });

      // Update abonnement with next payment date
      const res = await fetch(`/api/abonnements/${selectedAbonnementForEcheance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateProchainePaiement: nextPaymentDate.toISOString(),
        }),
      });

      if (res.ok && depenseRes.ok) {
        toast({ 
          title: echeanceForm.isPaid ? 'Paiement enregistré' : 'Échéance enregistrée',
          description: `${selectedAbonnementForEcheance.nom} - ${echeanceForm.periode}. Prochaine échéance: ${nextPaymentDate.toLocaleDateString('fr-FR')}` 
        });
        setEcheanceDialogOpen(false);
        setSelectedAbonnementForEcheance(null);
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer l\'échéance' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer l\'échéance' });
    } finally {
      setSavingEcheance(false);
    }
  };

  const filteredAbonnements = abonnements.filter(a =>
    a.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.fournisseur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: abonnements.length,
    actifs: abonnements.filter(a => a.statut === 'actif').length,
    montantMensuel: abonnements
      .filter(a => a.statut === 'actif' && a.periodicite === 'mensuel')
      .reduce((sum, a) => sum + a.montant, 0),
    aVenir: abonnements.filter(a => {
      if (!a.dateProchainePaiement) return false;
      const nextPayment = new Date(a.dateProchainePaiement);
      const today = new Date();
      const inWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return nextPayment <= inWeek && nextPayment >= today;
    }).length,
  };

  // Check if deadline is close
  const isDeadlineClose = (dateStr: string | null, alertDays: number) => {
    if (!dateStr) return false;
    const deadline = new Date(dateStr);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= alertDays && daysUntil >= 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="h-6 w-6" />
            Abonnements
          </h2>
          <p className="text-muted-foreground">
            Gérez vos abonnements et suivez les échéances
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/administration/charges-depenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel abonnement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nom de l'abonnement *</Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Internet Orange"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fournisseur *</Label>
                  <Input
                    value={form.fournisseur}
                    onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
                    placeholder="Ex: Orange CI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Périodicité</Label>
                  <Select value={form.periodicite} onValueChange={(v) => setForm({ ...form, periodicite: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODICITES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <MoneyInput
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date d'expiration</Label>
                  <Input
                    type="date"
                    value={form.dateExpiration}
                    onChange={(e) => setForm({ ...form, dateExpiration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Référence / N° compte</Label>
                  <Input
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Numéro de compte"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alerte (jours avant)</Label>
                  <Input
                    type="number"
                    value={form.alerteJours}
                    onChange={(e) => setForm({ ...form, alerteJours: e.target.value })}
                    placeholder="7"
                  />
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
                {editingId ? 'Enregistrer' : 'Créer l\'abonnement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total abonnements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coût mensuel</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.montantMensuel)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Échéances proches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats.aVenir}</p>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
            <SelectItem value="resilie">Résilié</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Abonnement</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Prochaine échéance</TableHead>
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
            ) : filteredAbonnements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun abonnement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredAbonnements.map((abonnement) => {
                const statutConfig = STATUTS[abonnement.statut] || STATUTS.actif;
                const StatutIcon = statutConfig.icon;
                const typeLabel = TYPES.find(t => t.value === abonnement.type)?.label || abonnement.type;
                const deadlineClose = isDeadlineClose(abonnement.dateProchainePaiement, abonnement.alerteJours);
                
                return (
                  <TableRow key={abonnement.id} className={deadlineClose ? 'bg-orange-500/10 dark:bg-orange-500/20' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {deadlineClose && <Bell className="h-4 w-4 text-orange-500 animate-pulse" />}
                        <Link href={`/administration/abonnements/${abonnement.id}`} className="font-medium hover:underline text-primary">
                          {abonnement.nom}
                        </Link>
                      </div>
                      {abonnement.reference && (
                        <p className="text-xs text-muted-foreground">Réf: {abonnement.reference}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {abonnement.fournisseur}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(abonnement.montant)}
                      <span className="text-xs text-muted-foreground ml-1">
                        /{abonnement.periodicite === 'annuel' ? 'an' : 'mois'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {abonnement.dateProchainePaiement ? (
                        <div className={`flex items-center gap-1 text-sm ${deadlineClose ? 'text-orange-600 font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(abonnement.dateProchainePaiement)}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statutConfig.color} text-white gap-1`}>
                        <StatutIcon className="h-3 w-3" />
                        {statutConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          title="Générer échéance"
                          onClick={() => handleOpenEcheanceDialog(abonnement)}
                        >
                          <CalendarPlus className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(abonnement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => setDeleteDialog(abonnement)}
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
            <AlertDialogTitle>Supprimer l'abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement l'abonnement{' '}
              <strong>{deleteDialog?.nom}</strong> et toutes ses échéances.
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

      {/* Échéance Dialog */}
      <Dialog open={echeanceDialogOpen} onOpenChange={(open) => { setEcheanceDialogOpen(open); if (!open) setSelectedAbonnementForEcheance(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
              Enregistrer un paiement
            </DialogTitle>
            <DialogDescription>
              {selectedAbonnementForEcheance?.nom} - {formatCurrency(selectedAbonnementForEcheance?.montant || 0)}/{selectedAbonnementForEcheance?.periodicite === 'annuel' ? 'an' : 'mois'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Abonnement:</span>
                <span className="font-medium">{selectedAbonnementForEcheance?.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fournisseur:</span>
                <span>{selectedAbonnementForEcheance?.fournisseur}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Périodicité:</span>
                <span>{selectedAbonnementForEcheance?.periodicite === 'annuel' ? 'Annuel' : 'Mensuel'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant:</span>
                <span className="font-medium text-primary">{formatCurrency(selectedAbonnementForEcheance?.montant || 0)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Période concernée</Label>
              <Input
                value={echeanceForm.periode}
                onChange={(e) => setEcheanceForm({ ...echeanceForm, periode: e.target.value })}
                placeholder="Ex: Janvier 2025, Année 2025..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input
                type="date"
                value={echeanceForm.datePaiement}
                onChange={(e) => setEcheanceForm({ ...echeanceForm, datePaiement: e.target.value })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Statut du paiement</p>
                <p className="text-sm text-muted-foreground">Cet abonnement a-t-il été payé ?</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={echeanceForm.isPaid ? 'default' : 'outline'}
                  className={echeanceForm.isPaid ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setEcheanceForm({ ...echeanceForm, isPaid: true })}
                >
                  Payé
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!echeanceForm.isPaid ? 'default' : 'outline'}
                  className={!echeanceForm.isPaid ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  onClick={() => setEcheanceForm({ ...echeanceForm, isPaid: false })}
                >
                  Non payé
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEcheanceDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEcheance} disabled={savingEcheance}>
              {savingEcheance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
