'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Filter,
  MapPin,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDuration } from '@/lib/utils';

interface Intervention {
  id: string;
  reference: string | null;
  date: string;
  typeMaintenance: string;
  typeDefaillance: string | null;
  problemeSignale: string;
  statut: string;
  dureeMinutes: number | null;
  lieu: string | null;
  modeIntervention: string | null;
  partenaire: { id: string; nom: string };
  intervenants: Array<{
    utilisateur: { id: string; nom: string; prenom: string | null };
  }>;
}

const STATUTS = [
  { value: 'a_faire', label: 'À faire', icon: Clock, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'en_cours', label: 'En cours', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'en_attente', label: 'En attente', icon: Pause, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
];

const TYPES_MAINTENANCE = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Préventive' },
  { value: 'planifiee', label: 'Planifiée' },
];

export default function InterventionsPage() {
  const { toast } = useToast();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchInterventions();
  }, [filterStatut, filterType]);

  const fetchInterventions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatut !== 'all') params.append('statut', filterStatut);
      if (filterType !== 'all') params.append('type', filterType);
      
      const res = await fetch(`/api/interventions?${params}`);
      if (res.ok) {
        setInterventions(await res.json());
      }
    } catch (error) {
      console.error('Error fetching interventions:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les interventions' });
    } finally {
      setLoading(false);
    }
  };

  const filteredInterventions = interventions.filter(i => {
    const matchesSearch = i.problemeSignale.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.partenaire.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatutBadge = (statut: string) => {
    const config = STATUTS.find(s => s.value === statut);
    const Icon = config?.icon || Clock;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config?.color || ''}`}>
        <Icon className="h-3 w-3" />
        {config?.label || statut}
      </Badge>
    );
  };

  const stats = {
    total: interventions.length,
    aFaire: interventions.filter(i => i.statut === 'a_faire').length,
    enCours: interventions.filter(i => i.statut === 'en_cours').length,
    terminees: interventions.filter(i => i.statut === 'termine').length,
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
            <Wrench className="h-6 w-6" />
            Gestion des Interventions
          </h2>
          <p className="text-muted-foreground">
            Suivez et gérez toutes vos interventions techniques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/technique/interventions/rapport-mensuel">
              <FileText className="mr-2 h-4 w-4" />
              Rapport mensuel
            </Link>
          </Button>
          <Button asChild>
            <Link href="/technique/interventions/nouvelle">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle intervention
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              À faire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aFaire}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
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
              Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.terminees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Interventions ({filteredInterventions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {STATUTS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {TYPES_MAINTENANCE.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Partenaire</TableHead>
                <TableHead>Problème</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Intervenants</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredInterventions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune intervention trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterventions.map((intervention) => (
                  <TableRow key={intervention.id}>
                    <TableCell>
                      <Link href={`/technique/interventions/${intervention.id}`} className="hover:underline font-mono text-sm">
                        {intervention.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(intervention.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-32">{intervention.partenaire.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <p className="truncate text-sm">{intervention.problemeSignale}</p>
                      {intervention.lieu && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {intervention.lieu}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPES_MAINTENANCE.find(t => t.value === intervention.typeMaintenance)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {intervention.intervenants.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {intervention.intervenants.map(i => 
                              i.utilisateur.prenom ? `${i.utilisateur.prenom}` : i.utilisateur.nom
                            ).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {intervention.dureeMinutes ? formatDuration(intervention.dureeMinutes) : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(intervention.statut)}
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
