'use client';

import { useState, useEffect } from 'react';
import { 
  FileSignature,
  Plus,
  Search,
  Calendar,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Partenaire {
  id: string;
  nom: string;
  telephone1: string | null;
  email: string | null;
}

interface Echeance {
  id: string;
  mois: string;
  montant: number;
  statut: string;
  datePaiement: string | null;
}

interface ContratClient {
  id: string;
  numero: string;
  titre: string;
  partenaire: Partenaire;
  type: string;
  montantMensuel: number | null;
  montantAnnuel: number | null;
  dateDebut: string;
  dateFin: string | null;
  modePaiement: string;
  statut: string;
  description: string | null;
  documentPath: string | null;
  documentName: string | null;
  echeances: Echeance[];
  createdAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  actif: { label: 'Actif', color: 'bg-green-500', icon: CheckCircle },
  suspendu: { label: 'Suspendu', color: 'bg-orange-500', icon: Clock },
  resilie: { label: 'Résilié', color: 'bg-red-500', icon: XCircle },
  expire: { label: 'Expiré', color: 'bg-gray-500', icon: AlertTriangle },
};

const TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'prestation', label: 'Prestation' },
  { value: 'projet', label: 'Projet' },
  { value: 'assistance-conseil', label: 'Assistance conseil' },
  { value: 'autre', label: 'Autre' },
];

const MODES_PAIEMENT = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'annuel', label: 'Annuel' },
  { value: 'intervention', label: 'Par intervention' },
];

const getMontantLabel = (mode: string) => {
  switch (mode) {
    case 'mensuel': return 'Montant mensuel (FCFA)';
    case 'trimestriel': return 'Montant trimestriel (FCFA)';
    case 'annuel': return 'Montant annuel (FCFA)';
    case 'intervention': return 'Montant par intervention (FCFA)';
    default: return 'Montant (FCFA)';
  }
};

