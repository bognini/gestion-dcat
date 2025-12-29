'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  CreditCard,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FactureLigne {
  id: string;
  ordre: number;
  reference: string;
  designation: string;
  details: string | null;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
}

interface Paiement {
  id: string;
  reference: string;
  date: string;
  montant: number;
  modePaiement: string;
  notes: string | null;
}

interface Facture {
  id: string;
  reference: string;
  date: string;
  dateEcheance: string | null;
  clientNom: string;
  clientAdresse: string | null;
  clientVille: string | null;
  clientPays: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  objet: string | null;
  totalHT: number;
  totalTTC: number;
  montantPaye: number;
  resteAPayer: number;
  statut: string;
  notes: string | null;
  documentPath: string | null;
  documentName: string | null;
  lignes: FactureLigne[];
  paiements: Paiement[];
  devis: { id: string; reference: string } | null;
  createdBy: { id: string; nom: string; prenom: string | null } | null;
  createdAt: string;
}

const STATUTS = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  envoyee: { label: 'Envoyée', color: 'bg-blue-500', icon: Send },
  payee_partiellement: { label: 'Paiement partiel', color: 'bg-orange-500', icon: AlertCircle },
  payee: { label: 'Payée', color: 'bg-green-500', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-red-500', icon: AlertCircle },
};

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'cheque', label: 'Chèque' },
];

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  
  // Payment form
  const [paymentMontant, setPaymentMontant] = useState('');
  const [paymentMode, setPaymentMode] = useState('especes');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchFacture();
  }, [id]);

  const fetchFacture = async () => {
    try {
      const res = await fetch(`/api/factures/${id}`);
      if (res.ok) {
        setFacture(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Facture non trouvée' });
        router.push('/administration/finance-comptabilite/factures');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...facture, statut: newStatus }),
      });
      if (res.ok) {
        setFacture(prev => prev ? { ...prev, statut: newStatus } : null);
        toast({ title: 'Statut mis à jour' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/factures/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Facture supprimée' });
        router.push('/administration/finance-comptabilite/factures');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const handleAddPayment = async () => {
    const montant = parseFloat(paymentMontant);
    if (!montant || montant <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide' });
      return;
    }
    if (facture && montant > facture.resteAPayer) {
      toast({ variant: 'destructive', title: 'Montant supérieur au reste à payer' });
      return;
    }

    setAddingPayment(true);
    try {
      const res = await fetch(`/api/factures/${id}/paiements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant,
          modePaiement: paymentMode,
          notes: paymentNotes || null,
        }),
      });

      if (res.ok) {
        toast({ title: 'Paiement enregistré' });
        setPaymentDialogOpen(false);
        setPaymentMontant('');
        setPaymentNotes('');
        fetchFacture(); // Reload
      } else {
        throw new Error();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/factures/${id}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Document ajouté' });
        fetchFacture();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDocumentDelete = async () => {
    setUploadingDoc(true);
    try {
      const res = await fetch(`/api/factures/${id}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document supprimé' });
        fetchFacture();
      } else {
        toast({ variant: 'destructive', title: 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!facture) return null;

  const statusInfo = STATUTS[facture.statut as keyof typeof STATUTS] || STATUTS.brouillon;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administration/finance-comptabilite/factures">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Facture {facture.reference}
              </h2>
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Créée le {formatDate(facture.createdAt)}
              {facture.createdBy && ` par ${facture.createdBy.prenom || ''} ${facture.createdBy.nom}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={facture.resteAPayer <= 0}>
                <CreditCard className="mr-2 h-4 w-4" />
                Ajouter paiement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="text-2xl font-bold">{formatCurrency(facture.resteAPayer)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant">Montant *</Label>
                  <MoneyInput
                    id="montant"
                    value={paymentMontant}
                    onChange={(e) => setPaymentMontant(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
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
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Référence, numéro de transaction..."
                  />
                </div>
                <Button onClick={handleAddPayment} disabled={addingPayment} className="w-full">
                  {addingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => window.open(`/api/factures/${id}/pdf`, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/administration/finance-comptabilite/factures/${id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-lg">{facture.clientNom}</p>
            {facture.clientAdresse && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {facture.clientAdresse}
                  {facture.clientVille && `, ${facture.clientVille}`}
                  {facture.clientPays && ` - ${facture.clientPays}`}
                </span>
              </div>
            )}
            {facture.clientTelephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{facture.clientTelephone}</span>
              </div>
            )}
            {facture.clientEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{facture.clientEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={facture.statut}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUTS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {facture.dateEcheance && (
              <div className="text-sm">
                <p className="text-muted-foreground">Échéance</p>
                <p className="font-medium">{formatDate(facture.dateEcheance)}</p>
              </div>
            )}
            {facture.devis && (
              <div className="text-sm">
                <p className="text-muted-foreground">Devis associé</p>
                <Link 
                  href={`/administration/finance-comptabilite/devis/${facture.devis.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {facture.devis.reference}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground text-sm">Total TTC</span>
              <span className="font-bold text-lg whitespace-nowrap">{formatCurrency(facture.totalTTC)}</span>
            </div>
            <div className="flex justify-between items-center gap-2 text-green-600">
              <span className="text-sm">Payé</span>
              <span className="font-medium whitespace-nowrap">{formatCurrency(facture.montantPaye)}</span>
            </div>
            <div className="flex justify-between items-center gap-2 text-orange-600">
              <span className="text-sm">Reste à payer</span>
              <span className="font-bold whitespace-nowrap">{formatCurrency(facture.resteAPayer)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document joint
          </CardTitle>
          <CardDescription>Facture signée ou document associé</CardDescription>
        </CardHeader>
        <CardContent>
          {facture.documentPath ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{facture.documentName}</p>
                  <a 
                    href={facture.documentPath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Voir le document
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={handleDocumentDelete}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Aucun document joint
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                />
                <Button variant="outline" disabled={uploadingDoc} asChild>
                  <span>
                    {uploadingDoc ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Ajouter un document
                  </span>
                </Button>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lignes */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des lignes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 whitespace-nowrap">REF.</TableHead>
                <TableHead>DESIGNATION</TableHead>
                <TableHead className="text-center w-20 whitespace-nowrap">QTE</TableHead>
                <TableHead className="text-center w-16 whitespace-nowrap">Unité</TableHead>
                <TableHead className="text-right w-32 whitespace-nowrap">P.U</TableHead>
                <TableHead className="text-right w-36 whitespace-nowrap">MONTANT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facture.lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell className="font-mono text-sm">{ligne.reference}</TableCell>
                  <TableCell>
                    <p className="font-medium">{ligne.designation}</p>
                    {ligne.details && (
                      <p className="text-sm text-muted-foreground italic">{ligne.details}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{ligne.quantite}</TableCell>
                  <TableCell className="text-center">{ligne.unite}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(ligne.montant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-indigo-600 text-white hover:bg-indigo-600">
                <TableCell colSpan={5} className="text-right font-bold">
                  TOTAL TTC
                </TableCell>
                <TableCell className="text-right font-bold text-lg whitespace-nowrap">
                  {formatCurrency(facture.totalTTC)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facture.paiements.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">Aucun paiement enregistré</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facture.paiements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.reference}</TableCell>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>{MODES_PAIEMENT.find(m => m.value === p.modePaiement)?.label || p.modePaiement}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(p.montant)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture {facture.reference} et tous ses paiements seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
