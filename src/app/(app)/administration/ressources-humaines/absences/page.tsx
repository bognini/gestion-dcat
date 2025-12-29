'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  Upload,
  FileText,
  X,
  Loader2
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
import { formatDate } from '@/lib/utils';

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
}

interface Absence {
  id: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  motif: string | null;
  statut: string;
  commentaire: string | null;
  documentPath: string | null;
  documentName: string | null;
  createdAt: string;
  employe: Employe;
}

const TYPES_ABSENCE: Record<string, { label: string; color: string }> = {
  conge_paye: { label: 'Congé payé', color: 'bg-blue-500' },
  conge_sans_solde: { label: 'Congé sans solde', color: 'bg-gray-500' },
  permission: { label: 'Permission', color: 'bg-indigo-500' },
  maladie: { label: 'Maladie', color: 'bg-orange-500' },
  maternite: { label: 'Maternité', color: 'bg-pink-500' },
};

const STATUTS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  en_attente: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  approuve: { label: 'Approuvé', icon: CheckCircle, color: 'bg-green-500' },
  refuse: { label: 'Refusé', icon: XCircle, color: 'bg-red-500' },
};

export default function AbsencesPage() {
  const { toast } = useToast();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    absenceId: string;
    action: 'approuve' | 'refuse' | 'delete';
    employeNom: string;
    type: string;
  } | null>(null);

  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDocumentUpload = async (absenceId: string, file: File) => {
    setUploadingDoc(absenceId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/absences/${absenceId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Justificatif ajouté' });
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDelete = async (absenceId: string) => {
    setUploadingDoc(absenceId);
    try {
      const res = await fetch(`/api/absences/${absenceId}/document`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Justificatif supprimé' });
        fetchData();
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/absences');
      if (res.ok) setAbsences(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (absence: Absence, action: 'approuve' | 'refuse' | 'delete') => {
    const typeConfig = TYPES_ABSENCE[absence.type] || { label: absence.type };
    setConfirmDialog({
      open: true,
      absenceId: absence.id,
      action,
      employeNom: `${absence.employe.prenom} ${absence.employe.nom}`,
      type: typeConfig.label,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    try {
      if (confirmDialog.action === 'delete') {
        const res = await fetch(`/api/absences/${confirmDialog.absenceId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setAbsences(absences.filter(a => a.id !== confirmDialog.absenceId));
          toast({ title: 'Demande supprimée' });
        }
      } else {
        const res = await fetch(`/api/absences/${confirmDialog.absenceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: confirmDialog.action }),
        });

        if (res.ok) {
          const updated = await res.json();
          setAbsences(absences.map(a => a.id === confirmDialog.absenceId ? updated : a));
          toast({ title: `Demande ${confirmDialog.action === 'approuve' ? 'approuvée' : 'refusée'}` });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setConfirmDialog(null);
    }
  };

  const filteredAbsences = absences.filter((a) => {
    const matchesSearch = 
      `${a.employe.prenom} ${a.employe.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Gestion des Absences
          </h2>
          <p className="text-muted-foreground">
            Validation des demandes de congés et permissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
          <Info className="h-4 w-4" />
          Les employés soumettent leurs demandes depuis leur profil
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {absences.filter(a => a.statut === 'en_attente').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approuvées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {absences.filter(a => a.statut === 'approuve').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Refusées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {absences.filter(a => a.statut === 'refuse').length}
            </div>
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
            {Object.entries(STATUTS).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Justificatif</TableHead>
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
            ) : filteredAbsences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune demande d&apos;absence
                </TableCell>
              </TableRow>
            ) : (
              filteredAbsences.map((absence) => {
                const typeConfig = TYPES_ABSENCE[absence.type] || { label: absence.type, color: 'bg-gray-500' };
                const statutConfig = STATUTS[absence.statut] || STATUTS.en_attente;
                const StatutIcon = statutConfig.icon;
                return (
                  <TableRow key={absence.id}>
                    <TableCell>
                      <Link 
                        href={`/administration/ressources-humaines/employes/${absence.employe.id}`}
                        className="font-medium hover:underline"
                      >
                        {absence.employe.prenom} {absence.employe.nom}
                      </Link>
                      <p className="text-xs text-muted-foreground">{absence.employe.poste}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${typeConfig.color} text-white`}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p>{formatDate(absence.dateDebut)}</p>
                      <p className="text-xs text-muted-foreground">→ {formatDate(absence.dateFin)}</p>
                    </TableCell>
                    <TableCell>{getDuration(absence.dateDebut, absence.dateFin)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {absence.motif || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statutConfig.color} text-white gap-1`}>
                        <StatutIcon className="h-3 w-3" />
                        {statutConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {absence.documentPath ? (
                        <div className="flex items-center gap-1">
                          <a 
                            href={absence.documentPath} 
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
                            onClick={() => handleDocumentDelete(absence.id)}
                            disabled={uploadingDoc === absence.id}
                          >
                            {uploadingDoc === absence.id ? (
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
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(absence.id, file);
                              e.target.value = '';
                            }}
                            disabled={uploadingDoc === absence.id}
                          />
                          <Button size="sm" variant="ghost" className="h-6 px-2" asChild disabled={uploadingDoc === absence.id}>
                            <span>
                              {uploadingDoc === absence.id ? (
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
                        {absence.statut === 'en_attente' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => openConfirmDialog(absence, 'approuve')}
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => openConfirmDialog(absence, 'refuse')}
                              title="Refuser"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => openConfirmDialog(absence, 'delete')}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approuve' ? 'Approuver' : 
               confirmDialog?.action === 'refuse' ? 'Refuser' : 'Supprimer'} la demande ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'delete' ? (
                <>
                  Vous êtes sur le point de supprimer définitivement la demande 
                  de {confirmDialog?.type?.toLowerCase()} de <strong>{confirmDialog?.employeNom}</strong>.
                  Cette action est irréversible.
                </>
              ) : (
                <>
                  Vous êtes sur le point de {confirmDialog?.action === 'approuve' ? 'approuver' : 'refuser'} la demande 
                  de {confirmDialog?.type?.toLowerCase()} de <strong>{confirmDialog?.employeNom}</strong>.
                  {confirmDialog?.action === 'refuse' && ' L\'employé sera notifié du refus.'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={
                confirmDialog?.action === 'approuve' ? 'bg-green-600 hover:bg-green-700' : 
                'bg-destructive hover:bg-destructive/90'
              }
            >
              {confirmDialog?.action === 'approuve' ? 'Approuver' : 
               confirmDialog?.action === 'refuse' ? 'Refuser' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
