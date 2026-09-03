'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket as TicketIcon,
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  Wrench,
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
  Send,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDuration } from '@/lib/utils';
import { modeSignalementLabel } from '@/lib/tickets';
import { TicketStatutBadge } from '@/components/tickets/ticket-statut-badge';

interface Personne {
  id: string;
  nom: string;
  prenom: string | null;
}

interface Ticket {
  id: string;
  numero: string;
  incident: string;
  dateSignalement: string;
  signaleParNom: string;
  signaleParPrenoms: string | null;
  modeSignalement: string;
  statut: string;
  mailSupportEnvoye: boolean;
  mailSupportAt: string | null;
  fermeAt: string | null;
  createdAt: string;
  partenaire: { id: string; nom: string };
  recuPar: Personne;
  priseEnChargePar: Personne | null;
  createdBy: Personne;
  interventions: Array<{
    id: string;
    reference: string | null;
    date: string;
    statut: string;
    typeMaintenance: string;
    dureeMinutes: number | null;
    intervenants: Array<{ utilisateur: Personne }>;
  }>;
}

const INTERVENTION_STATUTS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente: 'En attente',
  termine: 'Terminé',
};

const name = (p: Personne | null | undefined) => (p ? [p.prenom, p.nom].filter(Boolean).join(' ') : '-');

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, meRes] = await Promise.all([fetch(`/api/tickets/${id}`), fetch('/api/auth/me')]);
      if (!res.ok) throw new Error();
      setTicket(await res.json());
      if (meRes.ok) {
        const me = await meRes.json();
        setIsAdmin((me?.user?.role || me?.role) === 'admin');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Ticket introuvable' });
      router.push('/technique/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const resendMail = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}/resend-mail`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Erreur');
      toast({ title: 'Mail envoyé', description: `Support DCAT notifié (${body.sent} destinataire(s))` });
      load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Envoi impossible', description: error instanceof Error ? error.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'en_cours' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Erreur');
      toast({ title: 'Ticket réouvert' });
      load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error instanceof Error ? error.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Erreur');
      toast({ title: 'Ticket supprimé' });
      router.push('/technique/tickets');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Suppression impossible', description: error instanceof Error ? error.message : 'Erreur' });
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!ticket) return null;

  const isFerme = ticket.statut === 'ferme';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/technique/tickets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TicketIcon className="h-6 w-6" />
              {ticket.numero}
            </h2>
            <TicketStatutBadge statut={ticket.statut} />
          </div>
          <p className="text-muted-foreground">
            {ticket.partenaire.nom} • signalé le {formatDateTime(ticket.dateSignalement)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isFerme && (
            <Button asChild>
              <Link href={`/technique/interventions/nouvelle?ticketId=${ticket.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Renseigner la fiche d&apos;intervention
              </Link>
            </Button>
          )}
          {isFerme && isAdmin && (
            <Button variant="outline" onClick={reopen} disabled={busy}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Réouvrir
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/technique/tickets/${ticket.id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          {isAdmin && ticket.interventions.length === 0 && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={busy}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{ticket.partenaire.nom}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Signalé par
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{[ticket.signaleParPrenoms, ticket.signaleParNom].filter(Boolean).join(' ')}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Phone className="h-3 w-3" />
              {modeSignalementLabel(ticket.modeSignalement)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              À (reçu par)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{name(ticket.recuPar)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Prise en charge par
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{ticket.priseEnChargePar ? name(ticket.priseEnChargePar) : <span className="text-muted-foreground">Non attribué</span>}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Incident signalé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{ticket.incident}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Support DCAT
            </CardTitle>
            <CardDescription>Objet : {ticket.partenaire.nom} INCIDENT SIGNALE {ticket.numero}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticket.mailSupportEnvoye ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                Envoyé{ticket.mailSupportAt ? ` le ${formatDateTime(ticket.mailSupportAt)}` : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Non envoyé</Badge>
            )}
            <div>
              <Button variant="outline" size="sm" onClick={resendMail} disabled={busy}>
                <Send className="mr-2 h-4 w-4" />
                {ticket.mailSupportEnvoye ? 'Renvoyer' : 'Envoyer maintenant'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Créé par {name(ticket.createdBy)} le {formatDateTime(ticket.createdAt)}
              {ticket.fermeAt && <> · fermé le {formatDateTime(ticket.fermeAt)}</>}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Interventions liées ({ticket.interventions.length})
              </CardTitle>
              <CardDescription>
                Le ticket se ferme automatiquement quand une intervention liée passe « Terminé ».
              </CardDescription>
            </div>
            {!isFerme && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/technique/interventions/nouvelle?ticketId=${ticket.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle intervention
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ticket.interventions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune intervention renseignée pour ce ticket.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Intervenants</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticket.interventions.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link href={`/technique/interventions/${i.id}`} className="hover:underline font-mono text-sm">
                        {i.reference || '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(i.date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{i.typeMaintenance}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {i.intervenants.length ? i.intervenants.map((x) => x.utilisateur.prenom || x.utilisateur.nom).join(', ') : '-'}
                    </TableCell>
                    <TableCell className="text-sm">{i.dureeMinutes ? formatDuration(i.dureeMinutes) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{INTERVENTION_STATUTS[i.statut] || i.statut}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le ticket {ticket.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
