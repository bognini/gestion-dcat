// Constantes partagées (client + serveur) pour les tickets d'incident

export const TICKET_STATUTS = [
  { value: 'ouvert', label: 'Ouvert' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'ferme', label: 'Fermé' },
] as const;

export type TicketStatut = (typeof TICKET_STATUTS)[number]['value'];

export const MODES_SIGNALEMENT = [
  { value: 'appel_telephonique', label: 'Appel téléphonique' },
  { value: 'hotline_dcat', label: 'Hotline DCAT' },
  { value: 'mail', label: 'Mail' },
  { value: 'constat', label: 'Constat' },
] as const;

export type ModeSignalement = (typeof MODES_SIGNALEMENT)[number]['value'];

export const MODE_SIGNALEMENT_VALUES: string[] = MODES_SIGNALEMENT.map((m) => m.value);
export const TICKET_STATUT_VALUES: string[] = TICKET_STATUTS.map((s) => s.value);

export function ticketStatutLabel(statut: string): string {
  return TICKET_STATUTS.find((s) => s.value === statut)?.label || statut;
}

export function modeSignalementLabel(mode: string): string {
  return MODES_SIGNALEMENT.find((m) => m.value === mode)?.label || mode;
}

/** Clé de la liste de diffusion (Paramètres → Options) utilisée pour le mail au support. */
export const TICKET_MAIL_EVENT_KEY = 'ticket_created';

export function ticketMailSubject(clientNom: string, numero: string): string {
  return `${clientNom} INCIDENT SIGNALE ${numero}`;
}
