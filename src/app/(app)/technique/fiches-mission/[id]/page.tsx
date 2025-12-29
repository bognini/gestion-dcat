'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Printer,
  MapPin,
  Calendar,
  Users,
  Target,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ListTodo, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

interface TacheMission {
  id: string;
  intitule: string;
  statut: string;
  dureeMinutes: number | null;
  responsable: { id: string; nom: string; prenom: string } | null;
}

interface Participant {
  id: string;
  utilisateur: {
    id: string;
    nom: string;
    prenom: string | null;
  };
  role: string | null;
  perDiem: number | null;
}

interface FicheMission {
  id: string;
  reference: string;
  titre: string;
  description: string | null;
  projet: { id: string; nom: string } | null;
  destination: string;
  dateDepart: string;
  dateRetour: string | null;
  statut: string;
  budget: number | null;
  depensesReelles: number | null;
  objectifs: string | null;
  notes: string | null;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planifiee: { label: 'Planifiée', color: 'bg-blue-500', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-orange-500', icon: PlayCircle },
  terminee: { label: 'Terminée', color: 'bg-green-500', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-gray-500', icon: XCircle },
};

export default function FicheMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [mission, setMission] = useState<FicheMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Tasks
  const [taches, setTaches] = useState<TacheMission[]>([]);
  const [tacheDialog, setTacheDialog] = useState(false);
  const [newTache, setNewTache] = useState({ intitule: '', dureeMinutes: '', responsableId: '' });
  const [savingTache, setSavingTache] = useState(false);
  const [utilisateurs, setUtilisateurs] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);

  useEffect(() => {
    fetchMission();
    fetchTaches();
    fetchUtilisateurs();
  }, [id]);

  const fetchTaches = async () => {
    try {
      const res = await fetch(`/api/missions/${id}/taches`);
      if (res.ok) setTaches(await res.json());
    } catch (error) {
      console.error('Error fetching taches:', error);
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch('/api/utilisateurs');
      if (res.ok) setUtilisateurs(await res.json());
    } catch (error) {
      console.error('Error fetching utilisateurs:', error);
    }
  };

