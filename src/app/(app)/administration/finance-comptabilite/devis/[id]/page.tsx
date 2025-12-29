'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  MapPin
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DevisLigne {
  id: string;
  ordre: number;
  reference: string;
  designation: string;
  details: string | null;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
  produit: { id: string; nom: string; sku: string } | null;
}

interface Devis {
  id: string;
  reference: string;
  date: string;
  objet: string;
  clientType: string;
  clientNom: string;
  clientAdresse: string | null;
  clientVille: string | null;
  clientPays: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  delaiLivraison: string | null;
  conditionLivraison: string | null;
  validiteOffre: number;
  garantie: string | null;
  totalHT: number;
  totalTTC: number;
  statut: string;
  lignes: DevisLigne[];
  createdBy: { id: string; nom: string; prenom: string | null } | null;
  createdAt: string;
}

const STATUTS = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  envoye: { label: 'Envoyé', color: 'bg-blue-500', icon: Send },
  accepte: { label: 'Accepté', color: 'bg-green-500', icon: CheckCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500', icon: XCircle },
  expire: { label: 'Expiré', color: 'bg-orange-500', icon: Clock },
};

export default function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchDevis();
  }, [id]);

  const fetchDevis = async () => {
    try {
      const res = await fetch(`/api/devis/${id}`);
      if (res.ok) {
        setDevis(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Devis non trouvé' });
        router.push('/administration/finance-comptabilite/devis');
      }
    } catch (error) {
      console.error('Error fetching devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...devis, statut: newStatus }),
      });
      if (res.ok) {
        setDevis(prev => prev ? { ...prev, statut: newStatus } : null);
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
      const res = await fetch(`/api/devis/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Devis supprimé' });
        router.push('/administration/finance-comptabilite/devis');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    }
  };

  const handleDownloadPDF = () => {
    // Open PDF in new tab for print/save
    window.open(`/api/devis/${id}/pdf`, '_blank');
  };

  const handleConvertToFacture = async () => {
    if (!devis || devis.statut !== 'accepte') {
      toast({ variant: 'destructive', title: 'Le devis doit être accepté pour être converti en facture' });
      return;
    }
    setConverting(true);
    try {
      const res = await fetch(`/api/devis/${id}/convert-to-facture`, {
        method: 'POST',
      });
      if (res.ok) {
        const facture = await res.json();
        toast({ title: 'Facture créée avec succès' });
        router.push(`/administration/finance-comptabilite/factures/${facture.id}`);
      } else {
        const error = await res.json();
        toast({ variant: 'destructive', title: 'Erreur', description: error.error || 'Impossible de convertir le devis' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la conversion' });
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!devis) return null;

  const statusInfo = STATUTS[devis.statut as keyof typeof STATUTS] || STATUTS.brouillon;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administration/finance-comptabilite/devis">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Devis {devis.reference}
              </h2>
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Créé le {formatDate(devis.createdAt)}
              {devis.createdBy && ` par ${devis.createdBy.prenom || ''} ${devis.createdBy.nom}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {devis.statut === 'accepte' && (
            <Button onClick={handleConvertToFacture} disabled={converting} className="bg-green-600 hover:bg-green-700">
              {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Convertir en Facture
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/administration/finance-comptabilite/devis/${id}/modifier`}>
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
              {devis.clientType === 'entreprise' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-lg">{devis.clientNom}</p>
            {devis.clientAdresse && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {devis.clientAdresse}
                  {devis.clientVille && `, ${devis.clientVille}`}
                  {devis.clientPays && ` - ${devis.clientPays}`}
                </span>
              </div>
            )}
            {devis.clientTelephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{devis.clientTelephone}</span>
              </div>
            )}
            {devis.clientEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{devis.clientEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Statut & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Statut</p>
              <Select
                value={devis.statut}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Validité</p>
                <p className="font-medium">{devis.validiteOffre} jours</p>
              </div>
              <div>
                <p className="text-muted-foreground">Garantie</p>
                <p className="font-medium">{devis.garantie || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Délai livraison</p>
                <p className="font-medium">{devis.delaiLivraison || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Condition</p>
                <p className="font-medium">{devis.conditionLivraison || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(devis.totalTTC)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Objet */}
      <Card>
        <CardHeader>
          <CardTitle>Objet du devis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{devis.objet}</p>
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
                <TableHead className="w-32 whitespace-nowrap">REF.</TableHead>
                <TableHead>DESIGNATION</TableHead>
                <TableHead className="text-center w-20">QTE</TableHead>
                <TableHead className="text-center w-16">Unité</TableHead>
                <TableHead className="text-right w-36">P.U</TableHead>
                <TableHead className="text-right w-40">MONTANT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devis.lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{ligne.reference}</TableCell>
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
              <TableRow className="bg-blue-600 text-white hover:bg-blue-600">
                <TableCell colSpan={5} className="text-right font-bold">
                  TOTAL GENERAL HT
                </TableCell>
                <TableCell className="text-right font-bold text-lg whitespace-nowrap">
                  {formatCurrency(devis.totalHT)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {devis.reference} sera définitivement supprimé.
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
