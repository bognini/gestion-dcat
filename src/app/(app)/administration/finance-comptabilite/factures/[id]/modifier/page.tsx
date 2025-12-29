'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, 
  ArrowLeft,
  Loader2
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
import { formatCurrency } from '@/lib/utils';

interface Facture {
  id: string;
  reference: string;
  clientNom: string;
  clientAdresse: string | null;
  clientVille: string | null;
  clientPays: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  objet: string | null;
  dateEcheance: string | null;
  statut: string;
  notes: string | null;
  totalHT: number;
  totalTTC: number;
}

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'payee_partiellement', label: 'Paiement partiel' },
  { value: 'payee', label: 'Payée' },
  { value: 'annulee', label: 'Annulée' },
];

export default function ModifierFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reference, setReference] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientVille, setClientVille] = useState('');
  const [clientPays, setClientPays] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [objet, setObjet] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [statut, setStatut] = useState('brouillon');
  const [notes, setNotes] = useState('');
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);

  useEffect(() => {
    fetchFacture();
  }, [id]);

  const fetchFacture = async () => {
    try {
      const res = await fetch(`/api/factures/${id}`);
      if (res.ok) {
        const facture: Facture = await res.json();
        setReference(facture.reference);
        setClientNom(facture.clientNom);
        setClientAdresse(facture.clientAdresse || '');
        setClientVille(facture.clientVille || '');
        setClientPays(facture.clientPays || '');
        setClientEmail(facture.clientEmail || '');
        setClientTelephone(facture.clientTelephone || '');
        setObjet(facture.objet || '');
        setDateEcheance(facture.dateEcheance ? facture.dateEcheance.split('T')[0] : '');
        setStatut(facture.statut);
        setNotes(facture.notes || '');
        setTotalHT(facture.totalHT);
        setTotalTTC(facture.totalTTC);
      } else {
        toast({ variant: 'destructive', title: 'Facture non trouvée' });
        router.push('/administration/finance-comptabilite/factures');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!clientNom.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du client est requis' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNom,
          clientAdresse,
          clientVille,
          clientPays,
          clientEmail,
          clientTelephone,
          objet,
          dateEcheance: dateEcheance || null,
          statut,
          notes,
          totalHT,
          totalTTC,
        }),
      });

      if (!res.ok) throw new Error();

      toast({ title: 'Facture mise à jour' });
      router.push(`/administration/finance-comptabilite/factures/${id}`);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/administration/finance-comptabilite/factures/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Modifier {reference}</h2>
            <p className="text-muted-foreground">
              Modifier les informations de la facture
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Facture Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Facture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objet">Objet / Description</Label>
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
                  {STATUTS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateEcheance">Date d&apos;échéance</Label>
              <Input
                id="dateEcheance"
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total TTC</p>
              <p className="text-2xl font-bold">{formatCurrency(totalTTC)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
