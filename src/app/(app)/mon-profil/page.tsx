'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  CalendarCheck, 
  Car, 
  Plus, 
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Pencil,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Absence {
  id: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  motif: string | null;
  statut: string;
  createdAt: string;
}

interface Partenaire {
  id: string;
  nom: string;
}

interface LigneTransport {
  id: string;
  depart: string;
  arrivee: string;
  typeClient: string;
  partenaireId: string | null;
  partenaire: Partenaire | null;
  particulierNom: string | null;
  cout: number;
}

interface FicheTransport {
  id: string;
  date: string;
  totalCout: number;
  statut: string;
  lignes: LigneTransport[];
}

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  departement: string | null;
  email: string | null;
  telephone: string | null;
  dateEmbauche: string;
  absences: Absence[];
  fichesTransport: FicheTransport[];
}

interface UserProfile {
  id: string;
  username: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  role: string;
}

const TYPES_ABSENCE: Record<string, { label: string; color: string }> = {
  conge_paye: { label: 'Congé payé', color: 'bg-blue-500' },
  conge_sans_solde: { label: 'Congé sans solde', color: 'bg-gray-500' },
  permission: { label: 'Permission', color: 'bg-indigo-500' },
  maladie: { label: 'Maladie', color: 'bg-orange-500' },
  maternite: { label: 'Maternité', color: 'bg-pink-500' },
};

const STATUTS_ABSENCE: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  en_attente: { label: 'En attente', icon: Clock, color: 'text-yellow-600' },
  approuve: { label: 'Approuvé', icon: CheckCircle, color: 'text-green-600' },
  refuse: { label: 'Refusé', icon: XCircle, color: 'text-red-600' },
};

interface TransportLigneForm {
  depart: string;
  arrivee: string;
  typeClient: string;
  partenaireId: string;
  particulierNom: string;
  cout: string;
}

