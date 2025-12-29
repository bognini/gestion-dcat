'use client';

import { useState, useEffect, use } from 'react';
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
import { Progress } from '@/components/ui/progress';
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

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
  partenaireId: string;
  categorie: string;
  type: string;
  etat: string;
  priorite: string;
  progression: number;
  dateDebut: string | null;
  dateFinEstimative: string | null;
  dateFinReelle: string | null;
  devisEstimatif: number | null;
  dureeJours: number | null;
  lieu: string | null;
  responsableId: string | null;
  description: string | null;
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

const ETATS = [
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'bloque', label: 'Bloqué' },
  { value: 'annule', label: 'Annulé' },
];

export default function ModifierProjetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    partenaireId: '',
    categorie: '',
    type: '',
    etat: '',
    priorite: 'moyenne',
    progression: 0,
    devisEstimatif: '',
    dureeJours: '',
    dateDebut: '',
    dateFinEstimative: '',
    dateFinReelle: '',
    lieu: '',
    responsableId: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projetRes, partRes, userRes] = await Promise.all([
        fetch(`/api/projets/${id}`),
        fetch('/api/partenaires'),
        fetch('/api/utilisateurs'),
      ]);
      
      if (!projetRes.ok) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Projet non trouvé' });
        router.push('/technique/projets');
        return;
      }

      const projet: Projet = await projetRes.json();
      
      setFormData({
        nom: projet.nom,
        partenaireId: projet.partenaireId,
        categorie: projet.categorie,
        type: projet.type,
        etat: projet.etat,
        priorite: projet.priorite,
        progression: projet.progression,
        devisEstimatif: projet.devisEstimatif?.toString() || '',
        dureeJours: projet.dureeJours?.toString() || '',
        dateDebut: projet.dateDebut ? projet.dateDebut.split('T')[0] : '',
        dateFinEstimative: projet.dateFinEstimative ? projet.dateFinEstimative.split('T')[0] : '',
        dateFinReelle: projet.dateFinReelle ? projet.dateFinReelle.split('T')[0] : '',
        lieu: projet.lieu || '',
        responsableId: projet.responsableId || 'none',
        description: projet.description || '',
      });
      
      if (partRes.ok) setPartenaires(await partRes.json());
      if (userRes.ok) setUtilisateurs(await userRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le projet' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/projets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          devisEstimatif: formData.devisEstimatif || null,
          dureeJours: formData.dureeJours || null,
          dateDebut: formData.dateDebut || null,
          dateFinEstimative: formData.dateFinEstimative || null,
          dateFinReelle: formData.dateFinReelle || null,
          responsableId: formData.responsableId && formData.responsableId !== 'none' ? formData.responsableId : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      toast({
        title: 'Projet modifié',
        description: 'Les modifications ont été enregistrées',
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
          <Link href={`/technique/projets/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Modifier le Projet
          </h2>
          <p className="text-muted-foreground">
            {formData.nom}
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
                  required
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <Select 
                    value={formData.categorie} 
                    onValueChange={(v) => setFormData({ ...formData, categorie: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etat">État</Label>
                  <Select 
                    value={formData.etat} 
                    onValueChange={(v) => setFormData({ ...formData, etat: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ETATS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="progression">Progression ({formData.progression}%)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progression}
                    onChange={(e) => setFormData({ ...formData, progression: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <Progress value={formData.progression} className="w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <SelectItem value="none">Aucun</SelectItem>
                    {utilisateurs.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
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
                <Label htmlFor="dateFinReelle">Date de fin réelle</Label>
                <Input
                  id="dateFinReelle"
                  type="date"
                  value={formData.dateFinReelle}
                  onChange={(e) => setFormData({ ...formData, dateFinReelle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dureeJours">Durée estimée (jours)</Label>
                <Input
                  id="dureeJours"
                  type="number"
                  min="1"
                  value={formData.dureeJours}
                  onChange={(e) => setFormData({ ...formData, dureeJours: e.target.value })}
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
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href={`/technique/projets/${id}`}>Annuler</Link>
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
