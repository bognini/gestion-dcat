'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, 
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
  XCircle,
  MapPin,
  FileText,
  Package,
  ListTodo,
  Upload,
  Download,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
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
  description: string | null;
  createdAt: string;
  partenaire: { id: string; nom: string };
  responsable: { id: string; nom: string; prenom: string } | null;
  operations: Array<{
    id: string;
    intitule: string;
    description: string | null;
    statut: string;
    progression: number;
    dateLimite: string | null;
    responsableId: string | null;
    taches: Array<{
      id: string;
      intitule: string;
      description?: string | null;
      statut: string;
      dureeMinutes?: number | null;
      dateLimite?: string | null;
      assigne: { id: string; nom: string; prenom: string } | null;
    }>;
  }>;
  mouvements: Array<{
    id: string;
    date: string;
    type: string;
    quantite: number;
    produit: { id: string; nom: string; sku: string | null };
  }>;
  _count: { operations: number; mouvements: number; documents: number };
}

interface ProjetDocument {
  id: string;
  nom: string;
  filename: string;
  mime: string;
  createdAt: string;
}

const ETATS = [
  { value: 'planifie', label: 'Planifié', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  { value: 'en_cours', label: 'En cours', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { value: 'bloque', label: 'Bloqué', icon: Pause, color: 'bg-orange-100 text-orange-700' },
  { value: 'annule', label: 'Annulé', icon: XCircle, color: 'bg-red-100 text-red-700' },
];

const CATEGORIES = {
  audiovisuel: 'Audiovisuel',
  informatique: 'Informatique',
  domotique: 'Domotique',
  energie: 'Énergie',
};

const TYPES = {
  externe: 'Externe (Client)',
  interne: 'Interne',
  mission: 'Mission',
};

const PRIORITES = {
  basse: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  moyenne: { label: 'Moyenne', color: 'bg-blue-100 text-blue-600' },
  haute: { label: 'Haute', color: 'bg-orange-100 text-orange-600' },
  critique: { label: 'Critique', color: 'bg-red-100 text-red-600' },
};

export default function ProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<ProjetDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  // Operation/Task creation
  const [operationDialog, setOperationDialog] = useState(false);
  const [newOperation, setNewOperation] = useState({ intitule: '', description: '', dateLimite: '', responsableId: '' });
  const [savingOperation, setSavingOperation] = useState(false);
  const [tacheDialog, setTacheDialog] = useState<string | null>(null); // operationId
  const [newTache, setNewTache] = useState({ intitule: '', dureeMinutes: '', assigneId: '', dateLimite: '' });
  const [savingTache, setSavingTache] = useState(false);
  const [utilisateurs, setUtilisateurs] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);

  const [operationEditDialog, setOperationEditDialog] = useState(false);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [editOperation, setEditOperation] = useState({ intitule: '', description: '', dateLimite: '', responsableId: '' });
  const [savingOperationEdit, setSavingOperationEdit] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);

  const [tacheEditDialog, setTacheEditDialog] = useState<{ operationId: string; tacheId: string } | null>(null);
  const [editTache, setEditTache] = useState({ intitule: '', description: '', dureeMinutes: '', assigneId: '', dateLimite: '' });
  const [savingTacheEdit, setSavingTacheEdit] = useState(false);
  const [tacheToDelete, setTacheToDelete] = useState<{ operationId: string; tacheId: string } | null>(null);
  
  // Task status change confirmation
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ operationId: string; tacheId: string; currentStatus: string; newStatus: string; taskName: string } | null>(null);
  
  // Images and Folders
  const [imageFolders, setImageFolders] = useState<Array<{ id: string; nom: string; description: string | null; images: Array<{ id: string; description: string | null; filename: string; mime: string; createdAt: string }>; _count: { images: number }; createdAt: string }>>([]);
  const [images, setImages] = useState<Array<{ id: string; description: string | null; filename: string; mime: string; createdAt: string }>>([]);
  const [folderDialog, setFolderDialog] = useState(false);
  const [newFolder, setNewFolder] = useState({ nom: '', description: '' });
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ id: string; description: string | null; filename: string; createdAt: string } | null>(null);
  const [viewingFolderId, setViewingFolderId] = useState<string | null>(null);
  const [imageDialog, setImageDialog] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get images for the current viewing folder for navigation
  const getCurrentFolderImages = () => {
    if (!viewingFolderId) return [];
    const folder = imageFolders.find(f => f.id === viewingFolderId);
    return folder?.images || [];
  };

  const getCurrentImageIndex = () => {
    const images = getCurrentFolderImages();
    return images.findIndex(img => img.id === viewingImage?.id);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const images = getCurrentFolderImages();
    const currentIndex = getCurrentImageIndex();
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    
    setViewingImage(images[newIndex]);
  };

  const openImageViewer = (image: { id: string; description: string | null; filename: string; createdAt: string }, folderId: string) => {
    setViewingImage(image);
    setViewingFolderId(folderId);
  };

  useEffect(() => {
    fetchProjet();
    fetchDocuments();
    fetchUtilisateurs();
    fetchImages();
    fetchImageFolders();
  }, [id]);

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/projets/${id}/images`);
      if (res.ok) setImages(await res.json());
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const openEditOperation = (op: Projet['operations'][number]) => {
    setEditingOperationId(op.id);
    setEditOperation({
      intitule: op.intitule,
      description: op.description || '',
      dateLimite: op.dateLimite ? op.dateLimite.split('T')[0] : '',
      responsableId: op.responsableId || '',
    });
    setOperationEditDialog(true);
  };

  const handleUpdateOperation = async () => {
    if (!editingOperationId || !editOperation.intitule.trim()) return;
    setSavingOperationEdit(true);
    try {
      const res = await fetch(`/api/projets/${id}/operations/${editingOperationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intitule: editOperation.intitule,
          description: editOperation.description || null,
          dateLimite: editOperation.dateLimite || null,
          responsableId: editOperation.responsableId || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Opération mise à jour' });
        fetchProjet();
        setOperationEditDialog(false);
        setEditingOperationId(null);
        setEditOperation({ intitule: '', description: '', dateLimite: '', responsableId: '' });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setSavingOperationEdit(false);
    }
  };

  const handleDeleteOperation = async () => {
    if (!operationToDelete) return;
    try {
      const res = await fetch(`/api/projets/${id}/operations/${operationToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Opération supprimée' });
        fetchProjet();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setOperationToDelete(null);
    }
  };

  const openEditTache = (operationId: string, tache: Projet['operations'][number]['taches'][number]) => {
    setTacheEditDialog({ operationId, tacheId: tache.id });
    setEditTache({
      intitule: tache.intitule,
      description: tache.description || '',
      dureeMinutes: typeof tache.dureeMinutes === 'number' ? String(tache.dureeMinutes) : '',
      assigneId: tache.assigne?.id || '',
      dateLimite: tache.dateLimite ? new Date(tache.dateLimite).toISOString().split('T')[0] : '',
    });
  };

  const handleUpdateTache = async () => {
    if (!tacheEditDialog || !editTache.intitule.trim()) return;
    setSavingTacheEdit(true);
    try {
      const res = await fetch(`/api/projets/${id}/operations/${tacheEditDialog.operationId}/taches/${tacheEditDialog.tacheId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intitule: editTache.intitule,
          description: editTache.description || null,
          dateLimite: editTache.dateLimite || null,
          dureeMinutes: editTache.dureeMinutes ? parseInt(editTache.dureeMinutes) : null,
          assigneId: editTache.assigneId || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Tâche mise à jour' });
        fetchProjet();
        setTacheEditDialog(null);
        setEditTache({ intitule: '', description: '', dureeMinutes: '', assigneId: '', dateLimite: '' });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setSavingTacheEdit(false);
    }
  };

  const handleDeleteTache = async () => {
    if (!tacheToDelete) return;
    try {
      const res = await fetch(`/api/projets/${id}/operations/${tacheToDelete.operationId}/taches/${tacheToDelete.tacheId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({ title: 'Tâche supprimée' });
        fetchProjet();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setTacheToDelete(null);
    }
  };

  const fetchImageFolders = async () => {
    try {
      const res = await fetch(`/api/projets/${id}/image-folders`);
      if (res.ok) setImageFolders(await res.json());
    } catch (error) {
      console.error('Error fetching image folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolder.nom.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch(`/api/projets/${id}/image-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFolder),
      });
      if (res.ok) {
        toast({ title: 'Dossier créé' });
        fetchImageFolders();
        setFolderDialog(false);
        setNewFolder({ nom: '', description: '' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const res = await fetch(`/api/projets/${id}/image-folders/${folderId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        toast({ title: `${result.count} image(s) ajoutée(s)` });
        fetchImageFolders();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/projets/${id}/image-folders/${folderId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Dossier supprimé' });
        fetchImageFolders();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', imageDescription);

      const res = await fetch(`/api/projets/${id}/images`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Image ajoutée' });
        fetchImages();
        setImageDialog(false);
        setImageDescription('');
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/projets/${id}/images/${imageId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Image supprimée' });
        fetchImages();
        setViewingImage(null);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const confirmStatusChange = async () => {
    if (!statusChangeDialog) return;
    const { operationId, tacheId, newStatus } = statusChangeDialog;
    try {
      const res = await fetch(`/api/projets/${id}/operations/${operationId}/taches/${tacheId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (res.ok) {
        fetchProjet();
        toast({ title: 'Statut mis à jour' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
    setStatusChangeDialog(null);
  };

  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch('/api/utilisateurs');
      if (res.ok) setUtilisateurs(await res.json());
    } catch (error) {
      console.error('Error fetching utilisateurs:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/projets/${id}/documents`);
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

      const res = await fetch(`/api/projets/${id}/documents`, {
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
      const res = await fetch(`/api/projets/${id}/documents/${docToDelete}`, { method: 'DELETE' });
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

  const fetchProjet = async () => {
    try {
      const res = await fetch(`/api/projets/${id}`);
      if (res.ok) {
        setProjet(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Projet non trouvé' });
        router.push('/technique/projets');
      }
    } catch (error) {
      console.error('Error fetching projet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Projet supprimé' });
        router.push('/technique/projets');
      } else {
        throw new Error('Erreur');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le projet' });
    }
    setDeleteDialogOpen(false);
  };

  const handleCreateOperation = async () => {
    if (!newOperation.intitule.trim()) return;
    setSavingOperation(true);
    try {
      const res = await fetch(`/api/projets/${id}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intitule: newOperation.intitule,
          description: newOperation.description || null,
          dateLimite: newOperation.dateLimite || null,
          responsableId: newOperation.responsableId || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Opération créée' });
        fetchProjet();
        setOperationDialog(false);
        setNewOperation({ intitule: '', description: '', dateLimite: '', responsableId: '' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingOperation(false);
    }
  };

  const handleCreateTache = async () => {
    if (!newTache.intitule.trim() || !tacheDialog) return;
    setSavingTache(true);
    try {
      const res = await fetch(`/api/projets/${id}/operations/${tacheDialog}/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intitule: newTache.intitule,
          dureeMinutes: newTache.dureeMinutes ? parseInt(newTache.dureeMinutes) : null,
          assigneId: newTache.assigneId || null,
          dateLimite: newTache.dateLimite || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Tâche créée' });
        fetchProjet();
        setTacheDialog(null);
        setNewTache({ intitule: '', dureeMinutes: '', assigneId: '', dateLimite: '' });
      } else {
        const error = await res.json();
        toast({ variant: 'destructive', title: 'Erreur', description: error.error || 'Impossible de créer la tâche' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingTache(false);
    }
  };

  const openStatusChangeDialog = (operationId: string, tacheId: string, currentStatus: string, newStatus: string, taskName: string) => {
    setStatusChangeDialog({ operationId, tacheId, currentStatus, newStatus, taskName });
  };

  const handleUpdateTaskStatus = async (operationId: string, tacheId: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/projets/${id}/operations/${operationId}/taches/${tacheId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        fetchProjet();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const getEtatBadge = (etat: string) => {
    const config = ETATS.find(e => e.value === etat);
    const Icon = config?.icon || Clock;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config?.color || ''}`}>
        <Icon className="h-3 w-3" />
        {config?.label || etat}
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

  if (!projet) {
    return null;
  }

  const prioriteConfig = PRIORITES[projet.priorite as keyof typeof PRIORITES];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/technique/projets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{projet.nom}</h2>
            {getEtatBadge(projet.etat)}
          </div>
          <p className="text-muted-foreground font-mono text-sm">{projet.reference}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/technique/projets/${id}/modifier`}>
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
            <p className="font-medium">{projet.partenaire.nom}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {projet.responsable 
                ? `${projet.responsable.prenom || ''} ${projet.responsable.nom}`.trim()
                : 'Non assigné'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={projet.progression} className="flex-1" />
              <span className="font-medium">{projet.progression}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">
              {projet.devisEstimatif ? formatCurrency(projet.devisEstimatif) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="operations">
            Opérations ({projet._count.operations})
          </TabsTrigger>
          <TabsTrigger value="materiels">
            Matériels ({projet._count.mouvements})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({projet._count.documents})
          </TabsTrigger>
          <TabsTrigger value="images">
            Images ({images.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Catégorie</p>
                    <p className="font-medium">{CATEGORIES[projet.categorie as keyof typeof CATEGORIES]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{TYPES[projet.type as keyof typeof TYPES]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priorité</p>
                    <Badge variant="outline" className={prioriteConfig?.color}>
                      {prioriteConfig?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Durée estimée</p>
                    <p className="font-medium">{projet.dureeJours ? `${projet.dureeJours} jours` : '-'}</p>
                  </div>
                </div>
                {projet.lieu && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lieu</p>
                      <p className="font-medium">{projet.lieu}</p>
                    </div>
                  </div>
                )}
                {projet.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{projet.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de début</p>
                      <p className="font-medium">
                        {projet.dateDebut ? formatDate(projet.dateDebut) : 'Non définie'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fin estimée</p>
                      <p className="font-medium">
                        {projet.dateFinEstimative ? formatDate(projet.dateFinEstimative) : 'Non définie'}
                      </p>
                    </div>
                  </div>
                  {projet.dateFinReelle && (
                    <div className="flex items-start gap-2 col-span-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de fin réelle</p>
                        <p className="font-medium text-green-600">{formatDate(projet.dateFinReelle)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="text-sm">{formatDate(projet.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Opérations du projet
                  </CardTitle>
                  <CardDescription>
                    Liste des opérations et tâches associées
                  </CardDescription>
                </div>
                <Button onClick={() => setOperationDialog(true)}>
                  + Nouvelle opération
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projet.operations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucune opération pour ce projet. Cliquez sur "Nouvelle opération" pour en créer une.
                </p>
              ) : (
                <div className="space-y-6">
                  {projet.operations.map((op) => {
                    const totalDuree = (op.taches as Array<{ dureeMinutes?: number | null }>).reduce(
                      (sum, t) => sum + (typeof t.dureeMinutes === 'number' ? t.dureeMinutes : 0),
                      0
                    );
                    const completedTasks = op.taches.filter((t: { statut: string }) => t.statut === 'termine').length;
                    const totalTasks = op.taches.length;
                    const isComplete = totalTasks > 0 && completedTasks === totalTasks;
                    
                    const TASK_STATUSES = [
                      { value: 'a_faire', label: 'À faire', color: 'bg-muted/50 border-muted-foreground/30 dark:bg-muted/30', textColor: 'text-muted-foreground' },
                      { value: 'en_cours', label: 'En cours', color: 'bg-blue-500/10 border-blue-500/50 dark:bg-blue-500/20', textColor: 'text-blue-600 dark:text-blue-400' },
                      { value: 'termine', label: 'Terminé', color: 'bg-green-500/10 border-green-500/50 dark:bg-green-500/20', textColor: 'text-green-600 dark:text-green-400' },
                    ];
                    
                    return (
                      <div key={op.id} className={`border-2 rounded-lg overflow-hidden ${isComplete ? 'border-green-500/50 dark:border-green-500/30' : 'border-border'}`}>
                        {/* Operation Header */}
                        <div className={`p-4 ${isComplete ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-muted/50 dark:bg-muted/30'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isComplete ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <ListTodo className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h4 className="font-semibold text-lg truncate">{op.intitule}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {completedTasks}/{totalTasks} tâches complétées
                                  {totalDuree > 0 && ` • ${Math.floor(totalDuree / 60)}h${totalDuree % 60 > 0 ? `${totalDuree % 60}min` : ''}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`w-20 justify-center ${isComplete ? 'bg-green-500' : op.statut === 'en_cours' ? 'bg-blue-500' : 'bg-muted-foreground'}`}>
                                {isComplete ? 'Terminé' : op.statut === 'en_cours' ? 'En cours' : 'À faire'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditOperation(op)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setOperationToDelete(op.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={op.progression} className="h-2 mt-3" />
                        </div>
                        
                        {/* Tasks - Trello-like cards */}
                        <div className="p-4 bg-background">
                          {op.taches.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Aucune tâche. Ajoutez des tâches pour suivre la progression.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {op.taches.map((tache: { id: string; intitule: string; statut: string; dureeMinutes?: number | null; dateLimite?: string | null; assigne: { id: string; nom: string; prenom: string } | null }) => {
                                const statusConfig = TASK_STATUSES.find(s => s.value === tache.statut) || TASK_STATUSES[0];
                                const nextStatus = tache.statut === 'a_faire' ? 'en_cours' : tache.statut === 'en_cours' ? 'termine' : 'a_faire';
                                const nextStatusLabel = TASK_STATUSES.find(s => s.value === nextStatus)?.label || '';
                                
                                return (
                                  <div 
                                    key={tache.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${statusConfig.color} cursor-pointer hover:shadow-md transition-all`}
                                    onClick={() => openStatusChangeDialog(op.id, tache.id, tache.statut, nextStatus, tache.intitule)}
                                    title={`Cliquer pour passer à "${nextStatusLabel}"`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        tache.statut === 'termine' ? 'bg-green-500 border-green-500' : 
                                        tache.statut === 'en_cours' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                                      }`}>
                                        {tache.statut === 'termine' && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        {tache.statut === 'en_cours' && <Clock className="h-3 w-3 text-white" />}
                                      </div>
                                      <div>
                                        <p className={`font-medium ${tache.statut === 'termine' ? 'line-through text-muted-foreground' : ''}`}>
                                          {tache.intitule}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                          {tache.dateLimite && (
                                            <span className="text-orange-600 dark:text-orange-400">📅 {new Date(tache.dateLimite).toLocaleDateString('fr-FR')}</span>
                                          )}
                                          {tache.dureeMinutes && (
                                            <span>⏱ {Math.floor(tache.dureeMinutes / 60)}h{tache.dureeMinutes % 60 > 0 ? `${tache.dureeMinutes % 60}min` : ''}</span>
                                          )}
                                          {tache.assigne && (
                                            <span>👤 {tache.assigne.prenom} {tache.assigne.nom}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Badge variant="outline" className={`${statusConfig.textColor} text-xs w-16 justify-center`}>
                                        {statusConfig.label}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditTache(op.id, tache);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTacheToDelete({ operationId: op.id, tacheId: tache.id });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => setTacheDialog(op.id)}
                          >
                            + Ajouter une tâche
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Matériels utilisés
              </CardTitle>
              <CardDescription>
                Mouvements de stock liés au projet (via Gestion de stock → Sortie)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projet.mouvements.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucun matériel associé à ce projet. Pour ajouter des produits, créez une sortie de stock dans la section Gestion de stock.
                </p>
              ) : (
                <div className="space-y-2">
                  {projet.mouvements.map((mvt) => (
                    <div key={mvt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{mvt.produit.nom}</p>
                          {mvt.produit.sku && (
                            <p className="text-xs text-muted-foreground font-mono">{mvt.produit.sku}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {Math.abs(mvt.quantite)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(mvt.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                  <CardDescription>
                    Fichiers et documents du projet
                  </CardDescription>
                </div>
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Ajouter un document
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
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
                <p className="text-center py-8 text-muted-foreground">
                  Aucun document
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={`/api/projets/${id}/documents/${doc.id}`} download={doc.filename}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDocToDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Images du projet
                  </CardTitle>
                  <CardDescription>
                    Organisez vos photos en dossiers (avant/après, preuves de travaux)
                  </CardDescription>
                </div>
                <Button onClick={() => setFolderDialog(true)}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Nouveau dossier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {imageFolders.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucun dossier. Créez un dossier pour organiser vos photos.
                  </p>
                  <Button variant="outline" onClick={() => setFolderDialog(true)}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Créer un dossier
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {imageFolders.map((folder) => (
                    <div key={folder.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 dark:bg-muted/30 p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <FolderKanban className="h-4 w-4" />
                            {folder.nom}
                          </h4>
                          {folder.description && (
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {folder._count.images} image(s) • Créé le {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleMultiImageUpload(e, folder.id)}
                              disabled={uploadingImages}
                            />
                            <Button variant="outline" size="sm" asChild disabled={uploadingImages}>
                              <span>
                                {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                <span className="ml-2">Ajouter photos</span>
                              </span>
                            </Button>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {folder.images.length > 0 && (
                        <div className="p-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {folder.images.map((img) => (
                            <div
                              key={img.id}
                              className="relative group cursor-pointer rounded-lg overflow-hidden border bg-muted aspect-square"
                              onClick={() => openImageViewer(img, folder.id)}
                            >
                              <img
                                src={`/api/projets/${id}/images/${img.id}`}
                                alt={img.description || img.filename}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs">Voir</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les opérations et tâches associées seront également supprimées.
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

      <AlertDialog open={!!operationToDelete} onOpenChange={(open) => !open && setOperationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'opération ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les tâches de cette opération seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOperation} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tacheToDelete} onOpenChange={(open) => !open && setTacheToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTache} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={operationEditDialog} onOpenChange={(open) => { if (!open) { setOperationEditDialog(false); setEditingOperationId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'opération</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intitulé *</Label>
              <Input
                value={editOperation.intitule}
                onChange={(e) => setEditOperation({ ...editOperation, intitule: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editOperation.description}
                onChange={(e) => setEditOperation({ ...editOperation, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="date"
                value={editOperation.dateLimite}
                onChange={(e) => setEditOperation({ ...editOperation, dateLimite: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={editOperation.responsableId}
                onChange={(e) => setEditOperation({ ...editOperation, responsableId: e.target.value })}
              >
                <option value="">Non assigné</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleUpdateOperation}
              disabled={savingOperationEdit || !editOperation.intitule.trim()}
              className="w-full"
            >
              {savingOperationEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tacheEditDialog} onOpenChange={(open) => { if (!open) { setTacheEditDialog(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intitulé *</Label>
              <Input
                value={editTache.intitule}
                onChange={(e) => setEditTache({ ...editTache, intitule: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editTache.description}
                onChange={(e) => setEditTache({ ...editTache, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Durée estimée (minutes)</Label>
              <Input
                type="number"
                value={editTache.dureeMinutes}
                onChange={(e) => setEditTache({ ...editTache, dureeMinutes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={editTache.assigneId}
                onChange={(e) => setEditTache({ ...editTache, assigneId: e.target.value })}
              >
                <option value="">Non assigné</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="date"
                value={editTache.dateLimite}
                onChange={(e) => setEditTache({ ...editTache, dateLimite: e.target.value })}
              />
            </div>
            <Button
              onClick={handleUpdateTache}
              disabled={savingTacheEdit || !editTache.intitule.trim()}
              className="w-full"
            >
              {savingTacheEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Create Operation Dialog */}
      <Dialog open={operationDialog} onOpenChange={setOperationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle opération</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intitulé *</Label>
              <Input
                value={newOperation.intitule}
                onChange={(e) => setNewOperation({ ...newOperation, intitule: e.target.value })}
                placeholder="Ex: Installation matériel"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newOperation.description}
                onChange={(e) => setNewOperation({ ...newOperation, description: e.target.value })}
                placeholder="Description de l'opération..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="date"
                value={newOperation.dateLimite}
                onChange={(e) => setNewOperation({ ...newOperation, dateLimite: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={newOperation.responsableId}
                onChange={(e) => setNewOperation({ ...newOperation, responsableId: e.target.value })}
              >
                <option value="">Non assigné</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleCreateOperation}
              disabled={savingOperation || !newOperation.intitule.trim()}
              className="w-full"
            >
              {savingOperation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'opération
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={!!tacheDialog} onOpenChange={(open) => !open && setTacheDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intitulé *</Label>
              <Input
                value={newTache.intitule}
                onChange={(e) => setNewTache({ ...newTache, intitule: e.target.value })}
                placeholder="Ex: Configurer serveur"
              />
            </div>
            <div className="space-y-2">
              <Label>Durée estimée (minutes)</Label>
              <Input
                type="number"
                value={newTache.dureeMinutes}
                onChange={(e) => setNewTache({ ...newTache, dureeMinutes: e.target.value })}
                placeholder="Ex: 60 pour 1 heure"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={newTache.assigneId}
                onChange={(e) => setNewTache({ ...newTache, assigneId: e.target.value })}
              >
                <option value="">Non assigné</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="date"
                value={newTache.dateLimite}
                onChange={(e) => setNewTache({ ...newTache, dateLimite: e.target.value })}
              />
            </div>
            <Button
              onClick={handleCreateTache}
              disabled={savingTache || !newTache.intitule.trim()}
              className="w-full"
            >
              {savingTache && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la tâche
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeDialog} onOpenChange={(open) => !open && setStatusChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer le statut de la tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous changer le statut de "{statusChangeDialog?.taskName}" de{' '}
              <strong>{statusChangeDialog?.currentStatus === 'a_faire' ? 'À faire' : statusChangeDialog?.currentStatus === 'en_cours' ? 'En cours' : 'Terminé'}</strong>{' '}
              à <strong>{statusChangeDialog?.newStatus === 'a_faire' ? 'À faire' : statusChangeDialog?.newStatus === 'en_cours' ? 'En cours' : 'Terminé'}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Creation Dialog */}
      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau dossier d'images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du dossier *</Label>
              <Input
                value={newFolder.nom}
                onChange={(e) => setNewFolder({ ...newFolder, nom: e.target.value })}
                placeholder="Ex: Photos avant travaux, Installation terminée..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newFolder.description}
                onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                placeholder="Description optionnelle du dossier"
              />
            </div>
            <Button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolder.nom.trim()}
              className="w-full"
            >
              {creatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le dossier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Ex: Photo avant travaux, Photo après installation..."
              />
            </div>
            <div className="space-y-2">
              <Label>Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>
            {uploadingImage && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Upload en cours...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog with Navigation */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => { if (!open) { setViewingImage(null); setViewingFolderId(null); } }}>
        <DialogContent className="max-w-4xl h-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{viewingImage?.description || viewingImage?.filename}</span>
              {getCurrentFolderImages().length > 1 && (
                <span className="text-sm font-normal text-muted-foreground flex-shrink-0 ml-2">
                  {getCurrentImageIndex() + 1} / {getCurrentFolderImages().length}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={`/api/projets/${id}/images/${viewingImage.id}`}
                  alt={viewingImage.description || viewingImage.filename}
                  className="w-full max-h-[55vh] object-contain rounded-lg"
                />
                {getCurrentFolderImages().length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => navigateImage('prev')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => navigateImage('next')}
                    >
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(viewingImage.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteImage(viewingImage.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
              {getCurrentFolderImages().length > 1 && (
                <div className="flex gap-1 overflow-x-auto">
                  {getCurrentFolderImages().slice(0, 8).map((img) => (
                    <div
                      key={img.id}
                      className={`flex-shrink-0 w-12 h-12 rounded cursor-pointer border-2 overflow-hidden ${img.id === viewingImage.id ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setViewingImage(img)}
                    >
                      <img
                        src={`/api/projets/${id}/images/${img.id}`}
                        alt={img.description || img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {getCurrentFolderImages().length > 8 && (
                    <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{getCurrentFolderImages().length - 8}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
