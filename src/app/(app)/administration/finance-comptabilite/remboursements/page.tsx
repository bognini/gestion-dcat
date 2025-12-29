'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Eye,
  CreditCard,
  Upload,
  FileText,
  X,
  Download
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

interface Partenaire {
  id: string;
  nom: string;
  telephone1: string | null;
  email: string | null;
}

interface Paiement {
  id: string;
  montant: number;
  datePaiement: string;
  modePaiement: string;
  reference: string | null;
}

interface DocumentRemb {
  id: string;
  nom: string;
  fichier: string;
  type: string | null;
  taille: number | null;
  createdAt: string;
}

interface Remboursement {
  id: string;
  montantTotal: number;
  montantPaye: number;
  motif: string;
  reference: string | null;
  dateEcheance: string | null;
  statut: string;
  notes: string | null;
  partenaire: Partenaire;
  paiements: Paiement[];
  documents?: DocumentRemb[];
  createdAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_cours: { label: 'En cours', color: 'bg-yellow-500', icon: Clock },
  partiel: { label: 'Paiement partiel', color: 'bg-blue-500', icon: CreditCard },
  solde: { label: 'Soldé', color: 'bg-green-500', icon: CheckCircle },
  contentieux: { label: 'Contentieux', color: 'bg-red-500', icon: AlertTriangle },
};

const MODES_PAIEMENT = ['especes', 'virement', 'cheque', 'mobile_money'];
const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  virement: 'Virement',
  cheque: 'Chèque',
  mobile_money: 'Mobile Money',
};

