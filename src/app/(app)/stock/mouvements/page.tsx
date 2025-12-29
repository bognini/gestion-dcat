'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftRight, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Filter,
  Package,
  DollarSign,
  CalendarDays
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
import { formatDate, formatCurrency } from '@/lib/utils';

interface Mouvement {
  id: string;
  date: string;
  type: string;
  quantite: number;
  commentaire: string | null;
  destination: string | null;
  prixVenteDefinitif: number | null;
  produit: { id: string; nom: string; sku: string | null };
  utilisateur: { id: string; nom: string; prenom: string };
  fournisseur: { id: string; nom: string } | null;
  demandeur: { id: string; nom: string; prenom: string } | null;
  projet: { id: string; nom: string } | null;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function MouvementsPage() {
  const { toast } = useToast();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all');

  useEffect(() => {
    fetchMouvements();
  }, []);

  const fetchMouvements = async () => {
    try {
      const res = await fetch('/api/mouvements?limit=100');
      if (res.ok) {
        setMouvements(await res.json());
      }
    } catch (error) {
      console.error('Error fetching mouvements:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les mouvements' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMouvements = mouvements.filter(m => {
    const matchesSearch = m.produit.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.produit.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.commentaire?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    
    // Period filter
    let matchesPeriod = true;
    if (filterPeriod !== 'all') {
      const mouvementDate = new Date(m.date);
      const now = new Date();
      
      if (filterPeriod === 'today') {
        matchesPeriod = mouvementDate.toDateString() === now.toDateString();
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = mouvementDate >= weekAgo;
      } else if (filterPeriod === 'month') {
        matchesPeriod = mouvementDate.getMonth() === now.getMonth() && 
                        mouvementDate.getFullYear() === now.getFullYear();
      } else if (filterPeriod === 'year') {
        matchesPeriod = mouvementDate.getFullYear() === now.getFullYear();
      }
    }
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  const totals = {
    entrees: mouvements.filter(m => m.type === 'ENTREE').reduce((sum, m) => sum + m.quantite, 0),
    sorties: mouvements.filter(m => m.type === 'SORTIE').reduce((sum, m) => sum + m.quantite, 0),
    totalVentes: mouvements.filter(m => m.type === 'SORTIE' && m.prixVenteDefinitif).reduce((sum, m) => sum + (m.prixVenteDefinitif || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Mouvements de stock</h2>
          <p className="text-muted-foreground">
            Historique des entrées et sorties
          </p>
        </div>
        <Button asChild>
          <Link href="/stock/mouvements/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau mouvement
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{totals.entrees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{totals.sorties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Total ventes (Prix déf.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.totalVentes)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Historique ({filteredMouvements.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as PeriodFilter)}>
                <SelectTrigger className="w-36">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="ENTREE">Entrées</SelectItem>
                  <SelectItem value="SORTIE">Sorties</SelectItem>
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
                <TableHead className="w-24">Date</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="max-w-48">Produit</TableHead>
                <TableHead className="text-center w-12">Qté</TableHead>
                <TableHead className="text-right w-28 whitespace-nowrap">Prix déf.</TableHead>
                <TableHead className="w-28">Opérateur</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredMouvements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery || filterType !== 'all' 
                      ? 'Aucun mouvement trouvé' 
                      : 'Aucun mouvement enregistré'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(mouvement.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {mouvement.type === 'ENTREE' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48">
                      <Link href={`/stock/produits/${mouvement.produit.id}`} className="hover:underline">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{mouvement.produit.nom}</div>
                            {mouvement.produit.sku && (
                              <div className="text-xs text-muted-foreground font-mono truncate">{mouvement.produit.sku}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <span className={mouvement.type === 'ENTREE' ? 'text-green-600' : 'text-red-600'}>
                        {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {mouvement.type === 'SORTIE' && mouvement.prixVenteDefinitif 
                        ? <span className="text-blue-600 font-medium">{formatCurrency(mouvement.prixVenteDefinitif)}</span>
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="line-clamp-2 max-w-[100px]">
                        {mouvement.utilisateur.prenom} {mouvement.utilisateur.nom}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {mouvement.fournisseur?.nom || mouvement.destination || mouvement.projet?.nom || mouvement.commentaire || '-'}
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
