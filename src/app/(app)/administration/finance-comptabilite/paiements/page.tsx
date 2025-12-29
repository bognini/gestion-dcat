'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Search, 
  Banknote,
  Smartphone,
  Building,
  Receipt
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
import { formatDate, formatCurrency } from '@/lib/utils';

interface Paiement {
  id: string;
  reference: string;
  date: string;
  montant: number;
  modePaiement: string;
  notes: string | null;
  facture: {
    id: string;
    reference: string;
    clientNom: string;
  };
  createdBy: {
    id: string;
    nom: string;
    prenom: string | null;
  } | null;
}

const MODES_PAIEMENT: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  especes: { label: 'Espèces', icon: Banknote, color: 'bg-green-500' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone, color: 'bg-orange-500' },
  virement: { label: 'Virement', icon: Building, color: 'bg-blue-500' },
  carte: { label: 'Carte', icon: CreditCard, color: 'bg-purple-500' },
  cheque: { label: 'Chèque', icon: Receipt, color: 'bg-gray-500' },
};

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');

  useEffect(() => {
    fetchPaiements();
  }, []);

  const fetchPaiements = async () => {
    try {
      const res = await fetch('/api/paiements');
      if (res.ok) {
        setPaiements(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPaiements = paiements.filter((p) => {
    const matchesSearch = 
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.facture.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.facture.clientNom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === 'all' || p.modePaiement === modeFilter;
    return matchesSearch && matchesMode;
  });

  const totalEncaissements = paiements.reduce((sum, p) => sum + p.montant, 0);

  // Group by mode for stats
  const byMode = paiements.reduce((acc, p) => {
    acc[p.modePaiement] = (acc[p.modePaiement] || 0) + p.montant;
    return acc;
  }, {} as Record<string, number>);

  const getModeInfo = (mode: string) => {
    return MODES_PAIEMENT[mode] || { label: mode, icon: CreditCard, color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Historique des Paiements</h2>
        <p className="text-muted-foreground">
          Suivez tous les encaissements
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalEncaissements)}</div>
            <p className="text-sm text-muted-foreground">{paiements.length} paiement(s)</p>
          </CardContent>
        </Card>
        {Object.entries(byMode).slice(0, 3).map(([mode, total]) => {
          const info = getModeInfo(mode);
          const Icon = info.icon;
          return (
            <Card key={mode}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {info.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(total)}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, facture, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Mode de paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modes</SelectItem>
            {Object.entries(MODES_PAIEMENT).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredPaiements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun paiement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredPaiements.map((paiement) => {
                const modeInfo = getModeInfo(paiement.modePaiement);
                const ModeIcon = modeInfo.icon;
                return (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-mono font-medium">{paiement.reference}</TableCell>
                    <TableCell>{formatDate(paiement.date)}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/administration/finance-comptabilite/factures/${paiement.facture.id}`}
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {paiement.facture.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{paiement.facture.clientNom}</TableCell>
                    <TableCell>
                      <Badge className={`${modeInfo.color} text-white gap-1`}>
                        <ModeIcon className="h-3 w-3" />
                        {modeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(paiement.montant)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate">
                      {paiement.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