  const handleCreateTache = async () => {
    if (!newTache.intitule.trim()) return;
    setSavingTache(true);
    try {
      const res = await fetch(`/api/missions/${id}/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intitule: newTache.intitule,
          dureeMinutes: newTache.dureeMinutes ? parseInt(newTache.dureeMinutes) : null,
          responsableId: newTache.responsableId || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Tâche créée' });
        fetchTaches();
        setTacheDialog(false);
        setNewTache({ intitule: '', dureeMinutes: '', responsableId: '' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingTache(false);
    }
  };

  const handleUpdateTacheStatus = async (tacheId: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/missions/${id}/taches/${tacheId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        fetchTaches();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const fetchMission = async () => {
    try {
      const res = await fetch(`/api/missions/${id}`);
      if (res.ok) {
        setMission(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Mission non trouvée' });
        router.push('/technique/fiches-mission');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/missions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Mission supprimée' });
        router.push('/technique/fiches-mission');
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
    setDeleteDialogOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!mission) return null;

  const statutConfig = STATUTS[mission.statut] || STATUTS.planifiee;
  const StatutIcon = statutConfig.icon;

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            margin: 15mm 15mm 25mm 15mm;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            padding: 10px 15mm;
            background: white;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>

      <div className="hidden print:block">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <div className="text-xl font-bold">Fiche de mission</div>
            <div className="text-sm text-muted-foreground">{mission.titre}</div>
          </div>
          <div className="text-right text-sm">
            <div className="whitespace-nowrap font-mono">
              Référence: {mission.reference} • Budget: {mission.budget ? formatCurrency(mission.budget) : '-'}
            </div>
            <div className="whitespace-nowrap text-muted-foreground">
              Départ: {formatDate(mission.dateDepart)}
              {mission.dateRetour ? ` • Retour: ${formatDate(mission.dateRetour)}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/technique/fiches-mission">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                {mission.reference}
              </h2>
              <Badge className={`${statutConfig.color} text-white`}>
                <StatutIcon className="h-3 w-3 mr-1" />
                {statutConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{mission.titre}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/technique/fiches-mission/${id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-medium">{mission.destination}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Période</p>
                <p className="font-medium">
                  {formatDate(mission.dateDepart)}
                  {mission.dateRetour && ` - ${formatDate(mission.dateRetour)}`}
                </p>
              </div>
            </div>
            {mission.projet && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Projet associé</p>
                  <p className="font-medium">{mission.projet.nom}</p>
                </div>
              </div>
            )}
            {mission.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{mission.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Budget prévu</p>
                <p className="text-xl font-bold whitespace-nowrap">
                  {mission.budget ? formatCurrency(mission.budget) : '-'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Dépenses réelles</p>
                <p className="text-xl font-bold whitespace-nowrap">
                  {mission.depensesReelles ? formatCurrency(mission.depensesReelles) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({mission.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mission.participants.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun participant</p>
            ) : (
              <div className="space-y-2">
                {mission.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="font-medium">
                      {[p.utilisateur.prenom, p.utilisateur.nom].filter(Boolean).join(' ')}
                    </span>
                    {p.perDiem && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Per diem: {formatCurrency(p.perDiem)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mission.objectifs && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Objectifs</p>
                <p className="text-sm whitespace-pre-wrap">{mission.objectifs}</p>
              </div>
            )}
            {mission.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{mission.notes}</p>
              </div>
            )}
            {!mission.objectifs && !mission.notes && (
              <p className="text-muted-foreground text-sm">Aucun objectif ni note</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Tâches ({taches.length})
              </CardTitle>
              <Button size="sm" onClick={() => setTacheDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {taches.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucune tâche. Cliquez sur "Ajouter" pour créer une tâche.
              </p>
            ) : (
              <div className="space-y-2">
                {taches.map((tache) => {
                  const TACHE_STATUTS: Record<string, { label: string; color: string }> = {
                    a_faire: { label: 'À faire', color: 'bg-gray-500' },
                    en_cours: { label: 'En cours', color: 'bg-blue-500' },
                    termine: { label: 'Terminé', color: 'bg-green-500' },
                  };
                  const statutInfo = TACHE_STATUTS[tache.statut] || TACHE_STATUTS.a_faire;
                  return (
                    <div key={tache.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={tache.statut === 'termine'}
                          onChange={() => handleUpdateTacheStatus(tache.id, tache.statut === 'termine' ? 'a_faire' : 'termine')}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className={`font-medium ${tache.statut === 'termine' ? 'line-through text-muted-foreground' : ''}`}>
                            {tache.intitule}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {tache.responsable && (
                              <span>{tache.responsable.prenom} {tache.responsable.nom}</span>
                            )}
                            {tache.dureeMinutes && (
                              <span>• {Math.floor(tache.dureeMinutes / 60)}h{tache.dureeMinutes % 60 > 0 ? `${tache.dureeMinutes % 60}min` : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${statutInfo.color} text-white text-xs`}>
                        {statutInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Dialog */}
      <Dialog open={tacheDialog} onOpenChange={setTacheDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intitulé *</Label>
              <Input
                value={newTache.intitule}
                onChange={(e) => setNewTache({ ...newTache, intitule: e.target.value })}
                placeholder="Ex: Préparer le matériel"
              />
            </div>
            <div className="space-y-2">
              <Label>Durée estimée (minutes)</Label>
              <Input
                type="number"
                value={newTache.dureeMinutes}
                onChange={(e) => setNewTache({ ...newTache, dureeMinutes: e.target.value })}
                placeholder="Ex: 60 pour 1 heure"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={newTache.responsableId}
                onChange={(e) => setNewTache({ ...newTache, responsableId: e.target.value })}
              >
                <option value="">Non assigné</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleCreateTache}
              disabled={savingTache || !newTache.intitule.trim()}
              className="w-full"
            >
              {savingTache && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la tâche
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette mission ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La mission {mission.reference} sera définitivement supprimée.
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

      <div className="hidden print:block print-footer">
        <div>DCAT (Data Communications & All Technologies) • E-Mail : info@dcat.ci • Site Web : www.dcat.ci</div>
        <div style={{ marginTop: 4 }}>S.A.R.L. au Capital de 10.000.000 FCFA • R.C. N° CI-ABJ-2004-B-4038 • C.C. N° 0411512 K • Régime d'imposition : Réel Normal • Centre d'imposition : D.G.E.</div>
        <div style={{ marginTop: 4 }}>Compte GTBANK N°CI007 01030 059262300100 RIB=65 • Angré Château, Imm.BATIM, 1er Etage, Porte A108 - 27 B.P 826 Abidjan 27 • Tél.: (+225) 27 21 37 33 63 / 27 22 46 82 07</div>
      </div>
    </div>
  );
}
