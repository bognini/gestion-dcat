'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Loader2,
  Save,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Projet {
  id: string;
  nom: string;
}

interface User {
  id: string;
  nom: string;
  prenom: string | null;
  role: string;
}

interface Participant {
  id: string;
  utilisateur: User;
}

interface FicheMission {
  id: string;
  reference: string;
  titre: string;
  description: string | null;
  projet: Projet | null;
  destination: string;
  dateDepart: string;
  dateRetour: string | null;
  statut: string;
  budget: number | null;
  depensesReelles: number | null;
  objectifs: string | null;
  notes: string | null;
  participants: Participant[];
}

const STATUTS = [
  { value: 'planifiee', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
];

export default function ModifierFicheMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [missionRef, setMissionRef] = useState('');
  
  const [form, setForm] = useState({
    titre: '',
    description: '',
    projetId: '',
    destination: '',
    dateDepart: '',
    dateRetour: '',
    statut: 'planifiee',
    budget: '',
    depensesReelles: '',
    objectifs: '',
    notes: '',
    participantIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [missionRes, projetsRes, usersRes] = await Promise.all([
        fetch(`/api/missions/${id}`),
        fetch('/api/projets'),
        fetch('/api/utilisateurs'),
      ]);

      if (!missionRes.ok) {
        toast({ variant: 'destructive', title: 'Mission non trouvée' });
        router.push('/technique/fiches-mission');
        return;
      }

      const mission: FicheMission = await missionRes.json();
      setMissionRef(mission.reference);
      
      setForm({
        titre: mission.titre,
        description: mission.description || '',
        projetId: mission.projet?.id || '',
        destination: mission.destination,
        dateDepart: mission.dateDepart.split('T')[0],
        dateRetour: mission.dateRetour?.split('T')[0] || '',
        statut: mission.statut,
        budget: mission.budget?.toString() || '',
        depensesReelles: mission.depensesReelles?.toString() || '',
        objectifs: mission.objectifs || '',
        notes: mission.notes || '',
        participantIds: mission.participants.map(p => p.utilisateur.id),
      });

      if (projetsRes.ok) setProjets(await projetsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.titre.trim() || !form.destination.trim() || !form.dateDepart) {
      toast({ variant: 'destructive', title: 'Veuillez remplir les champs obligatoires' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/missions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: form.titre.trim(),
          description: form.description.trim() || null,
          projetId: form.projetId || null,
          destination: form.destination.trim(),
          dateDepart: form.dateDepart,
          dateRetour: form.dateRetour || null,
          statut: form.statut,
          budget: form.budget ? parseFloat(form.budget) : null,
          depensesReelles: form.depensesReelles ? parseFloat(form.depensesReelles) : null,
          objectifs: form.objectifs.trim() || null,
          notes: form.notes.trim() || null,
          participantIds: form.participantIds,
        }),
      });

      if (res.ok) {
        toast({ title: 'Mission modifiée avec succès' });
        router.push(`/technique/fiches-mission/${id}`);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId],
    }));
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
          <Link href={`/technique/fiches-mission/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Modifier la mission
          </h2>
          <p className="text-muted-foreground">{missionRef}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails de base de la mission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre *</Label>
                <Input
                  id="titre"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Titre de la mission"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Ville / Lieu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projetId">Projet associé</Label>
                <Select 
                  value={form.projetId || 'none'} 
                  onValueChange={(v) => setForm({ ...form, projetId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {projets.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select 
                  value={form.statut} 
                  onValueChange={(v) => setForm({ ...form, statut: v })}
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates et budget */}
          <Card>
            <CardHeader>
              <CardTitle>Dates et budget</CardTitle>
              <CardDescription>Planification et finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDepart">Date de départ *</Label>
                  <Input
                    id="dateDepart"
                    type="date"
                    value={form.dateDepart}
                    onChange={(e) => setForm({ ...form, dateDepart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateRetour">Date de retour</Label>
                  <Input
                    id="dateRetour"
                    type="date"
                    value={form.dateRetour}
                    onChange={(e) => setForm({ ...form, dateRetour: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget prévisionnel (FCFA)</Label>
                  <MoneyInput
                    id="budget"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depensesReelles">Dépenses réelles (FCFA)</Label>
                  <MoneyInput
                    id="depensesReelles"
                    value={form.depensesReelles}
                    onChange={(e) => setForm({ ...form, depensesReelles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectifs">Objectifs</Label>
                <Textarea
                  id="objectifs"
                  value={form.objectifs}
                  onChange={(e) => setForm({ ...form, objectifs: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants ({form.participantIds.length})</CardTitle>
            <CardDescription>Sélectionnez les membres de l&apos;équipe participant à cette mission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {users.map(user => (
                <label
                  key={user.id}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${
                    form.participantIds.includes(user.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.participantIds.includes(user.id)}
                    onChange={() => toggleParticipant(user.id)}
                    className="sr-only"
                  />
                  <span className="text-sm">
                    {[user.prenom, user.nom].filter(Boolean).join(' ')}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href={`/technique/fiches-mission/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
