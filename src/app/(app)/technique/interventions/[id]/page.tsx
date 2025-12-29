'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  MapPin,
  FileText,
  Users,
  Upload,
  Download,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDuration } from '@/lib/utils';

interface Intervention {
  id: string;
  reference: string | null;
  date: string;
  typeMaintenance: string;
  typeDefaillance: string | null;
  causeDefaillance: string | null;
  problemeSignale: string;
  rapport: string | null;
  recommandations: string | null;
  statut: string;
  dureeMinutes: number | null;
  lieu: string | null;
  modeIntervention: string | null;
  createdAt: string;
  partenaire: { id: string; nom: string };
  superviseur: { id: string; nom: string; prenom: string | null } | null;
  intervenants: Array<{
    utilisateur: { id: string; nom: string; prenom: string | null };
  }>;
}

const STATUTS = [
  { value: 'a_faire', label: 'À faire', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  { value: 'en_cours', label: 'En cours', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
  { value: 'en_attente', label: 'En attente', icon: Pause, color: 'bg-orange-100 text-orange-700' },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
];

const TYPES_MAINTENANCE = {
  corrective: 'Corrective',
  preventive: 'Préventive',
  planifiee: 'Planifiée',
};

const TYPES_DEFAILLANCE = {
  logicielle: 'Logicielle',
  materielle: 'Matérielle',
  electrique: 'Électrique',
};

const CAUSES_DEFAILLANCE = {
  usure_normale: 'Usure normale',
  defaut_utilisateur: 'Défaut utilisateur',
  defaut_produit: 'Défaut produit',
  autre: 'Autre',
};

const MODES_INTERVENTION = {
  sur_site: 'Sur site',
  a_distance: 'À distance',
  hybride: 'Hybride',
};

interface InterventionDocument {
  id: string;
  nom: string;
  filename: string;
  mime: string;
  createdAt: string;
}

export default function InterventionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [documents, setDocuments] = useState<InterventionDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchIntervention();
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/interventions/${id}/documents`);
      if (res.ok) setDocuments(await res.json());
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nom', file.name);

      const res = await fetch(`/api/interventions/${id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const doc = await res.json();
        setDocuments([doc, ...documents]);
        toast({ title: 'Document ajouté' });
      } else {
        throw new Error('Erreur');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'uploader le fichier' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      const res = await fetch(`/api/interventions/${id}/documents/${docToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== docToDelete));
        toast({ title: 'Document supprimé' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setDocToDelete(null);
    }
  };

  const fetchIntervention = async () => {
    try {
      const res = await fetch(`/api/interventions/${id}`);
      if (res.ok) {
        setIntervention(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Intervention non trouvée' });
        router.push('/technique/interventions');
      }
    } catch (error) {
      console.error('Error fetching intervention:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setIntervention(updated);
        toast({ title: 'Statut mis à jour' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/interventions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Intervention supprimée' });
        router.push('/technique/interventions');
      } else {
        throw new Error('Erreur');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer' });
    }
    setDeleteDialogOpen(false);
  };

  const getStatutBadge = (statut: string) => {
    const config = STATUTS.find(s => s.value === statut);
    const Icon = config?.icon || Clock;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config?.color || ''}`}>
        <Icon className="h-3 w-3" />
        {config?.label || statut}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!intervention) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/technique/interventions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-6 w-6" />
              {intervention.reference}
            </h2>
            {getStatutBadge(intervention.statut)}
          </div>
          <p className="text-muted-foreground">
            {formatDate(intervention.date)} • {intervention.partenaire.nom}
          </p>
        </div>
        <div className="flex gap-2">
          <Select 
            value={intervention.statut} 
            onValueChange={handleStatusChange}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href={`/technique/interventions/${id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Partenaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{intervention.partenaire.nom}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(intervention.date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {intervention.dureeMinutes ? formatDuration(intervention.dureeMinutes) : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Intervenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{intervention.intervenants.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Problem & Solution */}
        <Card>
          <CardHeader>
            <CardTitle>Problème signalé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{intervention.problemeSignale}</p>
            
            {intervention.lieu && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Lieu</p>
                  <p>{intervention.lieu}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type de maintenance</p>
                <Badge variant="secondary">
                  {TYPES_MAINTENANCE[intervention.typeMaintenance as keyof typeof TYPES_MAINTENANCE]}
                </Badge>
              </div>
              {intervention.modeIntervention && (
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <Badge variant="outline">
                    {MODES_INTERVENTION[intervention.modeIntervention as keyof typeof MODES_INTERVENTION]}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic technique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type de défaillance</p>
                <p className="font-medium">
                  {intervention.typeDefaillance 
                    ? TYPES_DEFAILLANCE[intervention.typeDefaillance as keyof typeof TYPES_DEFAILLANCE]
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cause</p>
                <p className="font-medium">
                  {intervention.causeDefaillance 
                    ? CAUSES_DEFAILLANCE[intervention.causeDefaillance as keyof typeof CAUSES_DEFAILLANCE]
                    : '-'}
                </p>
              </div>
            </div>

            {intervention.rapport && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rapport d&apos;intervention</p>
                <p className="text-sm bg-muted p-3 rounded">{intervention.rapport}</p>
              </div>
            )}

            {intervention.recommandations && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recommandations</p>
                <p className="text-sm bg-muted p-3 rounded">{intervention.recommandations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Équipe d&apos;intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {intervention.intervenants.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun intervenant assigné</p>
            ) : (
              <div className="space-y-2">
                {intervention.intervenants.map((i) => (
                  <div key={i.utilisateur.id} className="flex items-center gap-2 p-2 rounded bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {i.utilisateur.prenom ? `${i.utilisateur.prenom} ` : ''}{i.utilisateur.nom}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Créée le</p>
              <p>{formatDate(intervention.createdAt)}</p>
            </div>
            {intervention.superviseur && (
              <div>
                <p className="text-sm text-muted-foreground">Superviseur</p>
                <p>
                  {intervention.superviseur.prenom ? `${intervention.superviseur.prenom} ` : ''}
                  {intervention.superviseur.nom}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <div>
                <Label htmlFor="file-upload-int" className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Ajouter
                    </span>
                  </Button>
                </Label>
                <Input
                  id="file-upload-int"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">
                Aucun document
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.nom}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/api/interventions/${id}/documents/${doc.id}`} download={doc.filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDocToDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Delete Confirmation */}
      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
