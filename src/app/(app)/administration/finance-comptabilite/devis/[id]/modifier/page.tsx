'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
  Copy
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
  categorie: { nom: string };
  marque: { nom: string };
}

interface DevisLigne {
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

export default function ModifierDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [reference, setReference] = useState('');
  const [objet, setObjet] = useState('');
  const [clientType, setClientType] = useState('entreprise');
  const [clientNom, setClientNom] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientVille, setClientVille] = useState('');
  const [clientPays, setClientPays] = useState('Côte d\'Ivoire');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [partenaireId, setPartenaireId] = useState<string>('');
  const [delaiLivraison, setDelaiLivraison] = useState('1 semaine');
  const [conditionLivraison, setConditionLivraison] = useState('A convenir ensemble');
  const [validiteOffre, setValiditeOffre] = useState(30);
  const [garantie, setGarantie] = useState('1 AN');
  const [statut, setStatut] = useState('brouillon');
  const [lignes, setLignes] = useState<DevisLigne[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [devisRes, prodRes, partRes] = await Promise.all([
        fetch(`/api/devis/${id}`),
        fetch('/api/produits'),
        fetch('/api/partenaires'),
      ]);
      
      if (prodRes.ok) setProduits(await prodRes.json());
      if (partRes.ok) setPartenaires(await partRes.json());
      
      if (devisRes.ok) {
        const devis = await devisRes.json();
        setReference(devis.reference);
        setObjet(devis.objet);
        setClientType(devis.clientType);
        setClientNom(devis.clientNom);
        setClientAdresse(devis.clientAdresse || '');
        setClientVille(devis.clientVille || '');
        setClientPays(devis.clientPays || 'Côte d\'Ivoire');
        setClientEmail(devis.clientEmail || '');
        setClientTelephone(devis.clientTelephone || '');
        setPartenaireId(devis.partenaireId || '');
        setDelaiLivraison(devis.delaiLivraison || '');
        setConditionLivraison(devis.conditionLivraison || '');
        setValiditeOffre(devis.validiteOffre || 30);
        setGarantie(devis.garantie || '');
        setStatut(devis.statut);
        setLignes(devis.lignes.map((l: DevisLigne) => ({
          id: l.id,
          produitId: l.produitId,
          reference: l.reference,
          designation: l.designation,
          details: l.details || '',
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          montant: l.montant,
        })));
      } else {
        toast({ variant: 'destructive', title: 'Devis non trouvé' });
        router.push('/administration/finance-comptabilite/devis');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
    const newLigne: DevisLigne = {
      id: crypto.randomUUID(),
      produitId: produit.id,
      reference: produit.sku || produit.categorie.nom.substring(0, 8).toUpperCase(),
      designation: produit.nom,
      details: `${produit.marque.nom}`,
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
    const newLigne: DevisLigne = {
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

  const updateLigne = (lineId: string, field: keyof DevisLigne, value: string | number) => {
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
    if (!objet.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'objet du devis est requis' });
      return;
    }
    if (!clientNom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du client est requis' });
      return;
    }
    if (lignes.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Ajoutez au moins une ligne au devis' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objet,
          clientType,
          clientNom,
          clientAdresse,
          clientVille,
          clientPays,
          clientEmail,
          clientTelephone,
          partenaireId: partenaireId || null,
          delaiLivraison,
          conditionLivraison,
          validiteOffre,
          garantie,
          statut,
          totalHT,
          totalTTC: totalHT,
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
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }

      toast({ title: 'Succès', description: 'Devis mis à jour' });
      router.push(`/administration/finance-comptabilite/devis/${id}`);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Erreur' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRevision = async () => {
    setCreatingRevision(true);
    try {
      const res = await fetch(`/api/devis/${id}/revision`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la création de la révision');
      }

      const revision = await res.json();
      toast({ title: 'Révision créée', description: `Nouvelle révision: ${revision.reference}` });
      router.push(`/administration/finance-comptabilite/devis/${revision.id}/modifier`);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Erreur' 
      });
    } finally {
      setCreatingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/administration/finance-comptabilite/devis/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Modifier Devis {reference}</h2>
            <p className="text-muted-foreground">
              Modifiez les informations du devis
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={saving || creatingRevision}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
          <Button variant="outline" onClick={handleCreateRevision} disabled={saving || creatingRevision}>
            {creatingRevision && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Copy className="mr-2 h-4 w-4" />
            Créer une Révision
          </Button>
        </div>
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

        {/* Devis Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objet">Objet du devis *</Label>
              <Textarea
                id="objet"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                  <SelectItem value="accepte">Accepté</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delaiLivraison">Délai de livraison</Label>
                <Input
                  id="delaiLivraison"
                  value={delaiLivraison}
                  onChange={(e) => setDelaiLivraison(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validiteOffre">Validité (jours)</Label>
                <Input
                  id="validiteOffre"
                  type="number"
                  value={validiteOffre}
                  onChange={(e) => setValiditeOffre(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditionLivraison">Condition de livraison</Label>
              <Input
                id="conditionLivraison"
                value={conditionLivraison}
                onChange={(e) => setConditionLivraison(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garantie">Garantie</Label>
              <Input
                id="garantie"
                value={garantie}
                onChange={(e) => setGarantie(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lignes du devis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lignes du devis</CardTitle>
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
                              <TableCell>{p.marque.nom}</TableCell>
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
                        <Textarea
                          value={ligne.details || ''}
                          onChange={(e) => updateLigne(ligne.id, 'details', e.target.value)}
                          className="min-h-[60px] text-xs italic text-muted-foreground resize-none"
                          placeholder="Détails (optionnel)"
                          rows={2}
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
                <TableRow className="bg-blue-600 text-white hover:bg-blue-600">
                  <TableCell colSpan={5} className="text-right font-bold">
                    TOTAL GENERAL HT
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
