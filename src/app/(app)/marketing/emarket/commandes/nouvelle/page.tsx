'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string;
  email: string | null;
}

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  tags?: string[];
  prixVente: number | null;
  quantite: number;
}

interface LigneCommande {
  produitId: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  stock: number;
}

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte bancaire' },
];

export default function NouvelleCommandePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchProduit, setSearchProduit] = useState('');
  const [lignes, setLignes] = useState<LigneCommande[]>([]);
  
  const [formData, setFormData] = useState({
    clientId: '',
    modePaiement: 'none',
    adresseLivraison: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, produitsRes] = await Promise.all([
        fetch('/api/emarket/clients'),
        fetch('/api/produits'),
      ]);
      
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (produitsRes.ok) setProduits(await produitsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProduits = produits
    .filter((p) => {
      const terms = searchProduit.toLowerCase().split(/[\s,]+/).filter(Boolean);
      if (terms.length === 0) return true;
      return terms.some((term) =>
        p.nom.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.tags?.some((t) => t.toLowerCase().includes(term))
      );
    })
    .slice(0, 10);

  const addLigne = (produit: Produit) => {
    // Check if already added
    if (lignes.find(l => l.produitId === produit.id)) {
      toast({ variant: 'destructive', title: 'Produit déjà ajouté' });
      return;
    }
    
    setLignes([...lignes, {
      produitId: produit.id,
      designation: produit.nom,
      quantite: 1,
      prixUnitaire: produit.prixVente || 0,
      stock: produit.quantite,
    }]);
    setSearchProduit('');
  };

  const updateLigne = (index: number, field: keyof LigneCommande, value: number) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignes(newLignes);
  };

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const total = lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lignes.length === 0) {
      toast({ variant: 'destructive', title: 'Ajoutez au moins un produit' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/emarket/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          modePaiement: formData.modePaiement !== 'none' ? formData.modePaiement : null,
          adresseLivraison: formData.adresseLivraison || null,
          notes: formData.notes || null,
          lignes: lignes.map(l => ({
            produitId: l.produitId,
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const commande = await res.json();
      toast({
        title: 'Commande créée',
        description: `Commande ${commande.reference} créée avec succès`,
      });
      router.push(`/marketing/emarket/commandes/${commande.id}`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing/emarket">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Nouvelle Commande
          </h2>
          <p className="text-muted-foreground">
            Créer une nouvelle commande E-Market
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Client & Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>Sélectionnez le client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.prenom ? `${c.prenom} ` : ''}{c.nom}
                      </SelectItem>
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
                    <SelectItem value="none">Non spécifié</SelectItem>
                    {MODES_PAIEMENT.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse de livraison</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresseLivraison}
                  onChange={(e) => setFormData({ ...formData, adresseLivraison: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Articles</CardTitle>
              <CardDescription>Ajoutez les produits à la commande</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchProduit}
                  onChange={(e) => setSearchProduit(e.target.value)}
                  className="pl-10"
                />
                {searchProduit && filteredProduits.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProduits.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addLigne(p)}
                        className="w-full text-left px-4 py-2 hover:bg-muted flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(p.prixVente || 0)}</p>
                          <p className="text-xs text-muted-foreground">Stock: {p.quantite}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lines Table */}
              {lignes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-24">Qté</TableHead>
                      <TableHead className="w-32">Prix unit.</TableHead>
                      <TableHead className="w-32 text-right">Montant</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((ligne, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <p className="font-medium">{ligne.designation}</p>
                          <p className="text-xs text-muted-foreground">Stock: {ligne.stock}</p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max={ligne.stock}
                            value={ligne.quantite}
                            onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={ligne.prixUnitaire || ''}
                            onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                            className="w-28"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(ligne.quantite * ligne.prixUnitaire)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLigne(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Aucun produit ajouté
                </div>
              )}

              {/* Total */}
              {lignes.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/marketing/emarket">Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving || !formData.clientId || lignes.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Créer la commande
          </Button>
        </div>
      </form>
    </div>
  );
}
