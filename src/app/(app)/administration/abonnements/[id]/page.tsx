'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Repeat,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  FileText,
  X,
  CreditCard
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
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Echeance {
  id: string;
  dateEcheance: string;
  montant: number;
  statut: string;
  datePaiement: string | null;
  reference: string | null;
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
  echeances: Echeance[];
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  actif: { label: 'Actif', color: 'bg-green-500', icon: CheckCircle },
  suspendu: { label: 'Suspendu', color: 'bg-orange-500', icon: Clock },
  expire: { label: 'Expiré', color: 'bg-gray-500', icon: AlertTriangle },
  resilie: { label: 'Résilié', color: 'bg-red-500', icon: XCircle },
};

const ECHEANCE_STATUTS: Record<string, { label: string; color: string }> = {
  a_payer: { label: 'À payer', color: 'bg-yellow-500' },
  paye: { label: 'Payé', color: 'bg-green-500' },
  retard: { label: 'En retard', color: 'bg-red-500' },
};

export default function AbonnementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState<Echeance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const openPaymentDialog = (echeance: Echeance) => {
    setPaymentDialog(echeance);
    setPaymentAmount(echeance.montant.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentFile(null);
  };

  const handlePayment = async () => {
    if (!paymentDialog) return;
    
    setProcessingPayment(true);
    try {
      // First, mark as paid
      const res = await fetch(`/api/abonnements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payEcheance: {
            echeanceId: paymentDialog.id,
            datePaiement: paymentDate,
            montant: parseFloat(paymentAmount),
          }
        }),
      });

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Erreur lors du paiement' });
        return;
      }

      // Then upload receipt if provided
      if (paymentFile) {
        const formData = new FormData();
        formData.append('file', paymentFile);
        await fetch(`/api/abonnements/${id}/echeances/${paymentDialog.id}/document`, {
          method: 'POST',
          body: formData,
        });
      }

      toast({ title: 'Paiement enregistré' });
      fetchAbonnement();
      setPaymentDialog(null);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    fetchAbonnement();
  }, [id]);

  const fetchAbonnement = async () => {
    try {
      const res = await fetch(`/api/abonnements/${id}`);
      if (res.ok) {
        setAbonnement(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Abonnement non trouvé' });
        router.push('/administration/abonnements');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/abonnements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Abonnement supprimé' });
        router.push('/administration/abonnements');
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
    setDeleteDialogOpen(false);
  };

  const handleDocumentUpload = async (echeanceId: string, file: File) => {
    setUploadingDoc(echeanceId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/abonnements/${id}/echeances/${echeanceId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Justificatif ajouté' });
        fetchAbonnement();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDelete = async (echeanceId: string) => {
    setUploadingDoc(echeanceId);
    try {
      const res = await fetch(`/api/abonnements/${id}/echeances/${echeanceId}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Justificatif supprimé' });
        fetchAbonnement();
      } else {
        toast({ variant: 'destructive', title: 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!abonnement) return null;

  const statutConfig = STATUTS[abonnement.statut] || STATUTS.actif;
  const StatutIcon = statutConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administration/abonnements">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Repeat className="h-6 w-6" />
                {abonnement.nom}
              </h2>
              <Badge className={`${statutConfig.color} text-white`}>
                <StatutIcon className="h-3 w-3 mr-1" />
                {statutConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{abonnement.fournisseur}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Montant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(abonnement.montant)}</p>
            <p className="text-sm text-muted-foreground">
              {abonnement.periodicite === 'annuel' ? 'Par an' : 'Par mois'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Période
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Début</p>
              <p className="font-medium">{formatDate(abonnement.dateDebut)}</p>
            </div>
            {abonnement.dateExpiration && (
              <div>
                <p className="text-sm text-muted-foreground">Expiration</p>
                <p className="font-medium">{formatDate(abonnement.dateExpiration)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {abonnement.reference && (
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="font-medium font-mono">{abonnement.reference}</p>
              </div>
            )}
            {abonnement.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{abonnement.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Échéances */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des échéances</CardTitle>
          <CardDescription>Paiements et justificatifs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date échéance</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead>Justificatif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnement.echeances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune échéance
                  </TableCell>
                </TableRow>
              ) : (
                abonnement.echeances.map((echeance) => {
                  const echeanceStatut = ECHEANCE_STATUTS[echeance.statut] || ECHEANCE_STATUTS.a_payer;
                  return (
                    <TableRow key={echeance.id}>
                      <TableCell>{formatDate(echeance.dateEcheance)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(echeance.montant)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${echeanceStatut.color} text-white`}>
                          {echeanceStatut.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {echeance.datePaiement ? formatDate(echeance.datePaiement) : '-'}
                      </TableCell>
                      <TableCell>
                        {echeance.documentPath ? (
                          <div className="flex items-center gap-1">
                            <a 
                              href={echeance.documentPath} 
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
                              onClick={() => handleDocumentDelete(echeance.id)}
                              disabled={uploadingDoc === echeance.id}
                            >
                              {uploadingDoc === echeance.id ? (
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
                                if (file) handleDocumentUpload(echeance.id, file);
                                e.target.value = '';
                              }}
                              disabled={uploadingDoc === echeance.id}
                            />
                            <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
                              <span>
                                {uploadingDoc === echeance.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                              </span>
                            </Button>
                          </label>
                        )}
                      </TableCell>
                      <TableCell>
                        {echeance.statut !== 'paye' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(echeance)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Payer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentDialog && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Échéance du</p>
                <p className="text-lg font-bold">{formatDate(paymentDialog.dateEcheance)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Montant payé (FCFA)</Label>
              <MoneyInput
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Justificatif (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {paymentFile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPaymentFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={handlePayment}
              disabled={processingPayment || !paymentAmount}
              className="w-full"
            >
              {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer le paiement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'abonnement {abonnement.nom} et toutes ses échéances seront supprimés.
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
