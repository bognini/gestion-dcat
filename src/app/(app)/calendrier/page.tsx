'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Loader2,
  Wrench,
  ListTodo,
  CheckSquare,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface CalendarEvent {
  id: string;
  titre: string;
  type: string;
  typeLabel: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  couleur?: string;
  link?: string | null;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string | null;
  role: string;
}

export default function CalendrierPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchParams = useSearchParams();
  const [view, setView] = useState<'month' | 'week' | 'day'>((searchParams.get('view') as 'month' | 'week' | 'day') || 'month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [usersList, setUsersList] = useState<Utilisateur[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const [eventForm, setEventForm] = useState({
    titre: '',
    type: 'reunion_hebdo',
    dateDebut: new Date().toISOString().slice(0, 16),
    dateFin: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    lieu: '',
    description: '',
    participantIds: [] as string[],
  });

  useEffect(() => {
    const urlView = searchParams.get('view') as 'month' | 'week' | 'day' | null;
    if (urlView && urlView !== view) {
      setView(urlView);
    }
  }, [searchParams, view]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/utilisateurs');
        if (res.ok) {
          setUsersList(await res.json());
        }
      } catch {
      }
    };

    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      let startDate: Date;
      let endDate: Date;

      if (view === 'day') {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'week') {
        const dayOfWeek = (currentDate.getDay() + 6) % 7; // Monday = 0
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      const res = await fetch(`/api/calendrier?start=${start}&end=${end}`);
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  // Convert to Monday-based week (0 = Monday, 6 = Sunday)
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const prevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
      return;
    }
    const deltaDays = view === 'week' ? 7 : 1;
    const d = new Date(currentDate);
    d.setDate(d.getDate() - deltaDays);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
      return;
    }
    const deltaDays = view === 'week' ? 7 : 1;
    const d = new Date(currentDate);
    d.setDate(d.getDate() + deltaDays);
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async () => {
    if (!eventForm.titre.trim()) {
      toast({ variant: 'destructive', title: 'Titre requis' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/calendrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: eventForm.titre,
          type: eventForm.type,
          dateDebut: eventForm.dateDebut,
          dateFin: eventForm.dateFin,
          lieu: eventForm.lieu,
          description: eventForm.description,
          participantIds: eventForm.participantIds,
        }),
      });

      if (res.ok) {
        toast({ title: 'Événement créé' });
        setCreateDialogOpen(false);
        setEventForm({
          titre: '',
          type: 'reunion_hebdo',
          dateDebut: new Date().toISOString().slice(0, 16),
          dateFin: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
          lieu: '',
          description: '',
          participantIds: [],
        });
        fetchEvents();
      } else {
        const err = await res.json().catch(() => null);
        toast({ variant: 'destructive', title: 'Erreur', description: err?.error || 'Impossible de créer l\'événement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer l\'événement' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    // Only allow editing user-created events (evt- prefix)
    if (!event.id.startsWith('evt-')) {
      toast({ variant: 'destructive', title: 'Non modifiable', description: 'Cet élément ne peut pas être modifié depuis le calendrier.' });
      return;
    }
    setEditingEvent(event);
    setEventForm({
      titre: event.titre,
      type: event.type || 'reunion_hebdo',
      dateDebut: new Date(event.dateDebut).toISOString().slice(0, 16),
      dateFin: new Date(event.dateFin).toISOString().slice(0, 16),
      lieu: event.lieu || '',
      description: '',
      participantIds: [],
    });
    setCreateDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent || !eventForm.titre.trim()) {
      toast({ variant: 'destructive', title: 'Titre requis' });
      return;
    }

    setCreating(true);
    try {
      const eventId = editingEvent.id.replace('evt-', '');
      const res = await fetch(`/api/calendrier/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: eventForm.titre,
          type: eventForm.type,
          dateDebut: eventForm.dateDebut,
          dateFin: eventForm.dateFin,
          lieu: eventForm.lieu,
          description: eventForm.description,
          participantIds: eventForm.participantIds,
        }),
      });

      if (res.ok) {
        toast({ title: 'Événement modifié' });
        setCreateDialogOpen(false);
        setEditingEvent(null);
        setEventForm({
          titre: '',
          type: 'reunion_hebdo',
          dateDebut: new Date().toISOString().slice(0, 16),
          dateFin: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
          lieu: '',
          description: '',
          participantIds: [],
        });
        fetchEvents();
      } else {
        const err = await res.json().catch(() => null);
        toast({ variant: 'destructive', title: 'Erreur', description: err?.error || 'Impossible de modifier l\'événement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier l\'événement' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEvent) return;

    setDeleting(true);
    try {
      const eventId = deleteEvent.id.replace('evt-', '');
      const res = await fetch(`/api/calendrier/${eventId}`, { method: 'DELETE' });

      if (res.ok) {
        toast({ title: 'Événement supprimé' });
        setDeleteEvent(null);
        fetchEvents();
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer l\'événement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer l\'événement' });
    } finally {
      setDeleting(false);
    }
  };

  const isEditableEvent = (event: CalendarEvent) => event.id.startsWith('evt-');

  const getEventsForDay = (day: number) => {
    const currentDay = new Date(year, month, day);
    currentDay.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      if (!event.dateDebut) return false;
      const eventStart = new Date(event.dateDebut);
      eventStart.setHours(0, 0, 0, 0);
      
      const eventEnd = event.dateFin ? new Date(event.dateFin) : eventStart;
      eventEnd.setHours(23, 59, 59, 999);
      
      // Check if currentDay falls within the event range
      return currentDay >= eventStart && currentDay <= eventEnd;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'intervention': return <Wrench className="h-3 w-3" />;
      case 'operation': return <ListTodo className="h-3 w-3" />;
      case 'tache': return <CheckSquare className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/30" />);
    }
    
    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear();
      const dayEvents = getEventsForDay(day);
      
      days.push(
        <div
          key={day}
          onClick={() => {
            const clickedDate = new Date(year, month, day);
            setSelectedDayEvents({ date: clickedDate, events: dayEvents });
          }}
          className={`h-24 border border-border p-1 hover:bg-muted/50 cursor-pointer transition-colors ${
            isToday ? 'bg-primary/10 border-primary' : ''
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className="text-xs truncate rounded px-1 py-0.5 text-white"
                style={{ backgroundColor: event.couleur || '#6b7280' }}
              >
                {event.titre}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 2} autres
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const currentDay = new Date(date);
    currentDay.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      if (!event.dateDebut) return false;
      const eventStart = new Date(event.dateDebut);
      eventStart.setHours(0, 0, 0, 0);

      const eventEnd = event.dateFin ? new Date(event.dateFin) : eventStart;
      eventEnd.setHours(23, 59, 59, 999);

      return currentDay >= eventStart && currentDay <= eventEnd;
    });
  };

  const getWeekRange = () => {
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const getHeaderTitle = () => {
    if (view === 'month') return `${MONTHS[month]} ${year}`;
    if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    const { start, end } = getWeekRange();
    const s = start.toLocaleDateString('fr-FR');
    const e = end.toLocaleDateString('fr-FR');
    return `Semaine du ${s} au ${e}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendrier</h2>
          <p className="text-muted-foreground">
            Gérez vos réunions, interventions et événements
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setEditingEvent(null);
          setEventForm({
            titre: '',
            type: 'reunion_hebdo',
            dateDebut: new Date().toISOString().slice(0, 16),
            dateFin: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
            lieu: '',
            description: '',
            participantIds: [],
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Modifier l\'\u00e9vénement' : 'Nouvel \u00e9v\u00e9nement'}</DialogTitle>
            <DialogDescription>{editingEvent ? 'Modifiez les informations de l\'\u00e9vénement' : 'R\u00e9union, planning, t\u00e9l\u00e9travail\u2026'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Titre *</Label>
              <Input value={eventForm.titre} onChange={(e) => setEventForm({ ...eventForm, titre: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reunion_hebdo">Réunion</SelectItem>
                  <SelectItem value="projet">Projet</SelectItem>
                  <SelectItem value="teletravail">Télétravail</SelectItem>
                  <SelectItem value="seance_travail">Séance de travail</SelectItem>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={eventForm.lieu} onChange={(e) => setEventForm({ ...eventForm, lieu: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Date début *</Label>
              <Input type="datetime-local" value={eventForm.dateDebut} onChange={(e) => setEventForm({ ...eventForm, dateDebut: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Date fin *</Label>
              <Input type="datetime-local" value={eventForm.dateFin} onChange={(e) => setEventForm({ ...eventForm, dateFin: e.target.value })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Participants</Label>
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-2">
                  {usersList.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucun utilisateur</div>
                  ) : (
                    usersList.map((u) => {
                      const checked = eventForm.participantIds.includes(u.id);
                      const label = [u.prenom, u.nom].filter(Boolean).join(' ');
                      return (
                        <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = typeof v === 'boolean' ? v : v === 'indeterminate' ? false : false;
                              setEventForm((prev) => ({
                                ...prev,
                                participantIds: next
                                  ? Array.from(new Set([...prev.participantIds, u.id]))
                                  : prev.participantIds.filter((id) => id !== u.id),
                              }));
                            }}
                          />
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">({u.role})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={editingEvent ? handleSaveEdit : handleCreateEvent} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={prevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[200px] text-center">
              {getHeaderTitle()}
            </h3>
            <Button variant="outline" size="icon" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="day">Jour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'month' ? (
            <>
              {/* Days header */}
              <div className="grid grid-cols-7 gap-0 border-b">
                {DAYS.map(day => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">
                {renderCalendarDays()}
              </div>
            </>
          ) : view === 'week' ? (
            (() => {
              const { start } = getWeekRange();
              const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return d;
              });

              return (
                <>
                  <div className="grid grid-cols-7 gap-0 border-b">
                    {days.map((d) => {
                      const weekdayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
                      const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
                      return (
                        <div key={d.toISOString()} className="py-2 text-center text-sm font-medium text-muted-foreground">
                          {capitalizedWeekday} {d.getDate()}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-7 gap-0">
                    {days.map((d) => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(d);
                      return (
                        <div
                          key={d.toISOString()}
                          className={`min-h-40 border border-border p-2 ${isToday ? 'bg-primary/10 border-primary' : ''}`}
                        >
                          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
                            {d.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.length === 0 ? (
                              <div className="text-xs text-muted-foreground">—</div>
                            ) : (
                              dayEvents.slice(0, 4).map((event) => (
                                <div
                                  key={event.id}
                                  className="text-xs truncate rounded px-2 py-1 text-white"
                                  style={{ backgroundColor: event.couleur || '#6b7280' }}
                                  title={event.titre}
                                >
                                  {event.titre}
                                </div>
                              ))
                            )}
                            {dayEvents.length > 4 && (
                              <div className="text-xs text-muted-foreground">+{dayEvents.length - 4} autres</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          ) : (
            (() => {
              const dayEvents = getEventsForDate(currentDate);
              return (
                <div className="space-y-3">
                  {dayEvents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucun événement ce jour</div>
                  ) : (
                    dayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-1 h-12 rounded-full" style={{ backgroundColor: event.couleur || '#6b7280' }} />
                        <div className="flex-1">
                          {event.link ? (
                            <Link href={event.link} className="font-medium hover:underline">{event.titre}</Link>
                          ) : (
                            <div className="font-medium">{event.titre}</div>
                          )}
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(event.dateDebut).toLocaleString('fr-FR')}
                          </div>
                          {event.lieu && (
                            <div className="text-sm text-muted-foreground">{event.lieu}</div>
                          )}
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {getTypeIcon(event.type)}
                          {event.typeLabel}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Upcoming events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Événements à venir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun événement ce mois</p>
          ) : (
            events.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div 
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: event.couleur || '#6b7280' }}
                />
                <div className="flex-1">
                  {event.link ? (
                    <Link href={event.link} className="font-medium hover:underline">{event.titre}</Link>
                  ) : (
                    <h4 className="font-medium">{event.titre}</h4>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.dateDebut).toLocaleDateString('fr-FR')}
                    </span>
                    {event.lieu && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.lieu}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getTypeIcon(event.type)}
                    {event.typeLabel}
                  </Badge>
                  {isEditableEvent(event) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteEvent(event)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'\u00e9v\u00e9nement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera d\u00e9finitivement l'\u00e9v\u00e9nement{' '}
              <strong>{deleteEvent?.titre}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Day events dialog */}
      <Dialog open={!!selectedDayEvents} onOpenChange={(open) => !open && setSelectedDayEvents(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDayEvents?.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents?.events.length === 0 
                ? 'Aucun événement prévu ce jour' 
                : `${selectedDayEvents?.events.length} événement(s) prévu(s)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDayEvents?.events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Aucun événement ce jour</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setSelectedDayEvents(null);
                    setEventForm(prev => ({
                      ...prev,
                      dateDebut: selectedDayEvents?.date.toISOString().slice(0, 16) || prev.dateDebut,
                      dateFin: new Date((selectedDayEvents?.date.getTime() || Date.now()) + 60 * 60 * 1000).toISOString().slice(0, 16),
                    }));
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un événement
                </Button>
              </div>
            ) : (
              selectedDayEvents?.events.map(event => (
                <div 
                  key={event.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div 
                    className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.couleur || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    {event.link ? (
                      <Link href={event.link} className="font-medium hover:underline block truncate">
                        {event.titre}
                      </Link>
                    ) : (
                      <h4 className="font-medium truncate">{event.titre}</h4>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {event.typeLabel}
                      </Badge>
                      {event.lieu && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {event.lieu}
                        </span>
                      )}
                    </div>
                  </div>
                  {isEditableEvent(event) && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSelectedDayEvents(null);
                          handleEditEvent(event);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedDayEvents(null);
                          setDeleteEvent(event);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDayEvents(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
