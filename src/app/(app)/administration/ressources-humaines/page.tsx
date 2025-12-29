'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  CalendarCheck, 
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  Car,
  Wallet,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stats {
  totalEmployes: number;
  absencesEnAttente: number;
  absencesApprouvees: number;
  departements: string[];
}

export default function RessourcesHumainesPage() {
  const [stats, setStats] = useState<Stats>({
    totalEmployes: 0,
    absencesEnAttente: 0,
    absencesApprouvees: 0,
    departements: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [empRes, absRes] = await Promise.all([
        fetch('/api/employes'),
        fetch('/api/absences'),
      ]);

      if (empRes.ok) {
        const employes = await empRes.json();
        const depts = [...new Set(employes.map((e: { departement: string }) => e.departement).filter(Boolean))] as string[];
        setStats(prev => ({
          ...prev,
          totalEmployes: employes.length,
          departements: depts,
        }));
      }

      if (absRes.ok) {
        const absences = await absRes.json();
        setStats(prev => ({
          ...prev,
          absencesEnAttente: absences.filter((a: { statut: string }) => a.statut === 'en_attente').length,
          absencesApprouvees: absences.filter((a: { statut: string }) => a.statut === 'approuve').length,
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ressources Humaines</h2>
          <p className="text-muted-foreground">
            Gestion du personnel et des absences
          </p>
        </div>
        <Button asChild>
          <Link href="/administration/ressources-humaines/employes/nouveau">
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel Employé
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employés</CardDescription>
            <CardTitle className="text-2xl">{stats.totalEmployes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.departements.length} département(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absences en attente</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.absencesEnAttente}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> À traiter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absences approuvées</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.absencesApprouvees}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Ce mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Départements</CardDescription>
            <CardTitle className="text-2xl">{stats.departements.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.departements.slice(0, 2).join(', ')}...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/ressources-humaines/employes">
            <CardHeader className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Users className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Gestion des Employés</CardTitle>
                  <CardDescription className="text-emerald-100">
                    Fiches employés et contrats
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Ajouter un nouvel employé
              </li>
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Gérer les contrats
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Suivi des salaires
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/ressources-humaines/employes">
                  Voir tous les employés
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/ressources-humaines/absences">
            <CardHeader className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Gestion des Absences</CardTitle>
                  <CardDescription className="text-teal-100">
                    Congés et permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Demandes en attente
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Approuver / Refuser
              </li>
              <li className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                Planning des absences
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/ressources-humaines/absences">
                  Gérer les absences
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/ressources-humaines/fiches-transport">
            <CardHeader className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Car className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Fiches Transport</CardTitle>
                  <CardDescription className="text-cyan-100">
                    Frais de déplacement
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Fiches en attente de paiement
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Valider les remboursements
              </li>
              <li className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                Historique des trajets
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/ressources-humaines/fiches-transport">
                  Gérer les fiches
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/ressources-humaines/salaires">
            <CardHeader className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Gestion des Salaires</CardTitle>
                  <CardDescription className="text-violet-100">
                    Paie mensuelle
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Suivi des salaires
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Primes et déductions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Paiements mensuels
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/ressources-humaines/salaires">
                  Gérer les salaires
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
