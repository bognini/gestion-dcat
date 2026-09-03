'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODES_SIGNALEMENT } from '@/lib/tickets';

interface Partenaire {
  id: string;
  nom: string;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string | null;
}

export interface TicketFormValues {
  partenaireId: string;
  incident: string;
  dateSignalement: string; // format datetime-local : YYYY-MM-DDTHH:mm
  signaleParNom: string;
  signaleParPrenoms: string;
  recuParId: string;
  modeSignalement: string;
  priseEnChargeParId: string;
  envoyerMailSupport: boolean;
}

/** Formate une date pour un champ datetime-local (heure locale du navigateur). */
export function toDateTimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function emptyTicketValues(): TicketFormValues {
  return {
    partenaireId: '',
    incident: '',
    dateSignalement: toDateTimeLocal(new Date()),
    signaleParNom: '',
    signaleParPrenoms: '',
    recuParId: '',
    modeSignalement: 'appel_telephonique',
    priseEnChargeParId: '',
    envoyerMailSupport: true,
  };
}

interface TicketFormProps {
  initial: TicketFormValues;
  mode: 'create' | 'edit';
  saving: boolean;
  lockPartenaire?: boolean;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const NONE = '__none__';

export function TicketForm({ initial, mode, saving, lockPartenaire, onSubmit, onCancel }: TicketFormProps) {
  const [values, setValues] = useState<TicketFormValues>(initial);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [partRes, userRes, meRes] = await Promise.all([
          fetch('/api/partenaires'),
          fetch('/api/utilisateurs'),
          fetch('/api/auth/me'),
        ]);
        if (cancelled) return;
        if (partRes.ok) setPartenaires(await partRes.json());
        if (userRes.ok) setUtilisateurs(await userRes.json());
        // « À » prérempli avec l'utilisateur connecté en création
        if (mode === 'create' && meRes.ok && !initial.recuParId) {
          const me = await meRes.json();
          const id = me?.user?.id || me?.id;
          if (id) setValues((v) => (v.recuParId ? v : { ...v, recuParId: id }));
        }
      } catch (error) {
        console.error('Error loading ticket form refs:', error);
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof TicketFormValues>(key: K, value: TicketFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const userLabel = (u: Utilisateur) => (u.prenom ? `${u.prenom} ${u.nom}` : u.nom);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signalement</CardTitle>
            <CardDescription>Qui signale quoi, quand et comment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partenaire">Client *</Label>
              <Select
                value={values.partenaireId}
                onValueChange={(v) => set('partenaireId', v)}
                disabled={lockPartenaire || loadingRefs}
              >
                <SelectTrigger id="partenaire">
                  <SelectValue placeholder={loadingRefs ? 'Chargement…' : 'Sélectionner un client'} />
                </SelectTrigger>
                <SelectContent>
                  {partenaires.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockPartenaire && (
                <p className="text-xs text-muted-foreground">
                  Le client ne peut plus être modifié : des interventions sont liées à ce ticket.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident">Incident signalé *</Label>
              <Textarea
                id="incident"
                value={values.incident}
                onChange={(e) => set('incident', e.target.value)}
                placeholder="Description de l'incident tel que rapporté par le client…"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateSignalement">Date et heure de signalement *</Label>
              <Input
                id="dateSignalement"
                type="datetime-local"
                value={values.dateSignalement}
                max={toDateTimeLocal(new Date())}
                onChange={(e) => set('dateSignalement', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signaleParNom">Signalé par — Nom *</Label>
                <Input
                  id="signaleParNom"
                  value={values.signaleParNom}
                  onChange={(e) => set('signaleParNom', e.target.value)}
                  placeholder="Nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signaleParPrenoms">Prénoms</Label>
                <Input
                  id="signaleParPrenoms"
                  value={values.signaleParPrenoms}
                  onChange={(e) => set('signaleParPrenoms', e.target.value)}
                  placeholder="Prénoms"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modeSignalement">Mode de signalisation *</Label>
              <Select value={values.modeSignalement} onValueChange={(v) => set('modeSignalement', v)}>
                <SelectTrigger id="modeSignalement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES_SIGNALEMENT.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Côté DCAT</CardTitle>
              <CardDescription>Réception et prise en charge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recuPar">À (personnel DCAT ayant reçu le signalement) *</Label>
                <Select value={values.recuParId} onValueChange={(v) => set('recuParId', v)} disabled={loadingRefs}>
                  <SelectTrigger id="recuPar">
                    <SelectValue placeholder={loadingRefs ? 'Chargement…' : 'Sélectionner'} />
                  </SelectTrigger>
                  <SelectContent>
                    {utilisateurs.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {userLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priseEnChargePar">Prise en charge par</Label>
                <Select
                  value={values.priseEnChargeParId || NONE}
                  onValueChange={(v) => set('priseEnChargeParId', v === NONE ? '' : v)}
                  disabled={loadingRefs}
                >
                  <SelectTrigger id="priseEnChargePar">
                    <SelectValue placeholder="Pas encore attribué" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Pas encore attribué</SelectItem>
                    {utilisateurs.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {userLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Renseigner une prise en charge passe le ticket « En cours ».
                </p>
              </div>
            </CardContent>
          </Card>

          {mode === 'create' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="envoyerMail"
                    checked={values.envoyerMailSupport}
                    onCheckedChange={(c) => set('envoyerMailSupport', c === true)}
                  />
                  <div className="space-y-1">
                    <label htmlFor="envoyerMail" className="text-sm font-medium cursor-pointer">
                      Envoyer un mail au support DCAT
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Objet : « <span className="font-mono">Client INCIDENT SIGNALE TCK-…</span> ». Les destinataires se
                      configurent dans Paramètres → Options → « Support DCAT — nouveau ticket ».
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving || loadingRefs}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === 'create' ? 'Créer le ticket' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
