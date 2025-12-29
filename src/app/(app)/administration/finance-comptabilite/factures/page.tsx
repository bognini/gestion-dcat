'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Search, 
  Download, 
  Eye, 
  Pencil, 
  Trash2,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  MoreHorizontal,
  FilePlus2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatDate, formatCurrency } from '@/lib/utils';

interface Facture {
  id: string;
  reference: string;
  date: string;
  dateEcheance: string | null;
  clientNom: string;
  objet: string | null;
  totalHT: number;
  totalTTC: number;
  montantPaye: number;
  resteAPayer: number;
  statut: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  brouillon: { label: 'Brouillon', variant: 'secondary', icon: Clock },
  envoyee: { label: 'Envoyée', variant: 'default', icon: Send },
  payee_partiellement: { label: 'Partielle', variant: 'outline', icon: AlertCircle },
  payee: { label: 'Payée', variant: 'default', icon: CheckCircle },
  annulee: { label: 'Annulée', variant: 'destructive', icon: AlertCircle },
};

export default function FacturesListPage() {
  const { toast } = useToast();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [factureToDelete, setFactureToDelete] = useState<Facture | null>(null);

  useEffect(() => {
    fetchFactures();
  }, []);

  const fetchFactures = async () => {
    try {
      const res = await fetch('/api/factures');
      if (res.ok) {
        setFactures(await res.json());
      }
    } catch (error) {
      console.error('Error fetching factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!factureToDelete) return;
    try {
      const res = await fetch(`/api/factures/${factureToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setFactures(factures.filter(f => f.id !== factureToDelete.id));
        toast({ title: 'Facture supprimée' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    } finally {
      setFactureToDelete(null);
    }
  };

  const filteredFactures = factures.filter((f) => {
    const matchesSearch = 
      f.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.objet?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || f.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statut: string) => {
    const config = statusConfig[statut] || statusConfig.brouillon;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const totalImpaye = factures.reduce((sum, f) => sum + f.resteAPayer, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Factures</h2>
          <p className="text-muted-foreground">
            Créez et suivez vos factures clients
          </p>
        </div>
        <Button asChild>
          <Link href="/administration/finance-comptabilite/factures/nouvelle">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nouvelle Facture
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factures.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {factures.filter(f => f.statut === 'envoyee').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaye)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reste à encaisser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalImpaye)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="envoyee">Envoyée</SelectItem>
            <SelectItem value="payee_partiellement">Paiement partiel</SelectItem>
            <SelectItem value="payee">Payée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead className="text-right">Payé</TableHead>
              <TableHead className="text-right">Reste</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredFactures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Aucune facture trouvée'
                    : 'Aucune facture créée. Cliquez sur "Nouvelle Facture" pour commencer.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFactures.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell className="font-mono font-medium">
                    <Link href={`/administration/finance-comptabilite/factures/${facture.id}`} className="hover:underline">
                      {facture.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(facture.date)}</TableCell>
                  <TableCell className="font-medium">{facture.clientNom}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(facture.totalTTC)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(facture.montantPaye)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(facture.resteAPayer)}</TableCell>
                  <TableCell>{getStatusBadge(facture.statut)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/administration/finance-comptabilite/factures/${facture.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/administration/finance-comptabilite/factures/${facture.id}/modifier`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setFactureToDelete(facture)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!factureToDelete} onOpenChange={(open) => !open && setFactureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture {factureToDelete?.reference} et tous ses paiements seront supprimés.
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
