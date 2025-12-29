'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users,
  Wrench,
  Calendar,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  MapPin,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

interface Intervention {
  id: string;
  reference: string | null;
  date: string;
  partenaire: { nom: string };
  problemeSignale: string;
  typeMaintenance: string;
  statut: string;
  lieu: string | null;
}

interface Technicien {
  id: string;
  nom: string;
  prenom: string | null;
  interventions: Intervention[];
}

const STATUTS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  a_faire: { label: 'À faire', color: 'bg-yellow-500', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-500', icon: PlayCircle },
  en_attente: { label: 'En attente', color: 'bg-orange-500', icon: AlertCircle },
  termine: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle },
};

const TYPE_LABELS: Record<string, string> = {
  corrective: 'Corrective',
  preventive: 'Préventive',
  planifiee: 'Planifiée',
};

export default function ProgrammeEquipesPage() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('semaine');

  useEffect(() => {
    fetchData();
  }, [periode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interventions/programme?periode=${periode}`);
      if (res.ok) {
        setTechniciens(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalInterventions = () => {
    return techniciens.reduce((sum, t) => sum + t.interventions.length, 0);
  };

  const getStatutCount = (statut: string) => {
    return techniciens.reduce((sum, t) => 
      sum + t.interventions.filter(i => i.statut === statut).length, 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Programme des Équipes
          </h2>
          <p className="text-muted-foreground">
            Planning des interventions par technicien
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jour">Aujourd'hui</SelectItem>
              <SelectItem value="semaine">Cette semaine</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/technique/interventions/nouvelle">
              <Wrench className="mr-2 h-4 w-4" />
              Nouvelle intervention
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total interventions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getTotalInterventions()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              À faire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{getStatutCount('a_faire')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-blue-500" />
              En cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{getStatutCount('en_cours')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Terminées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{getStatutCount('termine')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Techniciens */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : techniciens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune intervention planifiée pour cette période
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {techniciens.map((technicien) => (
            <Card key={technicien.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {technicien.prenom} {technicien.nom}
                </CardTitle>
                <CardDescription>
                  {technicien.interventions.length} intervention{technicien.interventions.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {technicien.interventions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune intervention assignée
                  </p>
                ) : (
                  <div className="space-y-3">
                    {technicien.interventions.map((intervention) => {
                      const statutConfig = STATUTS[intervention.statut] || STATUTS.a_faire;
                      const StatutIcon = statutConfig.icon;
                      return (
                        <Link 
                          key={intervention.id}
                          href={`/technique/interventions/${intervention.id}`}
                          className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {intervention.reference && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {intervention.reference}
                                  </span>
                                )}
                                <Badge className={`${statutConfig.color} text-white text-xs`}>
                                  <StatutIcon className="h-3 w-3 mr-1" />
                                  {statutConfig.label}
                                </Badge>
                              </div>
                              <p className="font-medium truncate">
                                {intervention.problemeSignale}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {intervention.partenaire.nom}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(intervention.date)}
                                </span>
                                {intervention.lieu && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {intervention.lieu}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {TYPE_LABELS[intervention.typeMaintenance] || intervention.typeMaintenance}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
