'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Package,
  User,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Upload,
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Commande {
  id: string;
  reference: string;
  date: string;
  statut: string;
  totalHT: number;
  totalTTC: number;
  modePaiement: string | null;
  adresseLivraison: string | null;
  notes: string | null;
  documentPath: string | null;
  documentName: string | null;
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    telephone: string;
    email: string | null;
  };
  lignes: Array<{
    id: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    montant: number;
    produit: {
      id: string;
      nom: string;
      sku: string | null;
    } | null;
  }>;
  createdAt: string;
}

const STATUTS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  confirmee: { label: 'Confirmée', color: 'bg-blue-500', icon: CheckCircle2 },
  en_preparation: { label: 'En préparation', color: 'bg-orange-500', icon: Package },
  expediee: { label: 'Expédiée', color: 'bg-purple-500', icon: Truck },
  livree: { label: 'Livrée', color: 'bg-green-500', icon: CheckCircle2 },
  annulee: { label: 'Annulée', color: 'bg-red-500', icon: XCircle },
};

const MODES_PAIEMENT: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  carte: 'Carte bancaire',
};

export default function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [creatingFacture, setCreatingFacture] = useState(false);
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/emarket/commandes/${id}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Document ajouté' });
        fetchCommande();
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
      const res = await fetch(`/api/emarket/commandes/${id}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document supprimé' });
        fetchCommande();
      } else {
        toast({ variant: 'destructive', title: 'Erreur' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(false);
    }
  };

  useEffect(() => {
    fetchCommande();
  }, [id]);

  const fetchCommande = async () => {
    try {
      const res = await fetch(`/api/emarket/commandes/${id}`);
      if (res.ok) {
        setCommande(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Commande non trouvée' });
        router.push('/marketing/emarket');
      }
    } catch (error) {
      console.error('Error fetching commande:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/emarket/commandes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (res.ok) {
        setCommande(prev => prev ? { ...prev, statut: newStatus } : null);
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
      const res = await fetch(`/api/emarket/commandes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Commande supprimée' });
        router.push('/marketing/emarket');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    }
  };

  const canCreateFacture = !!commande && commande.statut !== 'en_attente' && commande.statut !== 'annulee';

  const handleCreateFacture = async () => {
    setCreatingFacture(true);
    try {
      const res = await fetch(`/api/emarket/commandes/${id}/facture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast({
        title: data.alreadyExists ? 'Facture déjà créée' : 'Facture créée',
        description: data.alreadyExists ? 'Redirection vers la facture existante' : 'Redirection vers la facture',
      });
      setFactureDialogOpen(false);
      router.push(`/administration/finance-comptabilite/factures/${data.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
      });
    } finally {
      setCreatingFacture(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!commande) return null;

  const statusInfo = STATUTS[commande.statut as keyof typeof STATUTS] || STATUTS.en_attente;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/marketing/emarket">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                {commande.reference}
              </h2>
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Créée le {formatDate(commande.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFactureDialogOpen(true)}
            disabled={!canCreateFacture || creatingFacture}
          >
            {creatingFacture ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="mr-2 h-4 w-4" />
            )}
            Créer une facture
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/marketing/emarket/commandes/${id}/modifier`}>
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
              <User className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">
                {commande.client.prenom ? `${commande.client.prenom} ` : ''}{commande.client.nom}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{commande.client.telephone}</span>
            </div>
            {commande.client.email && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{commande.client.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paiement & Statut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Statut</p>
              <Select
                value={commande.statut}
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
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode de paiement</p>
              <p className="font-medium">
                {commande.modePaiement 
                  ? MODES_PAIEMENT[commande.modePaiement] || commande.modePaiement 
                  : 'Non spécifié'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(commande.totalTTC)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {commande.lignes.length} article{commande.lignes.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Address */}
      {commande.adresseLivraison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{commande.adresseLivraison}</p>
          </CardContent>
        </Card>
      )}

      {/* Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document joint
          </CardTitle>
          <CardDescription>Bon de commande ou justificatif</CardDescription>
        </CardHeader>
        <CardContent>
          {commande.documentPath ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{commande.documentName}</p>
                  <a 
                    href={commande.documentPath} 
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
              <p className="text-sm text-muted-foreground mb-3">Aucun document joint</p>
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

      {/* Order Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles commandés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commande.lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell>
                    <p className="font-medium">{ligne.designation}</p>
                    {ligne.produit?.sku && (
                      <p className="text-xs text-muted-foreground font-mono">{ligne.produit.sku}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{ligne.quantite}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(ligne.montant)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(commande.totalTTC)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {commande.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted p-3 rounded">{commande.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La commande {commande.reference} sera définitivement supprimée.
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

      <AlertDialog open={factureDialogOpen} onOpenChange={setFactureDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer une facture à partir de cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une facture brouillon sera créée avec les lignes de la commande {commande.reference}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingFacture}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateFacture} disabled={creatingFacture}>
              {creatingFacture ? 'Création...' : 'Créer la facture'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
