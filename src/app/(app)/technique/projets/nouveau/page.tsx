'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FolderKanban, 
  ArrowLeft,
  Loader2,
  Save
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
import { useToast } from '@/hooks/use-toast';

interface Partenaire {
  id: string;
  nom: string;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
}

const CATEGORIES = [
  { value: 'audiovisuel', label: 'Audiovisuel' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'domotique', label: 'Domotique' },
  { value: 'energie', label: 'Énergie' },
];

const TYPES = [
  { value: 'externe', label: 'Externe (Client)' },
  { value: 'interne', label: 'Interne' },
  { value: 'mission', label: 'Mission' },
];

const PRIORITES = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
];

export default function NouveauProjetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    partenaireId: '',
    categorie: '',
    type: '',
    priorite: 'moyenne',
    devisEstimatif: '',
    dureeJours: '',
    dateDebut: '',
    dateFinEstimative: '',
    lieu: '',
    responsableId: '',
    description: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/projets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const projet = await res.json();
      toast({
        title: 'Projet créé',
        description: `Le projet "${projet.nom}" a été créé avec succès`,
      });
      router.push(`/technique/projets/${projet.id}`);
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
          <Link href="/technique/projets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Nouveau Projet
          </h2>
          <p className="text-muted-foreground">
            Créez un nouveau projet technique
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails de base du projet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du projet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Installation système audiovisuel"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partenaire">Partenaire / Client *</Label>
                <Select 
                  value={formData.partenaireId} 
                  onValueChange={(v) => setFormData({ ...formData, partenaireId: v })}
                  required
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <Select 
                    value={formData.categorie} 
                    onValueChange={(v) => setFormData({ ...formData, categorie: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorite">Priorité</Label>
                <Select 
                  value={formData.priorite} 
                  onValueChange={(v) => setFormData({ ...formData, priorite: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du projet..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Planning & Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Planning et Budget</CardTitle>
              <CardDescription>Dates et estimations financières</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable</Label>
                <Select 
                  value={formData.responsableId} 
                  onValueChange={(v) => setFormData({ ...formData, responsableId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {utilisateurs.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.prenom} {u.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu">Lieu d&apos;intervention</Label>
                <Input
                  id="lieu"
                  value={formData.lieu}
                  onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                  placeholder="Adresse ou localisation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFinEstimative">Date de fin estimée</Label>
                  <Input
                    id="dateFinEstimative"
                    type="date"
                    value={formData.dateFinEstimative}
                    onChange={(e) => setFormData({ ...formData, dateFinEstimative: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dureeJours">Durée estimée (jours)</Label>
                <Input
                  id="dureeJours"
                  type="number"
                  min="1"
                  value={formData.dureeJours}
                  onChange={(e) => setFormData({ ...formData, dureeJours: e.target.value })}
                  placeholder="Nombre de jours"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="devisEstimatif">Devis estimatif (F CFA)</Label>
                <Input
                  id="devisEstimatif"
                  type="number"
                  min="0"
                  value={formData.devisEstimatif}
                  onChange={(e) => setFormData({ ...formData, devisEstimatif: e.target.value })}
                  placeholder="Montant du devis"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/technique/projets">Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Créer le projet
          </Button>
        </div>
      </form>
    </div>
  );
}
