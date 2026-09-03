'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket as TicketIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TicketForm, toDateTimeLocal, type TicketFormValues } from '@/components/tickets/ticket-form';

export default function ModifierTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [initial, setInitial] = useState<TicketFormValues | null>(null);
  const [numero, setNumero] = useState('');
  const [lockPartenaire, setLockPartenaire] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`);
        if (!res.ok) throw new Error();
        const t = await res.json();
        setNumero(t.numero);
        setLockPartenaire((t.interventions?.length || 0) > 0);
        setInitial({
          partenaireId: t.partenaireId || t.partenaire?.id || '',
          incident: t.incident,
          dateSignalement: toDateTimeLocal(new Date(t.dateSignalement)),
          signaleParNom: t.signaleParNom,
          signaleParPrenoms: t.signaleParPrenoms || '',
          recuParId: t.recuParId || t.recuPar?.id || '',
          modeSignalement: t.modeSignalement,
          priseEnChargeParId: t.priseEnChargeParId || t.priseEnChargePar?.id || '',
          envoyerMailSupport: false,
        });
      } catch {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Ticket introuvable' });
        router.push('/technique/tickets');
      }
    })();
  }, [id, router, toast]);

  const handleSubmit = async (values: TicketFormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partenaireId: values.partenaireId,
          incident: values.incident,
          dateSignalement: new Date(values.dateSignalement).toISOString(),
          signaleParNom: values.signaleParNom,
          signaleParPrenoms: values.signaleParPrenoms,
          recuParId: values.recuParId,
          modeSignalement: values.modeSignalement,
          priseEnChargeParId: values.priseEnChargeParId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur');
      }
      toast({ title: 'Ticket mis à jour' });
      router.push(`/technique/tickets/${id}`);
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

  if (!initial) {
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
          <Link href={`/technique/tickets/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TicketIcon className="h-6 w-6" />
            Modifier le ticket {numero}
          </h2>
          <p className="text-muted-foreground">Le statut évolue via la fiche d&apos;intervention.</p>
        </div>
      </div>

      <TicketForm
        initial={initial}
        mode="edit"
        saving={saving}
        lockPartenaire={lockPartenaire}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/technique/tickets/${id}`)}
      />
    </div>
  );
}
