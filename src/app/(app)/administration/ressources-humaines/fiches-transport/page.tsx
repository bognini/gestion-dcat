'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Search,
  Clock,
  CheckCircle,
  Info,
  Trash2
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

interface Partenaire {
  id: string;
  nom: string;
}

interface LigneTransport {
  id: string;
  depart: string;
  arrivee: string;
  typeClient: string;
  partenaireId: string | null;
  partenaire: Partenaire | null;
  particulierNom: string | null;
  cout: number;
}

interface FicheTransport {
  id: string;
  date: string;
  totalCout: number;
  statut: string;
  commentaire: string | null;
  lignes: LigneTransport[];
  employe: {
    id: string;
    nom: string;
    prenom: string;
    poste: string;
  };
}

export default function FichesTransportPage() {
  const { toast } = useToast();
  const [fiches, setFiches] = useState<FicheTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    ficheId: string;
    employeNom: string;
    montant: number;
    action: 'paye' | 'delete';
  } | null>(null);

  useEffect(() => {
    fetchFiches();
  }, []);

  const fetchFiches = async () => {
    try {
      const res = await fetch('/api/fiches-transport');
      if (res.ok) setFiches(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (fiche: FicheTransport, action: 'paye' | 'delete') => {
    setConfirmDialog({
      open: true,
      ficheId: fiche.id,
      employeNom: `${fiche.employe.prenom} ${fiche.employe.nom}`,
      montant: fiche.totalCout,
      action,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    try {
      if (confirmDialog.action === 'delete') {
        const res = await fetch(`/api/fiches-transport/${confirmDialog.ficheId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setFiches(fiches.filter(f => f.id !== confirmDialog.ficheId));
          toast({ title: 'Fiche supprimée' });
        }
      } else {
        const res = await fetch(`/api/fiches-transport/${confirmDialog.ficheId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: 'paye' }),
        });
        if (res.ok) {
          const updated = await res.json();
          setFiches(fiches.map(f => f.id === confirmDialog.ficheId ? updated : f));
          toast({ title: 'Fiche marquée comme payée' });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setConfirmDialog(null);
    }
  };

  const filteredFiches = fiches.filter((f) => {
    const matchesSearch = 
      `${f.employe.prenom} ${f.employe.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalImpaye = fiches.filter(f => f.statut === 'impaye').reduce((sum, f) => sum + f.totalCout, 0);
  const totalPaye = fiches.filter(f => f.statut === 'paye').reduce((sum, f) => sum + f.totalCout, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-6 w-6" />
            Fiches de Transport
          </h2>
          <p className="text-muted-foreground">
            Gestion des frais de déplacement des employés
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
          <Info className="h-4 w-4" />
          Les employés soumettent leurs fiches depuis leur profil
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalImpaye)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiches.filter(f => f.statut === 'impaye').length} fiche(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaye)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiches.filter(f => f.statut === 'paye').length} fiche(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalImpaye + totalPaye)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiches.length} fiche(s) au total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par employé..."
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
            <SelectItem value="impaye">Impayé</SelectItem>
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
              <TableHead>Date</TableHead>
              <TableHead>Trajets</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredFiches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune fiche de transport
                </TableCell>
              </TableRow>
            ) : (
              filteredFiches.map((fiche) => (
                <TableRow key={fiche.id}>
                  <TableCell>
                    <Link 
                      href={`/administration/ressources-humaines/employes/${fiche.employe.id}`}
                      className="font-medium hover:underline"
                    >
                      {fiche.employe.prenom} {fiche.employe.nom}
                    </Link>
                    <p className="text-xs text-muted-foreground">{fiche.employe.poste}</p>
                  </TableCell>
                  <TableCell>{formatDate(fiche.date)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {fiche.lignes.slice(0, 2).map((l, i) => (
                        <div key={i} className="text-sm">
                          {l.depart} → {l.arrivee}
                          <span className="text-muted-foreground ml-1">({l.typeClient})</span>
                          <span className="text-xs font-medium whitespace-nowrap ml-3">{formatCurrency(l.cout)}</span>
                        </div>
                      ))}
                      {fiche.lignes.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{fiche.lignes.length - 2} autre(s)
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(fiche.totalCout)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fiche.statut === 'paye' ? 'default' : 'secondary'}>
                      {fiche.statut === 'paye' ? 'Payé' : 'Impayé'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {fiche.statut === 'impaye' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => openConfirmDialog(fiche, 'paye')}
                          title="Marquer comme payé"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => openConfirmDialog(fiche, 'delete')}
                        title="Supprimer"
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'delete' ? 'Supprimer la fiche ?' : 'Confirmer le paiement ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'delete' ? (
                <>
                  Vous êtes sur le point de supprimer définitivement la fiche de transport 
                  de <strong>{confirmDialog?.employeNom}</strong> d&apos;un montant 
                  de <strong>{confirmDialog && formatCurrency(confirmDialog.montant)}</strong>.
                  Cette action est irréversible.
                </>
              ) : (
                <>
                  Vous êtes sur le point de marquer comme payée la fiche de transport 
                  de <strong>{confirmDialog?.employeNom}</strong> d&apos;un montant 
                  de <strong>{confirmDialog && formatCurrency(confirmDialog.montant)}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={confirmDialog?.action === 'delete' ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {confirmDialog?.action === 'delete' ? 'Supprimer' : 'Confirmer le paiement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