export default function MonProfilPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ user: UserProfile; employe: Employe | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);

  // Absence form
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [submittingAbsence, setSubmittingAbsence] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
  const [absenceForm, setAbsenceForm] = useState({
    type: 'conge_paye',
    dateDebut: '',
    dateFin: '',
    motif: '',
  });

  // Transport form
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  const [submittingTransport, setSubmittingTransport] = useState(false);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [transportDate, setTransportDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportLignes, setTransportLignes] = useState<TransportLigneForm[]>([
    { depart: '', arrivee: '', typeClient: 'client', partenaireId: '', particulierNom: '', cout: '' },
  ]);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'absence' | 'transport'; id: string } | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchPartenaires();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/mon-profil');
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartenaires = async () => {
    try {
      const res = await fetch('/api/partenaires');
      if (res.ok) {
        setPartenaires(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmitAbsence = async () => {
    if (!profile?.employe) {
      toast({ variant: 'destructive', title: 'Vous devez être lié à un employé' });
      return;
    }
    if (!absenceForm.dateDebut || !absenceForm.dateFin) {
      toast({ variant: 'destructive', title: 'Dates requises' });
      return;
    }

    setSubmittingAbsence(true);
    try {
      const url = editingAbsenceId ? `/api/absences/${editingAbsenceId}` : '/api/absences';
      const method = editingAbsenceId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeId: profile.employe.id,
          ...absenceForm,
        }),
      });

      if (res.ok) {
        toast({ title: editingAbsenceId ? 'Demande modifiée' : 'Demande envoyée' });
        setAbsenceDialogOpen(false);
        setEditingAbsenceId(null);
        setAbsenceForm({ type: 'conge_paye', dateDebut: '', dateFin: '', motif: '' });
        fetchProfile();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSubmittingAbsence(false);
    }
  };

  const startEditAbsence = (absence: Absence) => {
    setEditingAbsenceId(absence.id);
    setAbsenceForm({
      type: absence.type,
      dateDebut: absence.dateDebut.split('T')[0],
      dateFin: absence.dateFin.split('T')[0],
      motif: absence.motif || '',
    });
    setAbsenceDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    const url = deleteDialog.type === 'absence' 
      ? `/api/absences/${deleteDialog.id}` 
      : `/api/fiches-transport/${deleteDialog.id}`;
    
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Supprimé avec succès' });
        fetchProfile();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    } finally {
      setDeleteDialog(null);
    }
  };

  const addTransportLigne = () => {
    setTransportLignes([...transportLignes, { depart: '', arrivee: '', typeClient: 'client', partenaireId: '', particulierNom: '', cout: '' }]);
  };

  const removeTransportLigne = (index: number) => {
    if (transportLignes.length > 1) {
      setTransportLignes(transportLignes.filter((_, i) => i !== index));
    }
  };

  const updateTransportLigne = (index: number, field: string, value: string) => {
    const updated = [...transportLignes];
    updated[index] = { ...updated[index], [field]: value };
    setTransportLignes(updated);
  };

  const handleSubmitTransport = async () => {
    if (!profile?.employe) {
      toast({ variant: 'destructive', title: 'Vous devez être lié à un employé' });
      return;
    }

    const validLignes = transportLignes.filter(l => l.depart && l.arrivee && l.cout);
    if (validLignes.length === 0) {
      toast({ variant: 'destructive', title: 'Au moins une ligne complète requise' });
      return;
    }

    // Validate client selection
    for (const ligne of validLignes) {
      if (ligne.typeClient === 'client' && !ligne.partenaireId) {
        toast({ variant: 'destructive', title: 'Veuillez sélectionner un client pour chaque trajet de type "Client"' });
        return;
      }
      if (ligne.typeClient === 'particulier' && !ligne.particulierNom) {
        toast({ variant: 'destructive', title: 'Veuillez saisir le nom du particulier pour chaque trajet de type "Particulier"' });
        return;
      }
    }

    setSubmittingTransport(true);
    try {
      const url = editingTransportId ? `/api/fiches-transport/${editingTransportId}` : '/api/fiches-transport';
      const method = editingTransportId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeId: profile.employe.id,
          date: transportDate,
          lignes: validLignes.map(l => ({
            depart: l.depart,
            arrivee: l.arrivee,
            typeClient: l.typeClient,
            partenaireId: l.typeClient === 'client' ? l.partenaireId : null,
            particulierNom: l.typeClient === 'particulier' ? l.particulierNom : null,
            cout: parseFloat(l.cout),
          })),
        }),
      });

      if (res.ok) {
        toast({ title: editingTransportId ? 'Fiche modifiée' : 'Fiche de transport envoyée' });
        setTransportDialogOpen(false);
        setEditingTransportId(null);
        resetTransportForm();
        fetchProfile();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSubmittingTransport(false);
    }
  };

  const resetTransportForm = () => {
    setTransportLignes([{ depart: '', arrivee: '', typeClient: 'client', partenaireId: '', particulierNom: '', cout: '' }]);
    setTransportDate(new Date().toISOString().split('T')[0]);
  };

  const startEditTransport = (fiche: FicheTransport) => {
    setEditingTransportId(fiche.id);
    setTransportDate(fiche.date.split('T')[0]);
    setTransportLignes(fiche.lignes.map(l => ({
      depart: l.depart,
      arrivee: l.arrivee,
      typeClient: l.typeClient,
      partenaireId: l.partenaireId || '',
      particulierNom: l.particulierNom || '',
      cout: l.cout.toString(),
    })));
    setTransportDialogOpen(true);
  };

  const totalTransport = transportLignes.reduce((sum, l) => sum + (parseFloat(l.cout) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Impossible de charger le profil
      </div>
    );
  }

  const { user, employe } = profile;
  const initials = `${user.prenom?.charAt(0) || ''}${user.nom.charAt(0)}`.toUpperCase() || user.username.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-6 w-6" />
          Mon Profil
        </h2>
        <p className="text-muted-foreground">
          Gérez vos informations et vos demandes
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {user.prenom} {user.nom}
              </h3>
              <p className="text-muted-foreground">@{user.username}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {user.email}
                  </div>
                )}
                {employe && (
                  <>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {employe.poste}
                    </div>
                    {employe.departement && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {employe.departement}
                      </div>
                    )}
                    {employe.telephone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {employe.telephone}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {!employe ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Votre compte n&apos;est pas encore lié à un profil employé.</p>
            <p className="text-sm">Contactez l&apos;administrateur pour lier votre compte.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="absences" className="space-y-4">
          <TabsList>
            <TabsTrigger value="absences" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Mes Absences
            </TabsTrigger>
            <TabsTrigger value="transport" className="gap-2">
              <Car className="h-4 w-4" />
              Fiches Transport
            </TabsTrigger>
          </TabsList>

          {/* Absences Tab */}
          <TabsContent value="absences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mes demandes d&apos;absence</CardTitle>
                  <CardDescription>Congés, permissions et absences</CardDescription>
                </div>
                <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle demande
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Demande d&apos;absence</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Type d&apos;absence *</Label>
                        <Select 
                          value={absenceForm.type} 
                          onValueChange={(v) => setAbsenceForm({ ...absenceForm, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TYPES_ABSENCE).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date début *</Label>
                          <Input
                            type="date"
                            value={absenceForm.dateDebut}
                            onChange={(e) => setAbsenceForm({ ...absenceForm, dateDebut: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date fin *</Label>
                          <Input
                            type="date"
                            value={absenceForm.dateFin}
                            onChange={(e) => setAbsenceForm({ ...absenceForm, dateFin: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Motif</Label>
                        <Textarea
                          value={absenceForm.motif}
                          onChange={(e) => setAbsenceForm({ ...absenceForm, motif: e.target.value })}
                          placeholder="Raison de la demande..."
                          rows={3}
                        />
                      </div>

                      <Button onClick={handleSubmitAbsence} disabled={submittingAbsence} className="w-full">
                        {submittingAbsence && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingAbsenceId ? 'Modifier la demande' : 'Soumettre la demande'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {employe.absences.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune demande d&apos;absence
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employe.absences.map((absence) => {
                        const typeConfig = TYPES_ABSENCE[absence.type] || { label: absence.type, color: 'bg-gray-500' };
                        const statutConfig = STATUTS_ABSENCE[absence.statut] || STATUTS_ABSENCE.en_attente;
                        const StatutIcon = statutConfig.icon;
                        return (
                          <TableRow key={absence.id}>
                            <TableCell>
                              <Badge className={`${typeConfig.color} text-white`}>
                                {typeConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p>{formatDate(absence.dateDebut)}</p>
                              <p className="text-xs text-muted-foreground">→ {formatDate(absence.dateFin)}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {absence.motif || '-'}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${statutConfig.color}`}>
                                <StatutIcon className="h-4 w-4" />
                                {statutConfig.label}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {absence.statut === 'en_attente' && (
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => startEditAbsence(absence)}
                                    title="Modifier"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteDialog({ type: 'absence', id: absence.id })}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transport Tab */}
          <TabsContent value="transport">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fiches de Paie de Transports</CardTitle>
                  <CardDescription>Remboursement des frais de déplacement</CardDescription>
                </div>
                <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle fiche
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Fiche de Paie de Transports</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={transportDate}
                          onChange={(e) => setTransportDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Trajets</Label>
                        {transportLignes.map((ligne, index) => (
                          <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Point de départ"
                                value={ligne.depart}
                                onChange={(e) => updateTransportLigne(index, 'depart', e.target.value)}
                                className="flex-1"
                              />
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Input
                                placeholder="Point d'arrivée"
                                value={ligne.arrivee}
                                onChange={(e) => updateTransportLigne(index, 'arrivee', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTransportLigne(index)}
                                disabled={transportLignes.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={ligne.typeClient} 
                                onValueChange={(v) => {
                                  updateTransportLigne(index, 'typeClient', v);
                                  if (v === 'client') {
                                    updateTransportLigne(index, 'particulierNom', '');
                                  } else {
                                    updateTransportLigne(index, 'partenaireId', '');
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="particulier">Particulier</SelectItem>
                                </SelectContent>
                              </Select>
                              {ligne.typeClient === 'client' ? (
                                <Select 
                                  value={ligne.partenaireId} 
                                  onValueChange={(v) => updateTransportLigne(index, 'partenaireId', v)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Sélectionner un client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {partenaires.map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder="Nom du particulier"
                                  value={ligne.particulierNom}
                                  onChange={(e) => updateTransportLigne(index, 'particulierNom', e.target.value)}
                                  className="flex-1"
                                />
                              )}
                              <Input
                                type="number"
                                placeholder="Coût"
                                value={ligne.cout}
                                onChange={(e) => updateTransportLigne(index, 'cout', e.target.value)}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">F CFA</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" onClick={addTransportLigne} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter un trajet
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="font-medium">Total</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(totalTransport)}
                        </span>
                      </div>

                      <Button onClick={handleSubmitTransport} disabled={submittingTransport} className="w-full">
                        {submittingTransport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingTransportId ? 'Modifier la fiche' : 'Soumettre la fiche'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {employe.fichesTransport.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune fiche de transport
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Trajets</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employe.fichesTransport.map((fiche) => (
                        <TableRow key={fiche.id}>
                          <TableCell>{formatDate(fiche.date)}</TableCell>
                          <TableCell>
                            {fiche.lignes.map((l, i) => (
                              <div key={i} className="text-sm flex items-center gap-2">
                                <span>{l.depart} → {l.arrivee}</span>
                                <span className="text-muted-foreground">
                                  ({l.typeClient === 'client' ? l.partenaire?.nom : l.particulierNom})
                                </span>
                                <span className="font-medium text-green-600 whitespace-nowrap">
                                  {formatCurrency(l.cout)}
                                </span>
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-right font-bold whitespace-nowrap">
                            {formatCurrency(fiche.totalCout)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fiche.statut === 'paye' ? 'default' : 'secondary'}>
                              {fiche.statut === 'paye' ? 'Payé' : 'Impayé'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {fiche.statut === 'impaye' && (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => startEditTransport(fiche)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteDialog({ type: 'transport', id: fiche.id })}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette {deleteDialog?.type === 'absence' ? 'demande d\'absence' : 'fiche de transport'} ? 
              Cette action est irréversible.
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
