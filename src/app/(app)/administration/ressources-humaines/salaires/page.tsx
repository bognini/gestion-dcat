'use client';

import { useState, useEffect } from 'react';
import { 
  Banknote,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Edit2,
  RefreshCw,
  Trash2,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency } from '@/lib/utils';

interface Employe {
  id: string;
  nom: string;
  prenom: string | null;
  poste: string;
  departement: string | null;
  salaireBase: number | null;
}

interface Salaire {
  id: string;
  mois: string;
  salaireBase: number;
  primes: number;
  deductions: number;
  netAPayer: number;
  statut: string;
  datePaiement: string | null;
  modePaiement: string | null;
  notes: string | null;
  documentPath: string | null;
  documentName: string | null;
  employe: Employe;
}

const MODE_LABELS: Record<string, string> = {
  virement: 'Virement',
  especes: 'Espèces',
  cheque: 'Chèque',
};

export default function SalairesPage() {
  const { toast } = useToast();
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMois, setSelectedMois] = useState('');

  // Edit dialog
  const [editDialog, setEditDialog] = useState<Salaire | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    salaireBase: '',
    primes: '',
    deductions: '',
    statut: '',
    modePaiement: '',
    datePaiement: '',
    notes: '',
  });

  // Delete dialog with code confirmation
  const [deleteDialog, setDeleteDialog] = useState<Salaire | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDeleteDialog = (salaire: Salaire) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedCode(code);
    setDeleteCode('');
    setDeleteDialog(salaire);
  };

  const handleDelete = async () => {
    if (!deleteDialog || deleteCode !== expectedCode) {
      toast({ variant: 'destructive', title: 'Code incorrect' });
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/salaires/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Salaire supprimé' });
        fetchSalaires();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleting(false);
      setDeleteDialog(null);
    }
  };

  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDocumentUpload = async (salaireId: string, file: File) => {
    setUploadingDoc(salaireId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/salaires/${salaireId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Bulletin ajouté' });
        fetchSalaires();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDelete = async (salaireId: string) => {
    setUploadingDoc(salaireId);
    try {
      const res = await fetch(`/api/salaires/${salaireId}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Bulletin supprimé' });
        fetchSalaires();
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
    // Set default month to current month
    const now = new Date();
    setSelectedMois(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (selectedMois) fetchSalaires();
  }, [selectedMois, statusFilter]);

  const fetchSalaires = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMois) params.append('mois', selectedMois);
      if (statusFilter !== 'all') params.append('statut', statusFilter);
      
      const res = await fetch(`/api/salaires?${params}`);
      if (res.ok) setSalaires(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMois) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/salaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkGenerate: true, mois: selectedMois }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message || `${data.created} salaire(s) généré(s)` });
        fetchSalaires();
      } else {
        toast({ variant: 'destructive', title: data.error || 'Erreur lors de la génération' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur de connexion' });
    } finally {
      setGenerating(false);
    }
  };

  const openEditDialog = (salaire: Salaire) => {
    setEditForm({
      salaireBase: salaire.salaireBase.toString(),
      primes: salaire.primes.toString(),
      deductions: salaire.deductions.toString(),
      statut: salaire.statut,
      modePaiement: salaire.modePaiement || '',
      datePaiement: salaire.datePaiement 
        ? new Date(salaire.datePaiement).toISOString().split('T')[0] 
        : '',
      notes: salaire.notes || '',
    });
    setEditDialog(salaire);
  };

  const handleSave = async () => {
    if (!editDialog) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/salaires/${editDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaireBase: parseFloat(editForm.salaireBase) || 0,
          primes: parseFloat(editForm.primes) || 0,
          deductions: parseFloat(editForm.deductions) || 0,
          statut: editForm.statut,
          modePaiement: editForm.modePaiement || null,
          datePaiement: editForm.datePaiement || null,
          notes: editForm.notes || null,
        }),
      });

      if (res.ok) {
        toast({ title: 'Salaire mis à jour' });
        setEditDialog(null);
        fetchSalaires();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSaving(false);
    }
  };

  const filteredSalaires = salaires.filter(s => {
    const name = `${s.employe.prenom || ''} ${s.employe.nom}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Stats
  const totalNetAPayer = salaires.reduce((sum, s) => sum + s.netAPayer, 0);
  const totalPaye = salaires.filter(s => s.statut === 'paye').reduce((sum, s) => sum + s.netAPayer, 0);
  const totalEnAttente = salaires.filter(s => s.statut === 'en_attente').reduce((sum, s) => sum + s.netAPayer, 0);

  // Generate month options (12 past months + current + 12 future months)
  const monthOptions = [];
  const now = new Date();
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rawLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    monthOptions.push({ value, label });
  }
  // Sort by date descending (most recent first)
  monthOptions.sort((a, b) => b.value.localeCompare(a.value));

  const formatMois = (dateStr: string) => {
    const date = new Date(dateStr);
    const raw = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            Gestion des Salaires
          </h2>
          <p className="text-muted-foreground">
            Suivi et paiement des salaires mensuels
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating || !selectedMois}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Générer les salaires
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMois} onValueChange={setSelectedMois}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total à payer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalNetAPayer)}</p>
            <p className="text-xs text-muted-foreground">{salaires.length} employé(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalEnAttente)}</p>
            <p className="text-xs text-muted-foreground">
              {salaires.filter(s => s.statut === 'en_attente').length} paiement(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Payés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaye)}</p>
            <p className="text-xs text-muted-foreground">
              {salaires.filter(s => s.statut === 'paye').length} paiement(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
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
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">Primes</TableHead>
              <TableHead className="text-right">Déductions</TableHead>
              <TableHead className="text-right">Net à payer</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Bulletin</TableHead>
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
            ) : filteredSalaires.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun salaire trouvé pour ce mois
                </TableCell>
              </TableRow>
            ) : (
              filteredSalaires.map((salaire) => (
                <TableRow key={salaire.id}>
                  <TableCell>
                    <p className="font-medium">
                      {salaire.employe.prenom} {salaire.employe.nom}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {salaire.employe.poste}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(salaire.salaireBase)}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {salaire.primes > 0 ? `+${formatCurrency(salaire.primes)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {salaire.deductions > 0 ? `-${formatCurrency(salaire.deductions)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(salaire.netAPayer)}</TableCell>
                  <TableCell>
                    <Badge variant={salaire.statut === 'paye' ? 'default' : 'secondary'}>
                      {salaire.statut === 'paye' ? 'Payé' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {salaire.documentPath ? (
                      <div className="flex items-center gap-1">
                        <a 
                          href={salaire.documentPath} 
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
                          onClick={() => handleDocumentDelete(salaire.id)}
                          disabled={uploadingDoc === salaire.id}
                        >
                          {uploadingDoc === salaire.id ? (
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
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(salaire.id, file);
                            e.target.value = '';
                          }}
                          disabled={uploadingDoc === salaire.id}
                        />
                        <Button size="sm" variant="ghost" className="h-6 px-2" asChild disabled={uploadingDoc === salaire.id}>
                          <span>
                            {uploadingDoc === salaire.id ? (
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
                        onClick={() => openEditDialog(salaire)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(salaire)}
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

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Modifier le salaire - {editDialog?.employe.prenom} {editDialog?.employe.nom}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salaire de base</Label>
                <Input
                  type="number"
                  value={editForm.salaireBase}
                  onChange={(e) => setEditForm({ ...editForm, salaireBase: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Primes</Label>
                <Input
                  type="number"
                  value={editForm.primes}
                  onChange={(e) => setEditForm({ ...editForm, primes: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Déductions</Label>
              <Input
                type="number"
                value={editForm.deductions}
                onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Net à payer:</span>
                <span className="font-bold">
                  {formatCurrency(
                    (parseFloat(editForm.salaireBase) || 0) + 
                    (parseFloat(editForm.primes) || 0) - 
                    (parseFloat(editForm.deductions) || 0)
                  )}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select 
                  value={editForm.statut} 
                  onValueChange={(v) => setEditForm({ ...editForm, statut: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="paye">Payé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select 
                  value={editForm.modePaiement} 
                  onValueChange={(v) => setEditForm({ ...editForm, modePaiement: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editForm.statut === 'paye' && (
              <div className="space-y-2">
                <Label>Date de paiement</Label>
                <Input
                  type="date"
                  value={editForm.datePaiement}
                  onChange={(e) => setEditForm({ ...editForm, datePaiement: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notes optionnelles..."
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog with Code Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce salaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Pour confirmer la suppression du salaire de{' '}
              <strong>{deleteDialog?.employe.prenom} {deleteDialog?.employe.nom}</strong>,
              entrez le code suivant : <strong className="text-primary text-lg">{expectedCode}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Entrez le code à 4 chiffres"
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="text-center text-2xl tracking-widest"
              maxLength={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting || deleteCode !== expectedCode}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
