'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  ArrowLeft,
  Loader2,
  Save,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  tags?: string[];
  quantite: number;
}

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
}

export default function AjouterMaterielPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [projet, setProjet] = useState<Projet | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projetRes, produitsRes] = await Promise.all([
        fetch(`/api/projets/${id}`),
        fetch('/api/produits'),
      ]);
      
      if (projetRes.ok) setProjet(await projetRes.json());
      if (produitsRes.ok) setProduits(await produitsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProduits = produits.filter(p => {
    if (p.quantite <= 0) return false;
    const terms = searchQuery.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return true;
    return terms.some((term) =>
      p.nom.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.tags?.some((t) => t.toLowerCase().includes(term))
    );
  }).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduit) {
      toast({ variant: 'destructive', title: 'Sélectionnez un produit' });
      return;
    }

    if (quantite > selectedProduit.quantite) {
      toast({ variant: 'destructive', title: 'Stock insuffisant' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/projets/${id}/materiels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitId: selectedProduit.id,
          quantite,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      toast({
        title: 'Matériel ajouté',
        description: `${quantite}x ${selectedProduit.nom} ajouté au projet`,
      });
      router.push(`/technique/projets/${id}`);
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
          <Link href={`/technique/projets/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Ajouter du matériel
          </h2>
          <p className="text-muted-foreground">
            {projet?.reference || projet?.nom || 'Projet'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Sélectionner un produit</CardTitle>
            <CardDescription>
              Choisissez un produit du stock à associer à ce projet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="space-y-2">
              <Label>Rechercher un produit</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom ou SKU du produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Product List */}
            {searchQuery && (
              <div className="border rounded-lg max-h-60 overflow-auto">
                {filteredProduits.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-sm">
                    Aucun produit disponible
                  </p>
                ) : (
                  filteredProduits.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduit(p);
                        setSearchQuery('');
                        setQuantite(1);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted flex justify-between items-center border-b last:border-b-0 ${
                        selectedProduit?.id === p.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium">{p.nom}</p>
                        {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Stock: {p.quantite}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Product */}
            {selectedProduit && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-medium">{selectedProduit.nom}</p>
                    {selectedProduit.sku && (
                      <p className="text-xs text-muted-foreground font-mono">{selectedProduit.sku}</p>
                    )}
                  </div>
                  <span className="text-sm">Stock disponible: {selectedProduit.quantite}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantite">Quantité à utiliser</Label>
                  <Input
                    id="quantite"
                    type="number"
                    min="1"
                    max={selectedProduit.quantite}
                    value={quantite}
                    onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/technique/projets/${id}`}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={saving || !selectedProduit}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Ajouter au projet
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