export default function ContratsClientsPage() {
  const { toast } = useToast();
  const [contrats, setContrats] = useState<ContratClient[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    partenaireId: '',
    titre: '',
    type: 'maintenance',
    montantMensuel: '',
    dateDebut: '',
    dateFin: '',
    modePaiement: 'mensuel',
    description: '',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<ContratClient | null>(null);

  // Échéance generation dialog
  const [echeanceDialog, setEcheanceDialog] = useState<ContratClient | null>(null);
  const [generatingEcheances, setGeneratingEcheances] = useState(false);

  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDocumentUpload = async (contratId: string, file: File) => {
    setUploadingDoc(contratId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/contrats-clients/${contratId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Document ajouté' });
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

  const handleDocumentDelete = async (contratId: string) => {
    setUploadingDoc(contratId);
    try {
      const res = await fetch(`/api/contrats-clients/${contratId}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document supprimé' });
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
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [contratsRes, partenairesRes] = await Promise.all([
        fetch(`/api/contrats-clients${statusFilter !== 'all' ? `?statut=${statusFilter}` : ''}`),
        fetch('/api/partenaires'),
      ]);
      
      if (contratsRes.ok) setContrats(await contratsRes.json());
      if (partenairesRes.ok) setPartenaires(await partenairesRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      partenaireId: '',
      titre: '',
      type: 'maintenance',
      montantMensuel: '',
      dateDebut: '',
      dateFin: '',
      modePaiement: 'mensuel',
      description: '',
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (contrat: ContratClient) => {
    setForm({
      partenaireId: contrat.partenaire.id,
      titre: contrat.titre,
      type: contrat.type,
      montantMensuel: contrat.montantMensuel?.toString() || '',
      dateDebut: contrat.dateDebut.split('T')[0],
      dateFin: contrat.dateFin?.split('T')[0] || '',
      modePaiement: contrat.modePaiement,
      description: contrat.description || '',
    });
    setEditingId(contrat.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.partenaireId || !form.titre || !form.dateDebut) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        montantMensuel: form.montantMensuel ? parseFloat(form.montantMensuel) : null,
      };

      const url = editingId ? `/api/contrats-clients/${editingId}` : '/api/contrats-clients';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingId ? 'Contrat modifié' : 'Contrat créé' });
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
      const res = await fetch(`/api/contrats-clients/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Contrat supprimé' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleGenerateEcheances = async () => {
    if (!echeanceDialog) return;
    
    setGeneratingEcheances(true);
    try {
      const res = await fetch(`/api/contrats-clients/${echeanceDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateEcheances: { months: 12 },
        }),
      });

      if (res.ok) {
        toast({ title: 'Échéances générées avec succès', description: 'Les échéances apparaîtront dans la fiche détaillée du contrat.' });
        fetchData();
        setEcheanceDialog(null);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setGeneratingEcheances(false);
    }
  };

  const filteredContrats = contrats.filter(c =>
    c.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partenaire.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.numero.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: contrats.length,
    actifs: contrats.filter(c => c.statut === 'actif').length,
    montantMensuel: contrats
      .filter(c => c.statut === 'actif')
      .reduce((sum, c) => sum + (c.montantMensuel || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            Contrats Clients
          </h2>
          <p className="text-muted-foreground">
            Gestion des contrats de maintenance et partenariat
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau contrat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier le contrat' : 'Nouveau contrat'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Partenaire *</Label>
                <Select value={form.partenaireId} onValueChange={(v) => setForm({ ...form, partenaireId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partenaires.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Titre du contrat *</Label>
                <Input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Contrat de maintenance annuel"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Mode de paiement</Label>
                  <Select value={form.modePaiement} onValueChange={(v) => setForm({ ...form, modePaiement: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES_PAIEMENT.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{getMontantLabel(form.modePaiement)}</Label>
                <Input
                  type="number"
                  value={form.montantMensuel}
                  onChange={(e) => setForm({ ...form, montantMensuel: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
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
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Enregistrer' : 'Créer le contrat'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total contrats</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Contrats actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenus mensuels</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.montantMensuel)}</p>
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
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
            <SelectItem value="resilie">Résilié</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Contrat</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Montant/mois</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredContrats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun contrat trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredContrats.map((contrat) => {
                const statutConfig = STATUTS[contrat.statut] || STATUTS.actif;
                const StatutIcon = statutConfig.icon;
                const typeLabel = TYPES.find(t => t.value === contrat.type)?.label || contrat.type;
                
                return (
                  <TableRow key={contrat.id}>
                    <TableCell className="font-mono text-sm">{contrat.numero}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {contrat.partenaire.nom}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{contrat.titre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {contrat.montantMensuel ? formatCurrency(contrat.montantMensuel) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(contrat.dateDebut)}
                        {contrat.dateFin && ` - ${formatDate(contrat.dateFin)}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statutConfig.color} text-white gap-1`}>
                        <StatutIcon className="h-3 w-3" />
                        {statutConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contrat.documentPath ? (
                        <div className="flex items-center gap-1">
                          <a 
                            href={contrat.documentPath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => handleDocumentDelete(contrat.id)}
                            disabled={uploadingDoc === contrat.id}
                          >
                            {uploadingDoc === contrat.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(contrat.id, file);
                              e.target.value = '';
                            }}
                            disabled={uploadingDoc === contrat.id}
                          />
                          <Button size="sm" variant="ghost" className="h-6 px-2" asChild disabled={uploadingDoc === contrat.id}>
                            <span>
                              {uploadingDoc === contrat.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                            </span>
                          </Button>
                        </label>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEcheanceDialog(contrat)}
                          title="Générer échéances"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(contrat)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => setDeleteDialog(contrat)}
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
      <AlertDialog open={!!echeanceDialog} onOpenChange={(open) => !open && setEcheanceDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Générer les échéances ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va générer 12 mois d'échéances pour le contrat{' '}
              <strong>{echeanceDialog?.numero}</strong> ({echeanceDialog?.titre}).
              <br /><br />
              Les échéances seront visibles dans la fiche détaillée du contrat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateEcheances} disabled={generatingEcheances}>
              {generatingEcheances ? 'Génération...' : 'Générer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le contrat{' '}
              <strong>{deleteDialog?.numero}</strong> et toutes ses échéances.
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
