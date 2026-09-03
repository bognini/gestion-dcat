'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  ArrowLeft,
  Loader2,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Mail,
  Wrench,
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
import { useToast } from '@/hooks/use-toast';
import { TICKET_STATUTS, modeSignalementLabel } from '@/lib/tickets';
import { TicketStatutBadge } from '@/components/tickets/ticket-statut-badge';

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
  partenaire: { id: string; nom: string };
  recuPar: { id: string; nom: string; prenom: string | null };
  priseEnChargePar: { id: string; nom: string; prenom: string | null } | null;
  _count: { interventions: number };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ageLabel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "moins d'une heure";
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

export default function TicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatut !== 'all') params.append('statut', filterStatut);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error();
      setTickets(await res.json());
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les tickets' });
    } finally {
      setLoading(false);
    }
  }, [filterStatut, from, to, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const q = searchQuery.toLowerCase();
  const filtered = tickets.filter(
    (t) =>
      !q ||
      t.numero.toLowerCase().includes(q) ||
      t.incident.toLowerCase().includes(q) ||
      t.partenaire.nom.toLowerCase().includes(q) ||
      t.signaleParNom.toLowerCase().includes(q)
  );

  const stats = {
    ouverts: tickets.filter((t) => t.statut === 'ouvert').length,
    enCours: tickets.filter((t) => t.statut === 'en_cours').length,
    fermes: tickets.filter((t) => t.statut === 'ferme').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/technique">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TicketIcon className="h-6 w-6" />
            Tickets d&apos;incident
          </h2>
          <p className="text-muted-foreground">
            Chaque nouvelle intervention commence par un ticket ; il se ferme en terminant la fiche d&apos;intervention.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/technique/interventions">
              <Wrench className="mr-2 h-4 w-4" />
              Interventions
            </Link>
          </Button>
          <Button asChild>
            <Link href="/technique/tickets/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau ticket
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={stats.ouverts > 0 ? 'border-red-300' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Ouverts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.ouverts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fermés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fermes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Tickets ({filtered.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {TICKET_STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" title="Du" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" title="Au" />
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° ticket</TableHead>
                <TableHead>Signalé le</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Signalé par</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Prise en charge</TableHead>
                <TableHead>Interv.</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucun ticket trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/technique/tickets/${t.id}`} className="hover:underline font-mono text-sm">
                        {t.numero}
                      </Link>
                      {t.mailSupportEnvoye && (
                        <Mail className="inline-block ml-1 h-3 w-3 text-muted-foreground" aria-label="Mail support envoyé" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDateTime(t.dateSignalement)}
                      {t.statut !== 'ferme' && (
                        <p className="text-xs text-muted-foreground">ouvert depuis {ageLabel(t.dateSignalement)}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-36">{t.partenaire.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate text-sm">{t.incident}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {[t.signaleParPrenoms, t.signaleParNom].filter(Boolean).join(' ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{modeSignalementLabel(t.modeSignalement)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.priseEnChargePar
                        ? [t.priseEnChargePar.prenom, t.priseEnChargePar.nom].filter(Boolean).join(' ')
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-center">{t._count.interventions}</TableCell>
                    <TableCell>
                      <TicketStatutBadge statut={t.statut} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
