'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import Link from 'next/link';
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
  FileDown,
  Eye,
  Upload,
  File,
  X,
  ArrowLeft
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
import { MoneyInput } from '@/components/ui/money-input';

interface Partenaire {
  id: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  email: string | null;
  telephone1: string | null;
}

interface ContratPrestataire {
  id: string;
  numero: string;
  partenaire: Partenaire;
  objet: string;
  description: string | null;
  montant: number;
  dateDebut: string;
  dateFin: string | null;
  delaiExecution: string | null;
  conditionsPaiement: string | null;
  statut: string;
  documentPath: string | null;
  documentName: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-500', icon: Clock },
  termine: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle },
  annule: { label: 'Annulé', color: 'bg-red-500', icon: XCircle },
};

export default function ContratsPrestatairesPage() {
  const { toast } = useToast();
  const [contrats, setContrats] = useState<ContratPrestataire[]>([]);
  const [prestataires, setPrestataires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    partenaireId: '',
    objet: '',
    description: '',
    montant: '',
    dateDebut: '',
    dateFin: '',
    delaiExecution: '',
    conditionsPaiement: '',
    notes: '',
    statut: 'brouillon',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<ContratPrestataire | null>(null);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<ContratPrestataire | null>(null);

  // Document upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDocumentUpload = async (contratId: string, file: File) => {
    setUploadingDoc(contratId);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await fetch(`/api/contrats-prestataires/${contratId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur upload');

      toast({ title: 'Document ajouté', description: file.name });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'uploader le document' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteDocument = async (contratId: string) => {
    try {
      const res = await fetch(`/api/contrats-prestataires/${contratId}/document`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur');
      toast({ title: 'Document supprimé' });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [contratsRes, partenairesRes] = await Promise.all([
        fetch(`/api/contrats-prestataires${statusFilter !== 'all' ? `?statut=${statusFilter}` : ''}`),
        fetch('/api/partenaires?type=prestataire'),
      ]);
      
      if (contratsRes.ok) setContrats(await contratsRes.json());
      if (partenairesRes.ok) {
        const allPartenaires = await partenairesRes.json();
        // Filter to only prestataires
        setPrestataires(allPartenaires.filter((p: { type: string }) => p.type === 'prestataire'));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      partenaireId: '',
      objet: '',
      description: '',
      montant: '',
      dateDebut: '',
      dateFin: '',
      delaiExecution: '',
      conditionsPaiement: '',
      notes: '',
      statut: 'brouillon',
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (contrat: ContratPrestataire) => {
    setForm({
      partenaireId: contrat.partenaire.id,
      objet: contrat.objet,
      description: contrat.description || '',
      montant: contrat.montant.toString(),
      dateDebut: contrat.dateDebut.split('T')[0],
      dateFin: contrat.dateFin?.split('T')[0] || '',
      delaiExecution: contrat.delaiExecution || '',
      conditionsPaiement: contrat.conditionsPaiement || '',
      notes: contrat.notes || '',
      statut: contrat.statut,
    });
    setEditingId(contrat.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.partenaireId || !form.objet || !form.montant || !form.dateDebut) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/contrats-prestataires/${editingId}` : '/api/contrats-prestataires';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          montant: parseFloat(form.montant),
        }),
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
      const res = await fetch(`/api/contrats-prestataires/${deleteDialog.id}`, { method: 'DELETE' });
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

  const filteredContrats = contrats.filter(c =>
    c.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partenaire.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.numero.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: contrats.length,
    enCours: contrats.filter(c => c.statut === 'en_cours').length,
    montantTotal: contrats
      .filter(c => c.statut === 'en_cours')
      .reduce((sum, c) => sum + c.montant, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/administration/gestion-administrative">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            Contrats Prestataires
          </h2>
          <p className="text-muted-foreground">
            Gestion des contrats de prestation de service
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau contrat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier le contrat' : 'Nouveau contrat prestataire'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Prestataire *</Label>
                <Select value={form.partenaireId} onValueChange={(v) => setForm({ ...form, partenaireId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {prestataires.length === 0 ? (
                      <SelectItem value="none" disabled>Aucun prestataire. Ajoutez-en dans Paramètres.</SelectItem>
                    ) : (
                      prestataires.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objet du contrat *</Label>
                <Input
                  value={form.objet}
                  onChange={(e) => setForm({ ...form, objet: e.target.value })}
                  placeholder="Ex: Installation réseau informatique"
                />
              </div>
              <div className="space-y-2">
                <Label>Description des prestations</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Détail des prestations à effectuer..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <MoneyInput
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Délai d'exécution</Label>
                  <Input
                    value={form.delaiExecution}
                    onChange={(e) => setForm({ ...form, delaiExecution: e.target.value })}
                    placeholder="Ex: 15 jours ouvrables"
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
                  <Label>Date de fin prévue</Label>
                  <Input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conditions de paiement</Label>
                <Textarea
                  value={form.conditionsPaiement}
                  onChange={(e) => setForm({ ...form, conditionsPaiement: e.target.value })}
                  rows={2}
                  placeholder="Ex: 50% à la commande, 50% à la livraison"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
              {editingId && (
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              <Clock className="h-4 w-4 text-blue-500" />
              En cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Montant total en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.montantTotal)}</p>
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
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Contrat</TableHead>
              <TableHead>Prestataire</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredContrats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun contrat trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredContrats.map((contrat) => {
                const statutConfig = STATUTS[contrat.statut] || STATUTS.en_cours;
                const StatutIcon = statutConfig.icon;
                
                return (
                  <TableRow key={contrat.id}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-primary">{contrat.numero}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{contrat.partenaire.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate" title={contrat.objet}>{contrat.objet}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(contrat.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Début: {formatDate(contrat.dateDebut)}</span>
                        </div>
                        {contrat.dateFin && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Fin: {formatDate(contrat.dateFin)}</span>
                          </div>
                        )}
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
                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <File className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{contrat.documentName}</span>
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteDocument(contrat.id)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            className="hidden"
                            id={`doc-${contrat.id}`}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(contrat.id, file);
                              e.target.value = '';
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            disabled={uploadingDoc === contrat.id}
                            onClick={() => document.getElementById(`doc-${contrat.id}`)?.click()}
                          >
                            {uploadingDoc === contrat.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Ajouter
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailDialog(contrat)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contrat de Prestation - {detailDialog?.numero}</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prestataire</p>
                  <p className="font-medium">{detailDialog.partenaire.nom}</p>
                  {detailDialog.partenaire.adresse && (
                    <p className="text-sm text-muted-foreground">{detailDialog.partenaire.adresse}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-bold text-lg">{formatCurrency(detailDialog.montant)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objet</p>
                <p className="font-medium">{detailDialog.objet}</p>
              </div>
              {detailDialog.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{detailDialog.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date de début</p>
                  <p>{formatDate(detailDialog.dateDebut)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin</p>
                  <p>{detailDialog.dateFin ? formatDate(detailDialog.dateFin) : '-'}</p>
                </div>
              </div>
              {detailDialog.delaiExecution && (
                <div>
                  <p className="text-sm text-muted-foreground">Délai d'exécution</p>
                  <p>{detailDialog.delaiExecution}</p>
                </div>
              )}
              {detailDialog.conditionsPaiement && (
                <div>
                  <p className="text-sm text-muted-foreground">Conditions de paiement</p>
                  <p className="whitespace-pre-wrap">{detailDialog.conditionsPaiement}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le contrat{' '}
              <strong>{deleteDialog?.numero}</strong>.
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
