'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Commande {
  id: string;
  reference: string;
  statut: string;
  modePaiement: string | null;
  adresseLivraison: string | null;
  notes: string | null;
  totalTTC: number;
  client: {
    id: string;
    nom: string;
    prenom: string | null;
  };
  lignes: Array<{
    id: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    montant: number;
  }>;
}

const STATUTS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'en_preparation', label: 'En préparation' },
  { value: 'expediee', label: 'Expédiée' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' },
];

const MODES_PAIEMENT = [
  { value: 'none', label: 'Non spécifié' },
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte bancaire' },
];

export default function ModifierCommandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commande, setCommande] = useState<Commande | null>(null);
  
  const [formData, setFormData] = useState({
    statut: 'en_attente',
    modePaiement: 'none',
    adresseLivraison: '',
    notes: '',
  });

  useEffect(() => {
    fetchCommande();
  }, [id]);

  const fetchCommande = async () => {
    try {
      const res = await fetch(`/api/emarket/commandes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCommande(data);
        setFormData({
          statut: data.statut || 'en_attente',
          modePaiement: data.modePaiement || 'none',
          adresseLivraison: data.adresseLivraison || '',
          notes: data.notes || '',
        });
      } else {
        toast({ variant: 'destructive', title: 'Commande non trouvée' });
        router.push('/marketing/emarket');
      }
    } catch (error) {
      console.error('Error fetching commande:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/emarket/commandes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: formData.statut,
          modePaiement: formData.modePaiement !== 'none' ? formData.modePaiement : null,
          adresseLivraison: formData.adresseLivraison || null,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast({ title: 'Commande mise à jour' });
      router.push(`/marketing/emarket/commandes/${id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!commande) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/marketing/emarket/commandes/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Modifier {commande.reference}
          </h2>
          <p className="text-muted-foreground">
            Client: {commande.client.prenom ? `${commande.client.prenom} ` : ''}{commande.client.nom}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status & Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Statut et paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(v) => setFormData({ ...formData, statut: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modePaiement">Mode de paiement</Label>
                <Select
                  value={formData.modePaiement}
                  onValueChange={(v) => setFormData({ ...formData, modePaiement: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_PAIEMENT.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Livraison et notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adresseLivraison">Adresse de livraison</Label>
                <Textarea
                  id="adresseLivraison"
                  value={formData.adresseLivraison}
                  onChange={(e) => setFormData({ ...formData, adresseLivraison: e.target.value })}
                  placeholder="Adresse complète..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes sur la commande..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Articles commandés</CardTitle>
            <CardDescription>Les articles ne peuvent pas être modifiés après création</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commande.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell className="font-medium">{ligne.designation}</TableCell>
                    <TableCell className="text-center">{ligne.quantite}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(ligne.montant)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                  <TableCell className="text-right font-bold text-lg">{formatCurrency(commande.totalTTC)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/marketing/emarket/commandes/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
