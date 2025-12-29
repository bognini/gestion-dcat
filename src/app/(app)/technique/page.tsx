'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Wrench, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Stats {
  projetsActifs: number;
  projetsEnCours: number;
  interventionsMois: number;
  interventionsEnAttente: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  tachesEnAttente: number;
  tachesPrioritaires: number;
  tauxCompletion: number;
  missionsPlannifiees: number;
  missionsEnCours: number;
  missionsTerminees: number;
}

export default function TechniquePage() {
  const [stats, setStats] = useState<Stats>({
    projetsActifs: 0,
    projetsEnCours: 0,
    interventionsMois: 0,
    interventionsEnAttente: 0,
    interventionsEnCours: 0,
    interventionsTerminees: 0,
    tachesEnAttente: 0,
    tachesPrioritaires: 0,
    tauxCompletion: 0,
    missionsPlannifiees: 0,
    missionsEnCours: 0,
    missionsTerminees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [projetsRes, interventionsRes, missionsRes] = await Promise.all([
        fetch('/api/projets'),
        fetch('/api/interventions'),
        fetch('/api/missions'),
      ]);

      let projetsActifs = 0, projetsEnCours = 0;
      let interventionsMois = 0, interventionsEnAttente = 0, interventionsEnCours = 0, interventionsTerminees = 0;
      let missionsPlannifiees = 0, missionsEnCours = 0, missionsTerminees = 0;

      if (projetsRes.ok) {
        const projets = await projetsRes.json();
        projetsActifs = projets.filter((p: { statut: string }) => p.statut !== 'termine' && p.statut !== 'annule').length;
        projetsEnCours = projets.filter((p: { statut: string }) => p.statut === 'en_cours').length;
      }

      if (interventionsRes.ok) {
        const interventions = await interventionsRes.json();
        const thisMonth = new Date();
        thisMonth.setDate(1);
        interventionsMois = interventions.filter((i: { date: string }) => new Date(i.date) >= thisMonth).length;
        interventionsEnAttente = interventions.filter((i: { statut: string }) => i.statut === 'a_faire' || i.statut === 'en_attente').length;
        interventionsEnCours = interventions.filter((i: { statut: string }) => i.statut === 'en_cours').length;
        interventionsTerminees = interventions.filter((i: { statut: string }) => i.statut === 'termine').length;
      }

      if (missionsRes.ok) {
        const missions = await missionsRes.json();
        missionsPlannifiees = missions.filter((m: { statut: string }) => m.statut === 'planifiee').length;
        missionsEnCours = missions.filter((m: { statut: string }) => m.statut === 'en_cours').length;
        missionsTerminees = missions.filter((m: { statut: string }) => m.statut === 'terminee').length;
      }

      const total = interventionsEnAttente + interventionsEnCours + interventionsTerminees;
      const tauxCompletion = total > 0 ? Math.round((interventionsTerminees / total) * 100) : 0;

      setStats({
        projetsActifs,
        projetsEnCours,
        interventionsMois,
        interventionsEnAttente,
        interventionsEnCours,
        interventionsTerminees,
        tachesEnAttente: interventionsEnAttente,
        tachesPrioritaires: 0,
        tauxCompletion,
        missionsPlannifiees,
        missionsEnCours,
        missionsTerminees,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Technique</h2>
          <p className="text-muted-foreground">
            Gérez vos projets et interventions techniques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/technique/interventions/nouvelle">
              <Wrench className="mr-2 h-4 w-4" />
              Nouvelle intervention
            </Link>
          </Button>
          <Button asChild>
            <Link href="/technique/projets/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projets actifs</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.projetsActifs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.projetsEnCours} en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interventions (mois)</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.interventionsMois}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.interventionsTerminees} terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {stats.interventionsEnAttente > 0 && <AlertCircle className="h-5 w-5 text-orange-500" />}
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.interventionsEnAttente}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.interventionsEnCours} en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de complétion</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.tauxCompletion}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.tauxCompletion} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/technique/projets">
            <CardHeader className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Gestion des Projets</CardTitle>
                  <CardDescription className="text-cyan-100">
                    Opérations, tâches et livrables
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projets en cours</span>
                <Badge>{stats.projetsEnCours}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projets actifs</span>
                <Badge variant="secondary">{stats.projetsActifs}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Interventions ce mois</span>
                <Badge variant="outline">{stats.interventionsMois}</Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <Link href="/technique/projets" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <BarChart3 className="h-4 w-4" />
                Vue d&apos;ensemble des projets
              </Link>
              <Link href="/technique/projets/nouveau" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Plus className="h-4 w-4" />
                Nouveau projet
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/technique/interventions">
            <CardHeader className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Wrench className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Gestion des Interventions</CardTitle>
                  <CardDescription className="text-sky-100">
                    Maintenance et support technique
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">À planifier</span>
                <Badge variant={stats.interventionsEnAttente > 0 ? "destructive" : "secondary"}>{stats.interventionsEnAttente}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En cours</span>
                <Badge>{stats.interventionsEnCours}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Terminées</span>
                <Badge variant="secondary">{stats.interventionsTerminees}</Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <Link href="/technique/interventions" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <BarChart3 className="h-4 w-4" />
                Tableau de bord interventions
              </Link>
              <Link href="/technique/programme-equipes" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Users className="h-4 w-4" />
                Programme des équipes
              </Link>
              <Link href="/technique/interventions/nouvelle" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Plus className="h-4 w-4" />
                Nouvelle intervention
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/technique/fiches-mission">
            <CardHeader className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Briefcase className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Fiches de Mission</CardTitle>
                  <CardDescription className="text-violet-100">
                    Déplacements et missions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Planifiées</span>
                <Badge>{stats.missionsPlannifiees}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En cours</span>
                <Badge variant="secondary">{stats.missionsEnCours}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Terminées</span>
                <Badge variant="outline">{stats.missionsTerminees}</Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <Link href="/technique/fiches-mission" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <MapPin className="h-4 w-4" />
                Toutes les missions
              </Link>
              <Link href="/technique/fiches-mission?new=1" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Plus className="h-4 w-4" />
                Nouvelle mission
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="font-medium">Intervention #INT-2024-045 terminée</p>
                <p className="text-sm text-muted-foreground">Maintenance préventive - Client ABC</p>
              </div>
              <span className="text-sm text-muted-foreground">Il y a 2h</span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Nouvelle tâche créée</p>
                <p className="text-sm text-muted-foreground">Installation serveur - Projet XYZ</p>
              </div>
              <span className="text-sm text-muted-foreground">Il y a 4h</span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <div className="flex-1">
                <p className="font-medium">Intervention planifiée</p>
                <p className="text-sm text-muted-foreground">Diagnostic réseau - Client DEF</p>
              </div>
              <span className="text-sm text-muted-foreground">Demain 09:00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
