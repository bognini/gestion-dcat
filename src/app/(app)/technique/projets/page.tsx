'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
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
  XCircle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
  categorie: string;
  type: string;
  etat: string;
  priorite: string;
  progression: number;
  dateDebut: string | null;
  dateFinEstimative: string | null;
  devisEstimatif: number | null;
  lieu: string | null;
  partenaire: { id: string; nom: string };
  responsable: { id: string; nom: string; prenom: string } | null;
  _count: { operations: number; mouvements: number };
}

const ETATS = [
  { value: 'planifie', label: 'Planifié', icon: Clock, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'en_cours', label: 'En cours', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'bloque', label: 'Bloqué', icon: Pause, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'annule', label: 'Annulé', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
];

const CATEGORIES = [
  { value: 'audiovisuel', label: 'Audiovisuel' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'domotique', label: 'Domotique' },
  { value: 'energie', label: 'Énergie' },
];

const PRIORITES = [
  { value: 'basse', label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  { value: 'moyenne', label: 'Moyenne', color: 'bg-blue-100 text-blue-600' },
  { value: 'haute', label: 'Haute', color: 'bg-orange-100 text-orange-600' },
  { value: 'critique', label: 'Critique', color: 'bg-red-100 text-red-600' },
];

export default function ProjetsPage() {
  const { toast } = useToast();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtat, setFilterEtat] = useState<string>('all');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');

  useEffect(() => {
    fetchProjets();
  }, [filterEtat, filterCategorie]);

  const fetchProjets = async () => {
    try {
      const params = new URLSearchParams();
      if (filterEtat !== 'all') params.append('etat', filterEtat);
      if (filterCategorie !== 'all') params.append('categorie', filterCategorie);
      
      const res = await fetch(`/api/projets?${params}`);
      if (res.ok) {
        setProjets(await res.json());
      }
    } catch (error) {
      console.error('Error fetching projets:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les projets' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjets = projets.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.partenaire.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getEtatBadge = (etat: string) => {
    const config = ETATS.find(e => e.value === etat);
    const Icon = config?.icon || Clock;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config?.color || ''}`}>
        <Icon className="h-3 w-3" />
        {config?.label || etat}
      </Badge>
    );
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = PRIORITES.find(p => p.value === priorite);
    return (
      <Badge variant="outline" className={config?.color || ''}>
        {config?.label || priorite}
      </Badge>
    );
  };

  const stats = {
    total: projets.length,
    enCours: projets.filter(p => p.etat === 'en_cours').length,
    termines: projets.filter(p => p.etat === 'termine').length,
    bloques: projets.filter(p => p.etat === 'bloque').length,
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
            <FolderKanban className="h-6 w-6" />
            Gestion des Projets
          </h2>
          <p className="text-muted-foreground">
            Suivez et gérez tous vos projets techniques
          </p>
        </div>
        <Button asChild>
          <Link href="/technique/projets/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
              Terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.termines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Pause className="h-4 w-4 text-orange-500" />
              Bloqués
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.bloques}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Projets ({filteredProjets.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterEtat} onValueChange={setFilterEtat}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="État" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  {ETATS.map(etat => (
                    <SelectItem key={etat.value} value={etat.value}>{etat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun projet trouvé
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjets.map((projet) => (
                <Link key={projet.id} href={`/technique/projets/${projet.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{projet.nom}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {projet.reference}
                          </CardDescription>
                        </div>
                        {getEtatBadge(projet.etat)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate max-w-24">{projet.partenaire.nom}</span>
                        </div>
                        {projet.responsable && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate max-w-24">
                              {projet.responsable.prenom ? `${projet.responsable.prenom} ` : ''}{projet.responsable.nom}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary">{CATEGORIES.find(c => c.value === projet.categorie)?.label}</Badge>
                        {getPrioriteBadge(projet.priorite)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progression</span>
                          <span>{projet.progression}%</span>
                        </div>
                        <Progress value={projet.progression} className="h-2" />
                      </div>

                      {projet.devisEstimatif && (
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(projet.devisEstimatif)}
                        </div>
                      )}

                      {projet.dateDebut && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(projet.dateDebut).toLocaleDateString('fr-FR')}
                          {projet.dateFinEstimative && (
                            <> → {new Date(projet.dateFinEstimative).toLocaleDateString('fr-FR')}</>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
