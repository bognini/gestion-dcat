'use client';

import { useState, useEffect, use } from 'react';
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

interface Intervention {
  id: string;
  reference: string | null;
  date: string;
  partenaireId: string;
  typeMaintenance: string;
  typeDefaillance: string | null;
  causeDefaillance: string | null;
  problemeSignale: string;
  rapport: string | null;
  recommandations: string | null;
  statut: string;
  dureeMinutes: number | null;
  lieu: string | null;
  modeIntervention: string | null;
  intervenants: Array<{
    utilisateur: { id: string };
  }>;
}

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

export default function ModifierInterventionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [selectedIntervenants, setSelectedIntervenants] = useState<string[]>([]);
  const [reference, setReference] = useState<string>('');
  
  const [formData, setFormData] = useState({
    date: '',
    partenaireId: '',
    problemeSignale: '',
    typeMaintenance: '',
    typeDefaillance: 'none',
    causeDefaillance: 'none',
    modeIntervention: 'none',
    statut: '',
    lieu: '',
    dureeMinutes: '',
    rapport: '',
    recommandations: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [intRes, partRes, userRes] = await Promise.all([
        fetch(`/api/interventions/${id}`),
        fetch('/api/partenaires'),
        fetch('/api/utilisateurs'),
      ]);
      
      if (!intRes.ok) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Intervention non trouvée' });
        router.push('/technique/interventions');
        return;
      }

      const intervention: Intervention = await intRes.json();
      
      setReference(intervention.reference || '');
      setFormData({
        date: intervention.date.split('T')[0],
        partenaireId: intervention.partenaireId,
        problemeSignale: intervention.problemeSignale,
        typeMaintenance: intervention.typeMaintenance,
        typeDefaillance: intervention.typeDefaillance || 'none',
        causeDefaillance: intervention.causeDefaillance || 'none',
        modeIntervention: intervention.modeIntervention || 'none',
        statut: intervention.statut,
        lieu: intervention.lieu || '',
        dureeMinutes: intervention.dureeMinutes?.toString() || '',
        rapport: intervention.rapport || '',
        recommandations: intervention.recommandations || '',
      });
      setSelectedIntervenants(intervention.intervenants.map(i => i.utilisateur.id));
      
      if (partRes.ok) setPartenaires(await partRes.json());
      if (userRes.ok) setUtilisateurs(await userRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger l\'intervention' });
    } finally {
      setLoading(false);
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
      const res = await fetch(`/api/interventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          typeDefaillance: formData.typeDefaillance !== 'none' ? formData.typeDefaillance : null,
          causeDefaillance: formData.causeDefaillance !== 'none' ? formData.causeDefaillance : null,
          modeIntervention: formData.modeIntervention !== 'none' ? formData.modeIntervention : null,
          dureeMinutes: formData.dureeMinutes || null,
          intervenantIds: selectedIntervenants,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      toast({
        title: 'Intervention modifiée',
        description: 'Les modifications ont été enregistrées',
      });
      router.push(`/technique/interventions/${id}`);
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
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/technique/interventions/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Modifier l&apos;Intervention
          </h2>
          <p className="text-muted-foreground font-mono">
            {reference}
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
                  <Label htmlFor="statut">Statut</Label>
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
                <Label htmlFor="problemeSignale">Problème signalé *</Label>
                <Textarea
                  id="problemeSignale"
                  value={formData.problemeSignale}
                  onChange={(e) => setFormData({ ...formData, problemeSignale: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modeIntervention">Mode d&apos;intervention</Label>
                <Select 
                  value={formData.modeIntervention} 
                  onValueChange={(v) => setFormData({ ...formData, modeIntervention: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non spécifié</SelectItem>
                    {MODES_INTERVENTION.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lieu">Lieu</Label>
                  <Input
                    id="lieu"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info & Team */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic technique</CardTitle>
                <CardDescription>Informations sur la défaillance</CardDescription>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non spécifié</SelectItem>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non spécifiée</SelectItem>
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
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommandations">Recommandations</Label>
                  <Textarea
                    id="recommandations"
                    value={formData.recommandations}
                    onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
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
            <Link href={`/technique/interventions/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
