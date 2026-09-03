'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket as TicketIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TicketForm, emptyTicketValues, type TicketFormValues } from '@/components/tickets/ticket-form';

export default function NouveauTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: TicketFormValues) => {
    if (!values.partenaireId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner le client' });
      return;
    }
    if (!values.recuParId) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez indiquer qui a reçu le signalement' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          dateSignalement: new Date(values.dateSignalement).toISOString(),
          priseEnChargeParId: values.priseEnChargeParId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur');
      }
      const ticket = await res.json();
      toast({
        title: 'Ticket créé',
        description: values.envoyerMailSupport
          ? `${ticket.numero} — le mail au support est en cours d'envoi`
          : `${ticket.numero} créé sans notification`,
      });
      router.push(`/technique/tickets/${ticket.id}`);
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
          <Link href="/technique/tickets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TicketIcon className="h-6 w-6" />
            Nouveau ticket d&apos;incident
          </h2>
          <p className="text-muted-foreground">
            Le ticket est créé « Ouvert ». Il se fermera en renseignant la fiche d&apos;intervention.
          </p>
        </div>
      </div>

      <TicketForm
        initial={emptyTicketValues()}
        mode="create"
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/technique/tickets')}
      />
    </div>
  );
}
