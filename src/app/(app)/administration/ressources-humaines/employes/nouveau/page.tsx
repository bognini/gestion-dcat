'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Save,
  Loader2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';

const DEPARTEMENTS = [
  'Direction',
  'Technique',
  'Commercial',
  'Marketing',
  'Finance',
  'RH',
  'Logistique',
  'Support',
];

const TYPES_CONTRAT = ['CDI', 'CDD', 'Stage', 'Freelance'];

export default function NouvelEmployePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    dateEmbauche: new Date().toISOString().split('T')[0],
    poste: '',
    departement: '',
    email: '',
    telephone: '',
    adresse: '',
    salaire: '',
    typeContrat: 'CDI',
  });

  const handleSubmit = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      toast({ variant: 'destructive', title: 'Nom et prénom requis' });
      return;
    }
    if (!formData.poste.trim()) {
      toast({ variant: 'destructive', title: 'Poste requis' });
      return;
    }
    if (!formData.dateEmbauche) {
      toast({ variant: 'destructive', title: 'Date d\'embauche requise' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const employe = await res.json();
      toast({ title: 'Employé créé' });
      router.push(`/administration/ressources-humaines/employes/${employe.id}`);
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
            <Link href="/administration/ressources-humaines/employes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-6 w-6" />
              Nouvel Employé
            </h2>
            <p className="text-muted-foreground">
              Ajouter un nouveau membre à l&apos;équipe
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
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poste">Poste *</Label>
              <Input
                id="poste"
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                placeholder="Ex: Développeur, Technicien, Commercial..."
              />
            </div>

            <div className="space-y-2">
              <Label>Département</Label>
              <Select 
                value={formData.departement} 
                onValueChange={(v) => setFormData({ ...formData, departement: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTEMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateEmbauche">Date d&apos;embauche *</Label>
              <Input
                id="dateEmbauche"
                type="date"
                value={formData.dateEmbauche}
                onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select 
                value={formData.typeContrat} 
                onValueChange={(v) => setFormData({ ...formData, typeContrat: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_CONTRAT.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaire">Salaire mensuel (FCFA)</Label>
              <Input
                id="salaire"
                type="number"
                value={formData.salaire}
                onChange={(e) => setFormData({ ...formData, salaire: e.target.value })}
                placeholder="Ex: 350000"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
