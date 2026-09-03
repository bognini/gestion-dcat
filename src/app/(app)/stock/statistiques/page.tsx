'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { periodeBounds, toISODate } from '@/lib/stock';

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom';

const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
];

interface ProduitLite {
  id: string;
  nom: string;
  sku: string | null;
  quantite: number;
  seuilAlerte?: number | null;
}

interface StatsResponse {
  instantane: {
    totalProduits: number;
    totalUnites: number;
    valeurStock: number;
    valeurRevient: number;
    lowStockCount: number;
    outOfStockCount: number;
    topByQuantity: ProduitLite[];
    lowStockProducts: ProduitLite[];
    parCategorie: Array<{ categorie: string; count: number; value: number }>;
  };
  periode: {
    from: string;
    to: string;
    granularite: 'jour' | 'mois';
    nbMouvements: number;
    entrees: number;
    sorties: number;
    nbEntrees: number;
    nbSorties: number;
    totalVentes: number;
    coutSorties: number;
    serie: Array<{ periode: string; entrees: number; sorties: number; ventes: number }>;
    topSorties: Array<{ id: string; nom: string; sku: string | null; quantite: number; montant: number }>;
    sortiesParCategorie: Array<{ categorie: string; quantite: number; montant: number }>;
  };
}

function labelPeriode(key: string, granularite: 'jour' | 'mois') {
  if (granularite === 'mois') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  }
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function StatistiquesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <StatistiquesContent />
    </Suspense>
  );
}

function StatistiquesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requested = searchParams.get('periode') as Preset | null;
  const initialPreset: Preset = requested && PRESETS.some((p) => p.value === requested) ? requested : 'month';
  const initialBounds = periodeBounds(initialPreset === 'custom' ? 'month' : initialPreset);
  const [preset, setPreset] = useState<Preset>(initialPreset);
  const [from, setFrom] = useState(searchParams.get('from') || toISODate(initialBounds.from));
  const [to, setTo] = useState(searchParams.get('to') || toISODate(initialBounds.to));
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const b = periodeBounds(p);
      setFrom(toISODate(b.from));
      setTo(toISODate(b.to));
    }
  };

  const load = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/stock/statistiques?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Erreur');
      setData(body);
      const url = new URLSearchParams({ periode: preset, from, to });
      router.replace(`/stock/statistiques?${url.toString()}`, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [from, to, preset, router]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['periode', 'entrees', 'sorties', 'ventes_fcfa'],
      ...data.periode.serie.map((s) => [s.periode, s.entrees, s.sorties, Math.round(s.ventes)]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stock-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const inst = data?.instantane;
  const per = data?.periode;
  const chartData = per?.serie.map((s) => ({ ...s, label: labelPeriode(s.periode, per.granularite) })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Statistiques du Stock
          </h2>
          <p className="text-muted-foreground">État instantané du stock et flux sur la période choisie</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!data}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardContent className="py-4 flex flex-wrap items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={preset === p.value ? 'default' : 'outline'}
                onClick={() => applyPreset(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setPreset('custom');
                setFrom(e.target.value);
              }}
              className="w-40"
            />
            <span className="text-muted-foreground text-sm">au</span>
            <Input
              type="date"
              value={to}
              min={from}
              max={toISODate(new Date())}
              onChange={(e) => {
                setPreset('custom');
                setTo(e.target.value);
              }}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : inst && per ? (
        <>
          {/* Flux sur la période */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Sur la période · {per.nbMouvements} mouvement{per.nbMouvements > 1 ? 's' : ''}
              {loading && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
            </h3>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" /> Entrées
                  </CardDescription>
                  <CardTitle className="text-2xl text-green-600 whitespace-nowrap">{per.entrees}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">{per.nbEntrees} réception{per.nbEntrees > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3 text-red-600" /> Sorties
                  </CardDescription>
                  <CardTitle className="text-2xl text-red-600 whitespace-nowrap">{per.sorties}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">{per.nbSorties} sortie{per.nbSorties > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs">Ventes (prix définitif)</CardDescription>
                  <CardTitle className="text-xl text-blue-600 whitespace-nowrap">{formatCurrency(per.totalVentes)}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Coût des sorties : {formatCurrency(per.coutSorties)}</p>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs">Solde net</CardDescription>
                  <CardTitle className={`text-2xl whitespace-nowrap ${per.entrees - per.sorties >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {per.entrees - per.sorties >= 0 ? '+' : ''}{per.entrees - per.sorties}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">unités (entrées − sorties)</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Entrées et sorties par {per.granularite}
              </CardTitle>
              <CardDescription>Quantités en barres, montant des ventes en courbe</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun mouvement sur la période</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis yAxisId="qte" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis yAxisId="fcfa" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip
                        formatter={(value, name) =>
                          name === 'Ventes' ? [formatCurrency(Number(value)), name] : [value, name]
                        }
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="qte" dataKey="entrees" name="Entrées" fill="#16a34a" radius={[3, 3, 0, 0]} />
                      <Bar yAxisId="qte" dataKey="sorties" name="Sorties" fill="#dc2626" radius={[3, 3, 0, 0]} />
                      <Line yAxisId="fcfa" type="monotone" dataKey="ventes" name="Ventes" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Top 5 — Produits sortis sur la période
                </CardTitle>
                <CardDescription>Quantités sorties et chiffre d&apos;affaires associé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {per.topSorties.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">{idx + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{p.nom}</p>
                          {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge>{p.quantite} unités</Badge>
                        {p.montant > 0 && <p className="text-xs text-muted-foreground mt-1">{formatCurrency(p.montant)}</p>}
                      </div>
                    </div>
                  ))}
                  {per.topSorties.length === 0 && <p className="text-muted-foreground text-center py-4">Aucune sortie sur la période</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sorties par catégorie
                </CardTitle>
                <CardDescription>Sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {per.sortiesParCategorie.map((c) => (
                    <div key={c.categorie} className="flex items-center justify-between">
                      <p className="font-medium text-sm">{c.categorie}</p>
                      <div className="text-right">
                        <Badge variant="secondary">{c.quantite} unités</Badge>
                        {c.montant > 0 && <p className="text-xs text-muted-foreground mt-1">{formatCurrency(c.montant)}</p>}
                      </div>
                    </div>
                  ))}
                  {per.sortiesParCategorie.length === 0 && <p className="text-muted-foreground text-center py-4">Aucune sortie sur la période</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instantané */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              État actuel du stock (indépendant de la période)
            </h3>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs">Produits</CardDescription>
                  <CardTitle className="text-2xl whitespace-nowrap">{inst.totalProduits}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">{inst.totalUnites} unités</p>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs">Valeur Stock</CardDescription>
                  <CardTitle className="text-xl text-green-600 whitespace-nowrap">{formatCurrency(inst.valeurStock)}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Revient : {formatCurrency(inst.valeurRevient)}</p>
                </CardContent>
              </Card>
              <Card className={`min-w-0 ${inst.lowStockCount > 0 ? 'border-orange-500' : ''}`}>
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="flex items-center gap-1 text-xs">
                    {inst.lowStockCount > 0 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    Stock Faible
                  </CardDescription>
                  <CardTitle className="text-2xl whitespace-nowrap">{inst.lowStockCount}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">{inst.outOfStockCount} en rupture</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 5 — Quantité en stock
                </CardTitle>
                <CardDescription>Produits avec le plus de stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inst.topByQuantity.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">{idx + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{p.nom}</p>
                          {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                        </div>
                      </div>
                      <Badge>{p.quantite} unités</Badge>
                    </div>
                  ))}
                  {inst.topByQuantity.length === 0 && <p className="text-muted-foreground text-center py-4">Aucun produit</p>}
                </div>
              </CardContent>
            </Card>

            <Card className={inst.lowStockProducts.length > 0 ? 'border-orange-500/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertes Stock Faible
                </CardTitle>
                <CardDescription>Produits à réapprovisionner</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inst.lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.nom}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                      </div>
                      <Badge variant={p.quantite === 0 ? 'destructive' : 'secondary'}>
                        {p.quantite} / {p.seuilAlerte}
                      </Badge>
                    </div>
                  ))}
                  {inst.lowStockProducts.length === 0 && (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p className="text-muted-foreground">Stock OK pour tous les produits</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Répartition par catégorie
              </CardTitle>
              <CardDescription>Stock et valeur actuels par catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {inst.parCategorie.map((c) => (
                  <Card key={c.categorie} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{c.categorie}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-2xl font-bold">{c.count}</p>
                      <p className="text-xs text-muted-foreground">unités</p>
                      <p className="text-sm text-green-600 font-medium">{formatCurrency(c.value)}</p>
                    </CardContent>
                  </Card>
                ))}
                {inst.parCategorie.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-4">Aucune donnée</p>}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
