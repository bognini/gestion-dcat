'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, 
  ArrowLeft,
  Loader2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string | null;
}

const TYPES_INTERVENTION = [
  { value: 'intervention', label: 'Intervention' },
  { value: 'maintenance_planifiee', label: 'Maintenance planifiée' },
  { value: 'autre', label: 'Autre' },
];

const TYPES_DEFAILLANCE = [
  { value: 'logicielle', label: 'Logicielle' },
  { value: 'materielle', label: 'Matérielle' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'autre', label: 'Autre' },
];

const CAUSES_DEFAILLANCE = [
  { value: 'usure_normale', label: 'Usure normale' },
  { value: 'defaut_utilisateur', label: 'Défaut utilisateur' },
  { value: 'defaut_produit', label: 'Défaut produit' },
  { value: 'autre', label: 'Autre' },
];

const MODES_INTERVENTION = [
  { value: 'sur_site', label: 'Sur site' },
  { value: 'a_distance', label: 'À distance' },
];

const STATUTS = [
  { value: 'a_faire', label: 'À faire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'termine', label: 'Terminé' },
];

export default function NouvelleInterventionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [selectedIntervenants, setSelectedIntervenants] = useState<string[]>([]);
  
  const [typeIntervention, setTypeIntervention] = useState('intervention');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partenaireId: '',
    problemeSignale: '',
    typeMaintenance: '',
    typeDefaillance: '',
    causeDefaillance: '',
    modeIntervention: '',
    statut: 'a_faire',
    lieu: '',
    dureeMinutes: '',
    rapport: '',
    recommandations: '',
  });

  const isMaintenance = typeIntervention === 'maintenance_planifiee';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partRes, userRes] = await Promise.all([
        fetch('/api/partenaires'),
        fetch('/api/utilisateurs'),
      ]);
      
      if (partRes.ok) setPartenaires(await partRes.json());
      if (userRes.ok) setUtilisateurs(await userRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toggleIntervenant = (userId: string) => {
    setSelectedIntervenants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          typeMaintenance: typeIntervention,
          intervenantIds: selectedIntervenants,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const intervention = await res.json();
      toast({
        title: 'Intervention créée',
        description: `L'intervention ${intervention.reference} a été créée`,
      });
      router.push(`/technique/interventions/${intervention.id}`);
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
          <Link href="/technique/interventions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Nouvelle Intervention
          </h2>
          <p className="text-muted-foreground">
            Créez une nouvelle fiche d&apos;intervention
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails de l&apos;intervention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type d&apos;opération *</Label>
                <Select value={typeIntervention} onValueChange={setTypeIntervention}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_INTERVENTION.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isMaintenance && (
                  <p className="text-xs text-muted-foreground">
                    Pour une maintenance planifiée, les champs problème signalé, type et cause de défaillance sont optionnels.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">État</Label>
                  <Select 
                    value={formData.statut} 
                    onValueChange={(v) => setFormData({ ...formData, statut: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUTS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lieu">Lieu</Label>
                  <Input
                    id="lieu"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    placeholder="Adresse ou site"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dureeMinutes">Durée (minutes)</Label>
                  <Input
                    id="dureeMinutes"
                    type="number"
                    min="0"
                    value={formData.dureeMinutes}
                    onChange={(e) => setFormData({ ...formData, dureeMinutes: e.target.value })}
                    placeholder="Ex: 120"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partenaire">Partenaire / Client *</Label>
                <Select 
                  value={formData.partenaireId} 
                  onValueChange={(v) => setFormData({ ...formData, partenaireId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partenaires.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemeSignale">Problème signalé {!isMaintenance && '*'}</Label>
                <Textarea
                  id="problemeSignale"
                  value={formData.problemeSignale}
                  onChange={(e) => setFormData({ ...formData, problemeSignale: e.target.value })}
                  placeholder={isMaintenance ? "Optionnel pour maintenance planifiée..." : "Description du problème..."}
                  rows={3}
                  required={!isMaintenance}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modeIntervention">Mode d&apos;intervention</Label>
                <Select 
                  value={formData.modeIntervention} 
                  onValueChange={(v) => setFormData({ ...formData, modeIntervention: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_INTERVENTION.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info & Team */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic technique</CardTitle>
                <CardDescription>
                  {isMaintenance ? 'Optionnel pour maintenance planifiée' : 'Informations sur la défaillance'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="typeDefaillance">Type de défaillance</Label>
                    <Select 
                      value={formData.typeDefaillance} 
                      onValueChange={(v) => setFormData({ ...formData, typeDefaillance: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_DEFAILLANCE.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="causeDefaillance">Cause de la défaillance</Label>
                    <Select 
                      value={formData.causeDefaillance} 
                      onValueChange={(v) => setFormData({ ...formData, causeDefaillance: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAUSES_DEFAILLANCE.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rapport">Rapport d&apos;intervention</Label>
                  <Textarea
                    id="rapport"
                    value={formData.rapport}
                    onChange={(e) => setFormData({ ...formData, rapport: e.target.value })}
                    placeholder="Actions réalisées..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommandations">Recommandations</Label>
                  <Textarea
                    id="recommandations"
                    value={formData.recommandations}
                    onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                    placeholder="Suggestions et recommandations..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Équipe d&apos;intervention</CardTitle>
                <CardDescription>Sélectionnez les intervenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {utilisateurs.map(u => (
                    <div key={u.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                      <Checkbox
                        id={u.id}
                        checked={selectedIntervenants.includes(u.id)}
                        onCheckedChange={() => toggleIntervenant(u.id)}
                      />
                      <label htmlFor={u.id} className="text-sm cursor-pointer">
                        {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedIntervenants.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedIntervenants.length} intervenant(s) sélectionné(s)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/technique/interventions">Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Créer l&apos;intervention
          </Button>
        </div>
      </form>
    </div>
  );
}
