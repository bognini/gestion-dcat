'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, TrendingUp, TrendingDown, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Produit {
  id: string;
  nom: string;
  sku: string | null;
  quantite: number;
  prixVenteMin: number | null;
}

interface Fournisseur {
  id: string;
  nom: string;
}

interface Partenaire {
  id: string;
  nom: string;
  type: string | null;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
}

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
}

const ETATS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'reconditionne', label: 'Reconditionné' },
];

function NouveauMouvementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [produits, setProduits] = useState<Produit[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justificatif, setJustificatif] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'ENTREE',
    produitId: searchParams.get('produit') || '',
    quantite: 1,
    // Entry fields
    fournisseurId: '',
    etat: 'neuf',
    serialNumbers: '',
    // Exit fields
    prixVenteDefinitif: '',
    demandeurId: '',
    destinationType: 'PARTENAIRE',
    partenaireDstId: '',
    projetId: '',
    destinationNom: '',
    destinationContact: '',
    // Common
    commentaire: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, fournRes, partRes, userRes, projRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/fournisseurs'),
        fetch('/api/partenaires'),
        fetch('/api/utilisateurs'),
        fetch('/api/projets'),
      ]);
      
      if (prodRes.ok) setProduits(await prodRes.json());
      if (fournRes.ok) setFournisseurs(await fournRes.json());
      if (partRes.ok) setPartenaires(await partRes.json());
      if (userRes.ok) setUtilisateurs(await userRes.json());
      if (projRes.ok) setProjets(await projRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduit = produits.find(p => p.id === formData.produitId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setJustificatif(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.produitId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un produit' });
      return;
    }

    if (!formData.quantite || formData.quantite <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La quantité doit être positive' });
      return;
    }

    // Validate exit-specific fields
    if (formData.type === 'SORTIE') {
      if (!formData.demandeurId) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le demandeur est requis pour une sortie' });
        return;
      }
      if (formData.destinationType === 'PARTICULIER' && !formData.destinationNom.trim()) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du destinataire est requis' });
        return;
      }
      if (formData.destinationType === 'PROJET' && !formData.projetId) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le projet est requis' });
        return;
      }
    }

    setSaving(true);
    try {
      // Parse serial numbers
      const serialNumbers = formData.serialNumbers
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Prepare destination
      let destination = null;
      if (formData.type === 'SORTIE') {
        if (formData.destinationType === 'PARTICULIER') {
          destination = formData.destinationNom.trim();
        }
      }

      const requestBody = {
        type: formData.type,
        produitId: formData.produitId,
        quantite: formData.quantite,
        serialNumbers,
        commentaire: formData.commentaire || null,
        // Entry-specific
        ...(formData.type === 'ENTREE' && {
          fournisseurId: formData.fournisseurId || null,
          etat: formData.etat,
        }),
        // Exit-specific
        ...(formData.type === 'SORTIE' && {
          prixVenteDefinitif: formData.prixVenteDefinitif ? Number(formData.prixVenteDefinitif) : null,
          demandeurId: formData.demandeurId || null,
          destinationType: formData.destinationType,
          partenaireDstId: formData.destinationType === 'PARTENAIRE' ? formData.partenaireDstId || null : null,
          projetId: formData.destinationType === 'PROJET' ? formData.projetId || null : null,
          destination,
          destinationContact: formData.destinationType === 'PARTICULIER' ? formData.destinationContact || null : null,
        }),
      };

      const res = await fetch('/api/mouvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      // Upload justificatif if any
      if (justificatif) {
        const formDataFile = new FormData();
        formDataFile.append('file', justificatif);
        
        await fetch(`/api/mouvements/${data.id}/justificatif`, {
          method: 'POST',
          body: formDataFile,
        });
      }

      toast({
        title: 'Mouvement enregistré',
        description: `${formData.type === 'ENTREE' ? 'Entrée' : 'Sortie'} de ${formData.quantite} unité(s)`,
      });

      router.push('/stock/mouvements');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock/mouvements">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nouveau mouvement</h2>
          <p className="text-muted-foreground">
            Enregistrez une entrée ou sortie de stock
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Type de mouvement</CardTitle>
            <CardDescription>Choisissez le type d&apos;opération</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v })}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="ENTREE" id="entree" className="peer sr-only" />
                <Label
                  htmlFor="entree"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/10"
                  )}
                >
                  <TrendingUp className="mb-3 h-6 w-6 text-green-500" />
                  <span className="font-semibold text-foreground">Entrée</span>
                  <span className="text-sm text-muted-foreground">Réception de stock</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="SORTIE" id="sortie" className="peer sr-only" />
                <Label
                  htmlFor="sortie"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/10"
                  )}
                >
                  <TrendingDown className="mb-3 h-6 w-6 text-red-500" />
                  <span className="font-semibold text-foreground">Sortie</span>
                  <span className="text-sm text-muted-foreground">Livraison / Utilisation</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du mouvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="produitId">Produit *</Label>
              <Select 
                value={formData.produitId} 
                onValueChange={(v) => setFormData({ ...formData, produitId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} {p.sku && `(${p.sku})`} - Stock: {p.quantite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduit && (
                <p className="text-sm text-muted-foreground">
                  Stock actuel: <span className="font-medium">{selectedProduit.quantite}</span> unité(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité *</Label>
              <Input
                id="quantite"
                type="number"
                min="1"
                max={formData.type === 'SORTIE' && selectedProduit ? selectedProduit.quantite : undefined}
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
              />
              {formData.type === 'SORTIE' && selectedProduit && formData.quantite > selectedProduit.quantite && (
                <p className="text-sm text-red-500">
                  Quantité supérieure au stock disponible ({selectedProduit.quantite})
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entry-specific fields */}
        {formData.type === 'ENTREE' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Détails de l&apos;entrée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fournisseurId">Fournisseur</Label>
                <Select 
                  value={formData.fournisseurId} 
                  onValueChange={(v) => setFormData({ ...formData, fournisseurId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="etat">État des produits *</Label>
                <Select 
                  value={formData.etat} 
                  onValueChange={(v) => setFormData({ ...formData, etat: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETATS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumbers">Numéros de série (optionnel)</Label>
                <Textarea
                  id="serialNumbers"
                  value={formData.serialNumbers}
                  onChange={(e) => setFormData({ ...formData, serialNumbers: e.target.value })}
                  placeholder="Séparez par des virgules: SN001, SN002, SN003..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Séparez les numéros de série par des virgules</p>
              </div>

              <div className="space-y-2">
                <Label>Justificatif (optionnel)</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {justificatif ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">{justificatif.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); setJustificatif(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Facture, Bon de livraison...</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exit-specific fields */}
        {formData.type === 'SORTIE' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Détails de la sortie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prixVenteDefinitif">Prix de vente définitif (CFA)</Label>
                <Input
                  id="prixVenteDefinitif"
                  type="number"
                  min="0"
                  value={formData.prixVenteDefinitif}
                  onChange={(e) => setFormData({ ...formData, prixVenteDefinitif: e.target.value })}
                  placeholder={selectedProduit?.prixVenteMin ? `Min: ${selectedProduit.prixVenteMin}` : 'Prix de vente'}
                />
                {selectedProduit?.prixVenteMin && Number(formData.prixVenteDefinitif) < selectedProduit.prixVenteMin && formData.prixVenteDefinitif && (
                  <p className="text-sm text-orange-500">
                    Attention: Prix inférieur au minimum ({selectedProduit.prixVenteMin} CFA)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumbers">Numéros de série (optionnel)</Label>
                <Textarea
                  id="serialNumbers"
                  value={formData.serialNumbers}
                  onChange={(e) => setFormData({ ...formData, serialNumbers: e.target.value })}
                  placeholder="Séparez par des virgules: SN001, SN002, SN003..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demandeurId">Demandeur *</Label>
                <Select 
                  value={formData.demandeurId} 
                  onValueChange={(v) => setFormData({ ...formData, demandeurId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {utilisateurs.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de destination *</Label>
                <RadioGroup
                  value={formData.destinationType}
                  onValueChange={(v) => setFormData({ ...formData, destinationType: v, partenaireDstId: '', projetId: '', destinationNom: '', destinationContact: '' })}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PARTENAIRE" id="dst-partenaire" />
                    <Label htmlFor="dst-partenaire" className="cursor-pointer">Partenaire/Client</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PROJET" id="dst-projet" />
                    <Label htmlFor="dst-projet" className="cursor-pointer">Projet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PARTICULIER" id="dst-particulier" />
                    <Label htmlFor="dst-particulier" className="cursor-pointer">Particulier</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.destinationType === 'PARTENAIRE' && (
                <div className="space-y-2">
                  <Label htmlFor="partenaireDstId">Partenaire / Client</Label>
                  <Select 
                    value={formData.partenaireDstId} 
                    onValueChange={(v) => setFormData({ ...formData, partenaireDstId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un partenaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {partenaires.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.destinationType === 'PROJET' && (
                <div className="space-y-2">
                  <Label htmlFor="projetId">Projet *</Label>
                  <Select 
                    value={formData.projetId} 
                    onValueChange={(v) => setFormData({ ...formData, projetId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.reference || p.nom} - {p.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.destinationType === 'PARTICULIER' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destinationNom">Nom complet *</Label>
                    <Input
                      id="destinationNom"
                      value={formData.destinationNom}
                      onChange={(e) => setFormData({ ...formData, destinationNom: e.target.value })}
                      placeholder="Nom du destinataire"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinationContact">Contact</Label>
                    <Input
                      id="destinationContact"
                      value={formData.destinationContact}
                      onChange={(e) => setFormData({ ...formData, destinationContact: e.target.value })}
                      placeholder="Téléphone ou email"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Justificatif (optionnel)</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {justificatif ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">{justificatif.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); setJustificatif(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Facture, Bon de sortie...</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/stock/mouvements">Annuler</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={saving || (formData.type === 'SORTIE' && selectedProduit && formData.quantite > selectedProduit.quantite)}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NouveauMouvementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <NouveauMouvementContent />
    </Suspense>
  );
}
