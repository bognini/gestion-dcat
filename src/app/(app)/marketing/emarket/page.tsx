'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, 
  ArrowLeft,
  ShoppingCart, 
  Users, 
  Package,
  Plus,
  Search,
  Loader2,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  ville: string | null;
  _count: { commandes: number };
}

interface Commande {
  id: string;
  reference: string;
  date: string;
  statut: string;
  statutPaiement: string;
  totalTTC: number;
  client: { id: string; nom: string; prenom: string | null };
  lignes: Array<{
    designation: string;
    quantite: number;
  }>;
}

const STATUTS_COMMANDE = [
  { value: 'en_attente', label: 'En attente', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  { value: 'confirmee', label: 'Confirmée', icon: CheckCircle2, color: 'bg-blue-100 text-blue-700' },
  { value: 'en_preparation', label: 'En préparation', icon: Package, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'expediee', label: 'Expédiée', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { value: 'livree', label: 'Livrée', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { value: 'annulee', label: 'Annulée', icon: XCircle, color: 'bg-red-100 text-red-700' },
];

export default function EMarketPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, commandesRes] = await Promise.all([
        fetch('/api/emarket/clients'),
        fetch('/api/emarket/commandes'),
      ]);
      
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (commandesRes.ok) setCommandes(await commandesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const config = STATUTS_COMMANDE.find(s => s.value === statut);
    const Icon = config?.icon || Clock;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config?.color || ''}`}>
        <Icon className="h-3 w-3" />
        {config?.label || statut}
      </Badge>
    );
  };

  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommandes = commandes.filter(c =>
    c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCommandes: commandes.length,
    commandesEnAttente: commandes.filter(c => c.statut === 'en_attente').length,
    totalClients: clients.length,
    chiffreAffaires: commandes.filter(c => c.statut === 'livree').reduce((sum, c) => sum + c.totalTTC, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6" />
            DCAT E-Market
          </h2>
          <p className="text-muted-foreground">
            Gestion de la boutique en ligne
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketing/emarket/produits">
              <Package className="mr-2 h-4 w-4" />
              Gérer les produits
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/marketing/emarket/clients/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketing/emarket/commandes/nouvelle">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle commande
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommandes}</div>
            <p className="text-xs text-muted-foreground">{stats.commandesEnAttente} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              CA Livré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.chiffreAffaires)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Panier moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCommandes > 0 
                ? formatCurrency(commandes.reduce((sum, c) => sum + c.totalTTC, 0) / stats.totalCommandes)
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commandes" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="commandes" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes ({commandes.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients ({clients.length})
            </TabsTrigger>
          </TabsList>
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

        {/* Commandes Tab */}
        <TabsContent value="commandes">
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
              <CardDescription>Liste de toutes les commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCommandes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commande
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Articles</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommandes.map((commande) => (
                      <TableRow key={commande.id}>
                        <TableCell>
                          <Link href={`/marketing/emarket/commandes/${commande.id}`} className="hover:underline font-mono text-sm">
                            {commande.reference}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(commande.date)}</TableCell>
                        <TableCell>
                          {commande.client.prenom ? `${commande.client.prenom} ` : ''}{commande.client.nom}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {commande.lignes.length} article(s)
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(commande.totalTTC)}</TableCell>
                        <TableCell>{getStatutBadge(commande.statut)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Liste de tous les clients</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun client
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Commandes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <Link href={`/marketing/emarket/clients/${client.id}`} className="hover:underline">
                            {client.prenom ? `${client.prenom} ` : ''}{client.nom}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{client.email}</TableCell>
                        <TableCell className="text-sm">{client.telephone || '-'}</TableCell>
                        <TableCell className="text-sm">{client.ville || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{client._count.commandes}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