export default function RemboursementsPage() {
  const { toast } = useToast();
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRemb, setNewRemb] = useState({
    partenaireId: '',
    montantTotal: '',
    motif: '',
    reference: '',
    dateEcheance: '',
    notes: '',
  });

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState<{ remb: Remboursement } | null>(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    montant: '',
    modePaiement: 'virement',
    reference: '',
    datePaiement: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<Remboursement | null>(null);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<Remboursement | null>(null);
  const [documents, setDocuments] = useState<DocumentRemb[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [rembRes, partRes] = await Promise.all([
        fetch(`/api/remboursements${statusFilter !== 'all' ? `?statut=${statusFilter}` : ''}`),
        fetch('/api/partenaires'),
      ]);
      if (rembRes.ok) setRemboursements(await rembRes.json());
      if (partRes.ok) setPartenaires(await partRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newRemb.partenaireId || !newRemb.montantTotal || !newRemb.motif) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/remboursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRemb,
          montantTotal: parseFloat(newRemb.montantTotal),
        }),
      });

      if (res.ok) {
        toast({ title: 'Créance ajoutée' });
        setCreateDialogOpen(false);
        setNewRemb({ partenaireId: '', montantTotal: '', motif: '', reference: '', dateEcheance: '', notes: '' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setCreating(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentDialog || !newPayment.montant) {
      toast({ variant: 'destructive', title: 'Montant requis' });
      return;
    }

    setAddingPayment(true);
    try {
      const res = await fetch(`/api/remboursements/${paymentDialog.remb.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addPaiement: {
            montant: parseFloat(newPayment.montant),
            modePaiement: newPayment.modePaiement,
            reference: newPayment.reference,
            datePaiement: newPayment.datePaiement,
            notes: newPayment.notes,
          },
        }),
      });

      if (res.ok) {
        // Upload document if provided
        if (paymentFile) {
          const formData = new FormData();
          formData.append('file', paymentFile);
          await fetch(`/api/remboursements/${paymentDialog.remb.id}/documents`, {
            method: 'POST',
            body: formData,
          });
        }
        toast({ title: 'Paiement enregistré' });
        setPaymentDialog(null);
        setNewPayment({ montant: '', modePaiement: 'virement', reference: '', datePaiement: new Date().toISOString().split('T')[0], notes: '' });
        setPaymentFile(null);
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      const res = await fetch(`/api/remboursements/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Créance supprimée' });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDeleteDialog(null);
    }
  };

  // Fetch documents when detail dialog opens
  useEffect(() => {
    if (detailDialog) {
      fetchDocuments(detailDialog.id);
    } else {
      setDocuments([]);
    }
  }, [detailDialog]);

  const fetchDocuments = async (remboursementId: string) => {
    try {
      const res = await fetch(`/api/remboursements/${remboursementId}/documents`);
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, remboursementId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/remboursements/${remboursementId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Document ajouté' });
        fetchDocuments(remboursementId);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (remboursementId: string, documentId: string) => {
    try {
      const res = await fetch(`/api/remboursements/${remboursementId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ title: 'Document supprimé' });
        fetchDocuments(remboursementId);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const filteredRemboursements = remboursements.filter(r =>
    r.partenaire.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.motif.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalEnCours = remboursements
    .filter(r => r.statut !== 'solde')
    .reduce((sum, r) => sum + (r.montantTotal - r.montantPaye), 0);
  const totalSolde = remboursements
    .filter(r => r.statut === 'solde')
    .reduce((sum, r) => sum + r.montantTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Gestion des Créances Clients
          </h2>
          <p className="text-muted-foreground">
            Suivi des sommes dues par les clients
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle créance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une créance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={newRemb.partenaireId} onValueChange={(v) => setNewRemb({ ...newRemb, partenaireId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {partenaires.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant total (FCFA) *</Label>
                <MoneyInput
                  value={newRemb.montantTotal}
                  onChange={(e) => setNewRemb({ ...newRemb, montantTotal: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Motif / Description *</Label>
                <Textarea
                  value={newRemb.motif}
                  onChange={(e) => setNewRemb({ ...newRemb, motif: e.target.value })}
                  placeholder="Ex: Facture N°XXX, Intervention du..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input
                    value={newRemb.reference}
                    onChange={(e) => setNewRemb({ ...newRemb, reference: e.target.value })}
                    placeholder="N° facture..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date d&apos;échéance</Label>
                  <Input
                    type="date"
                    value={newRemb.dateEcheance}
                    onChange={(e) => setNewRemb({ ...newRemb, dateEcheance: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newRemb.notes}
                  onChange={(e) => setNewRemb({ ...newRemb, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total à recouvrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEnCours)}</p>
            <p className="text-xs text-muted-foreground">
              {remboursements.filter(r => r.statut !== 'solde').length} créance(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Total recouvré
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSolde)}</p>
            <p className="text-xs text-muted-foreground">
              {remboursements.filter(r => r.statut === 'solde').length} créance(s) soldées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total créances</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{remboursements.length}</p>
            <p className="text-xs text-muted-foreground">
              {partenaires.length} client(s) concerné(s)
            </p>
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
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="partiel">Paiement partiel</SelectItem>
            <SelectItem value="solde">Soldé</SelectItem>
            <SelectItem value="contentieux">Contentieux</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Payé</TableHead>
              <TableHead className="text-right">Reste</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
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
            ) : filteredRemboursements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune créance trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredRemboursements.map((remb) => {
                const statutConfig = STATUTS[remb.statut] || STATUTS.en_cours;
                const StatutIcon = statutConfig.icon;
                const reste = remb.montantTotal - remb.montantPaye;
                const isOverdue = remb.dateEcheance && new Date(remb.dateEcheance) < new Date() && remb.statut !== 'solde';
                
                return (
                  <TableRow key={remb.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell>
                      <p className="font-medium">{remb.partenaire.nom}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {remb.motif}
                      {remb.reference && (
                        <p className="text-xs text-muted-foreground">{remb.reference}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatCurrency(remb.montantTotal)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 whitespace-nowrap">
                      {formatCurrency(remb.montantPaye)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 whitespace-nowrap">
                      {formatCurrency(reste)}
                    </TableCell>
                    <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {remb.dateEcheance ? formatDate(remb.dateEcheance) : '-'}
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
                          onClick={() => setDetailDialog(remb)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {remb.statut !== 'solde' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => setPaymentDialog({ remb })}
                            title="Enregistrer paiement"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => setDeleteDialog(remb)}
                          title="Supprimer"
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

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          {paymentDialog && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{paymentDialog.remb.partenaire.nom}</p>
                <p className="text-sm text-muted-foreground">{paymentDialog.remb.motif}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Reste à payer:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(paymentDialog.remb.montantTotal - paymentDialog.remb.montantPaye)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Montant du paiement (FCFA) *</Label>
                <MoneyInput
                  value={newPayment.montant}
                  onChange={(e) => setNewPayment({ ...newPayment, montant: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={newPayment.modePaiement} onValueChange={(v) => setNewPayment({ ...newPayment, modePaiement: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES_PAIEMENT.map(m => (
                        <SelectItem key={m} value={m}>{MODE_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newPayment.datePaiement}
                    onChange={(e) => setNewPayment({ ...newPayment, datePaiement: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Référence transaction</Label>
                <Input
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                  placeholder="N° transaction..."
                />
              </div>
              <div className="space-y-2">
                <Label>Justificatif (optionnel)</Label>
                <Input
                  type="file"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {paymentFile && (
                  <p className="text-xs text-muted-foreground">
                    Fichier: {paymentFile.name}
                  </p>
                )}
              </div>
              <Button onClick={handleAddPayment} disabled={addingPayment} className="w-full">
                {addingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le paiement
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la créance</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{detailDialog.partenaire.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{detailDialog.reference || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-bold">{formatCurrency(detailDialog.montantTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(detailDialog.montantTotal - detailDialog.montantPaye)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Motif</p>
                <p>{detailDialog.motif}</p>
              </div>
              {detailDialog.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{detailDialog.notes}</p>
                </div>
              )}
              {detailDialog.paiements.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Historique des paiements</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailDialog.paiements.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.datePaiement)}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(p.montant)}
                          </TableCell>
                          <TableCell>{MODE_LABELS[p.modePaiement] || p.modePaiement}</TableCell>
                          <TableCell>{p.reference || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Documents Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents joints ({documents.length})
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, detailDialog.id)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Button size="sm" variant="outline" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Ajouter
                      </span>
                    </Button>
                  </label>
                </div>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{doc.nom}</span>
                          {doc.taille && (
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(doc.taille / 1024)} Ko)
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={doc.fichier} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteDocument(detailDialog.id, doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun document joint
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la créance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La créance de{' '}
              <strong>{deleteDialog?.partenaire.nom}</strong> d&apos;un montant de{' '}
              <strong>{deleteDialog && formatCurrency(deleteDialog.montantTotal)}</strong> sera supprimée.
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
