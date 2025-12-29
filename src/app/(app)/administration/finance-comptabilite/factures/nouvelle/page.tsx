'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  Save, 
  Search,
  ArrowLeft,
  Building2,
  User,
  Briefcase,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string;
  tags?: string[];
  prixVente: number;
  categorie?: { nom: string } | null;
  marque?: { nom: string } | null;
}

interface FactureLigne {
  id: string;
  produitId?: string;
  reference: string;
  designation: string;
  details?: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
}

interface Partenaire {
  id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  email?: string;
  telephone1?: string;
}

interface Devis {
  id: string;
  reference: string;
  clientNom: string;
  objet: string;
  totalHT: number;
  lignes: {
    reference: string;
    designation: string;
    details?: string;
    quantite: number;
    unite: string;
    prixUnitaire: number;
    montant: number;
    produitId?: string;
  }[];
}

export default function NouvelleFacturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const devisId = searchParams.get('devis');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [clientType, setClientType] = useState('entreprise');
  const [clientNom, setClientNom] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientVille, setClientVille] = useState('');
  const [clientPays, setClientPays] = useState('Côte d\'Ivoire');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [partenaireId, setPartenaireId] = useState<string>('');
  const [linkedDevisId, setLinkedDevisId] = useState<string>('');
  const [objet, setObjet] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<FactureLigne[]>([]);

  useEffect(() => {
    fetchData();
  }, [devisId]);

  const fetchData = async () => {
    try {
      const [prodRes, partRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/partenaires'),
      ]);
      
      if (prodRes.ok) setProduits(await prodRes.json());
      if (partRes.ok) setPartenaires(await partRes.json());

      // If devisId is provided, load devis data
      if (devisId) {
        const devisRes = await fetch(`/api/devis/${devisId}`);
        if (devisRes.ok) {
          const devis: Devis = await devisRes.json();
          setLinkedDevisId(devis.id);
          setClientNom(devis.clientNom);
          setObjet(devis.objet);
          setLignes(devis.lignes.map((l, idx) => ({
            id: crypto.randomUUID(),
            produitId: l.produitId,
            reference: l.reference,
            designation: l.designation,
            details: l.details,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: l.prixUnitaire,
            montant: l.montant,
          })));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePartenaireSelect = (pId: string) => {
    setPartenaireId(pId);
    const partenaire = partenaires.find(p => p.id === pId);
    if (partenaire) {
      setClientNom(partenaire.nom);
      setClientAdresse(partenaire.adresse || '');
      setClientVille(partenaire.ville || '');
      setClientPays(partenaire.pays || 'Côte d\'Ivoire');
      setClientEmail(partenaire.email || '');
      setClientTelephone(partenaire.telephone1 || '');
    }
  };

  const addLigneFromProduct = (produit: Produit) => {
    const newLigne: FactureLigne = {
      id: crypto.randomUUID(),
      produitId: produit.id,
      reference: produit.sku || 'REF-',
      designation: produit.nom,
      details: produit.marque?.nom || '',
      quantite: 1,
      unite: 'u',
      prixUnitaire: produit.prixVente || 0,
      montant: produit.prixVente || 0,
    };
    setLignes([...lignes, newLigne]);
    setProductDialogOpen(false);
    setProductSearch('');
  };

  const addLigneLibre = () => {
    const newLigne: FactureLigne = {
      id: crypto.randomUUID(),
      reference: 'REF-',
      designation: '',
      quantite: 1,
      unite: 'u',
      prixUnitaire: 0,
      montant: 0,
    };
    setLignes([...lignes, newLigne]);
  };

  const updateLigne = (lineId: string, field: keyof FactureLigne, value: string | number) => {
    setLignes(lignes.map(l => {
      if (l.id !== lineId) return l;
      const updated = { ...l, [field]: value };
      if (field === 'quantite' || field === 'prixUnitaire') {
        updated.montant = updated.quantite * updated.prixUnitaire;
      }
      return updated;
    }));
  };

  const removeLigne = (lineId: string) => {
    setLignes(lignes.filter(l => l.id !== lineId));
  };

  const totalHT = lignes.reduce((sum, l) => sum + l.montant, 0);

  const filteredProducts = produits.filter((p) => {
    const terms = productSearch.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return true;
    return terms.some((term) =>
      p.nom.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  const handleSubmit = async () => {
    if (!clientNom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du client est requis' });
      return;
    }
    if (lignes.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Ajoutez au moins une ligne' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNom,
          clientAdresse,
          clientVille,
          clientPays,
          clientEmail,
          clientTelephone,
          partenaireId: partenaireId || null,
          devisId: linkedDevisId || null,
          objet,
          dateEcheance: dateEcheance || null,
          notes,
          lignes: lignes.map((l, idx) => ({
            ordre: idx,
            produitId: l.produitId || null,
            reference: l.reference,
            designation: l.designation,
            details: l.details || null,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: l.prixUnitaire,
            montant: l.montant,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const facture = await res.json();
      toast({ title: 'Facture créée' });
      router.push(`/administration/finance-comptabilite/factures/${facture.id}`);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Erreur' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administration/finance-comptabilite/factures">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Nouvelle Facture</h2>
            <p className="text-muted-foreground">
              {devisId ? 'Facture depuis un devis' : 'Créer une nouvelle facture'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de client</Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entreprise">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Entreprise
                    </div>
                  </SelectItem>
                  <SelectItem value="partenaire">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Partenaire existant
                    </div>
                  </SelectItem>
                  <SelectItem value="particulier">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Particulier
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clientType === 'partenaire' && (
              <div className="space-y-2">
                <Label>Sélectionner un partenaire</Label>
                <Select value={partenaireId} onValueChange={handlePartenaireSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un partenaire..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partenaires.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="clientNom">Nom / Raison sociale *</Label>
              <Input
                id="clientNom"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientVille">Ville</Label>
                <Input
                  id="clientVille"
                  value={clientVille}
                  onChange={(e) => setClientVille(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPays">Pays</Label>
                <Input
                  id="clientPays"
                  value={clientPays}
                  onChange={(e) => setClientPays(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientAdresse">Adresse</Label>
              <Input
                id="clientAdresse"
                value={clientAdresse}
                onChange={(e) => setClientAdresse(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientTelephone">Téléphone</Label>
                <Input
                  id="clientTelephone"
                  value={clientTelephone}
                  onChange={(e) => setClientTelephone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facture Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Facture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objet">Objet / Description</Label>
              <Textarea
                id="objet"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateEcheance">Date d&apos;échéance</Label>
              <Input
                id="dateEcheance"
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes visibles uniquement en interne"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lignes de facture */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lignes de facture</CardTitle>
          <div className="flex gap-2">
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Sélectionner un produit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou référence..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead className="text-right">Prix</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              Aucun produit trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProducts.slice(0, 20).map(p => (
                            <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => addLigneFromProduct(p)}>
                              <TableCell className="font-mono">{p.sku || '-'}</TableCell>
                              <TableCell>{p.nom}</TableCell>
                              <TableCell>{p.marque?.nom || '-'}</TableCell>
                              <TableCell className="text-right">{formatCurrency(p.prixVente || 0)}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={addLigneLibre}>
              <Plus className="mr-2 h-4 w-4" />
              Ligne libre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">REF.</TableHead>
                <TableHead>DESIGNATION</TableHead>
                <TableHead className="w-20">QTE</TableHead>
                <TableHead className="w-20">Unité</TableHead>
                <TableHead className="w-32 text-right">P.U</TableHead>
                <TableHead className="w-32 text-right">MONTANT</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune ligne ajoutée
                  </TableCell>
                </TableRow>
              ) : (
                lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell>
                      <Input
                        value={ligne.reference}
                        onChange={(e) => updateLigne(ligne.id, 'reference', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={ligne.designation}
                          onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                          className="h-8"
                        />
                        <Input
                          value={ligne.details || ''}
                          onChange={(e) => updateLigne(ligne.id, 'details', e.target.value)}
                          className="h-7 text-xs italic text-muted-foreground"
                          placeholder="Détails (optionnel)"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(ligne.id, 'quantite', parseInt(e.target.value) || 0)}
                        className="h-8 w-16 text-center"
                        min={1}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={ligne.unite} onValueChange={(v) => updateLigne(ligne.id, 'unite', v)}>
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="u">u</SelectItem>
                          <SelectItem value="h">h</SelectItem>
                          <SelectItem value="j">j</SelectItem>
                          <SelectItem value="mois">mois</SelectItem>
                          <SelectItem value="lot">lot</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyInput
                        value={ligne.prixUnitaire || ''}
                        onChange={(e) => updateLigne(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ligne.montant)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeLigne(ligne.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {lignes.length > 0 && (
              <TableFooter>
                <TableRow className="bg-indigo-600 text-white hover:bg-indigo-600">
                  <TableCell colSpan={5} className="text-right font-bold">
                    TOTAL TTC
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalHT)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
