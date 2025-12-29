'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Partenaire {
  id: string;
  nom: string;
  telephone1: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
}

export default function NouveauClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [clientType, setClientType] = useState<'particulier' | 'partenaire'>('particulier');
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: "Côte d'Ivoire",
    partenaireId: '',
  });

  useEffect(() => {
    fetchPartenaires();
  }, []);

  const fetchPartenaires = async () => {
    try {
      const res = await fetch('/api/partenaires');
      if (res.ok) setPartenaires(await res.json());
    } catch (error) {
      console.error('Error fetching partenaires:', error);
    }
  };

  const handlePartenaireSelect = (partenaireId: string) => {
    setFormData({ ...formData, partenaireId });
    const partenaire = partenaires.find(p => p.id === partenaireId);
    if (partenaire) {
      setFormData({
        ...formData,
        partenaireId,
        nom: partenaire.nom,
        telephone: partenaire.telephone1 || '',
        email: partenaire.email || '',
        adresse: partenaire.adresse || '',
        ville: partenaire.ville || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/emarket/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const client = await res.json();
      toast({
        title: 'Client créé',
        description: `${client.nom} a été ajouté`,
      });
      router.push('/marketing/emarket');
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
            <Users className="h-6 w-6" />
            Nouveau Client
          </h2>
          <p className="text-muted-foreground">
            Ajouter un nouveau client E-Market
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
            <CardDescription>Coordonnées et informations de contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Type Selection */}
            <div className="space-y-3">
              <Label>Type de client</Label>
              <RadioGroup
                value={clientType}
                onValueChange={(v) => {
                  setClientType(v as 'particulier' | 'partenaire');
                  if (v === 'particulier') {
                    setFormData({ ...formData, partenaireId: '', nom: '', telephone: '', email: '', adresse: '', ville: '' });
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="particulier" id="particulier" />
                  <Label htmlFor="particulier" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Particulier
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partenaire" id="partenaire" />
                  <Label htmlFor="partenaire" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    Partenaire existant
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Partenaire Selection */}
            {clientType === 'partenaire' && (
              <div className="space-y-2">
                <Label htmlFor="partenaireId">Sélectionner le partenaire *</Label>
                <Select 
                  value={formData.partenaireId} 
                  onValueChange={handlePartenaireSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partenaires.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name fields - only for particulier */}
            {clientType === 'particulier' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required={clientType === 'particulier'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+225 XX XX XX XX XX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Abidjan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/marketing/emarket">Annuler</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Créer le client
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
