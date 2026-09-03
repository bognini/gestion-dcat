'use client';

import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ticketStatutLabel } from '@/lib/tickets';

const STATUT_STYLE: Record<string, { icon: typeof Clock; color: string }> = {
  ouvert: { icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-300' },
  en_cours: { icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ferme: { icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
};

export function TicketStatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_STYLE[statut] || STATUT_STYLE.ouvert;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {ticketStatutLabel(statut)}
    </Badge>
  );
}
