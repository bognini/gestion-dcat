'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FilePlus2, 
  Search, 
  Download, 
  Eye, 
  Pencil, 
  Trash2,
  FileCheck,
  Clock,
  XCircle,
  CheckCircle,
  MoreHorizontal
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

interface Devis {
  id: string;
  reference: string;
  date: string;
  clientNom: string;
  objet: string;
  totalHT: number;
  statut: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  brouillon: { label: 'Brouillon', variant: 'secondary', icon: Clock },
  envoye: { label: 'Envoyé', variant: 'default', icon: FileCheck },
  accepte: { label: 'Accepté', variant: 'default', icon: CheckCircle },
  refuse: { label: 'Refusé', variant: 'destructive', icon: XCircle },
  expire: { label: 'Expiré', variant: 'outline', icon: Clock },
};

export default function DevisListPage() {
  const { toast } = useToast();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null);

  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
    try {
      const res = await fetch('/api/devis');
      if (res.ok) {
        const data = await res.json();
        setDevisList(data);
      }
    } catch (error) {
      console.error('Error fetching devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!devisToDelete) return;
    try {
      const res = await fetch(`/api/devis/${devisToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDevisList(devisList.filter(d => d.id !== devisToDelete.id));
        toast({ title: 'Devis supprimé' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    } finally {
      setDevisToDelete(null);
    }
  };

  const handleDownloadPDF = (devis: Devis) => {
    window.open(`/api/devis/${devis.id}/pdf`, '_blank');
  };

  const filteredDevis = devisList.filter((devis) => {
    const matchesSearch = 
      devis.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devis.clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devis.objet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || devis.statut === statusFilter;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Devis</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos devis clients
          </p>
        </div>
        <Button asChild>
          <Link href="/administration/finance-comptabilite/devis/nouveau">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nouveau Devis
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devisList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {devisList.filter(d => d.statut === 'envoye').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devisList.filter(d => d.statut === 'accepte').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant total HT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(devisList.reduce((sum, d) => sum + d.totalHT, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, client ou objet..."
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
            <SelectItem value="envoye">Envoyé</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
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
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredDevis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Aucun devis trouvé avec ces critères'
                    : 'Aucun devis créé. Cliquez sur "Nouveau Devis" pour commencer.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDevis.map((devis) => (
                <TableRow key={devis.id}>
                  <TableCell>
                      <Link 
                        href={`/administration/finance-comptabilite/devis/${devis.id}`}
                        className="font-mono font-medium text-blue-600 hover:underline"
                      >
                        {devis.reference}
                      </Link>
                    </TableCell>
                  <TableCell>{formatDate(devis.date)}</TableCell>
                  <TableCell className="font-medium">{devis.clientNom}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{devis.objet}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(devis.totalHT)}</TableCell>
                  <TableCell>{getStatusBadge(devis.statut)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/administration/finance-comptabilite/devis/${devis.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/administration/finance-comptabilite/devis/${devis.id}/modifier`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(devis)}>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDevisToDelete(devis)}
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
      <AlertDialog open={!!devisToDelete} onOpenChange={(open) => !open && setDevisToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {devisToDelete?.reference} sera définitivement supprimé.
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
