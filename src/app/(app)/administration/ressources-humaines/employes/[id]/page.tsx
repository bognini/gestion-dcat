'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  User,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Loader2,
  Upload,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Absence {
  id: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  motif: string | null;
}

interface DocumentEmploye {
  id: string;
  nom: string;
  type: string;
  fichier: string;
  mimeType: string | null;
  taille: number | null;
  createdAt: string;
}

const DOCUMENT_TYPES: Record<string, string> = {
  cv: 'CV',
  diplome: 'Diplôme',
  contrat_travail: 'Contrat de travail',
  assurance: 'Assurance',
  piece_identite: 'Pièce d\'identité',
  certificat_medical: 'Certificat médical',
  attestation: 'Attestation',
  rib: 'RIB',
  autre: 'Autre',
};

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  dateEmbauche: string;
  poste: string;
  departement: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  salaire: number | null;
  typeContrat: string | null;
  hasPhoto: boolean;
  hasCV: boolean;
  absences: Absence[];
  utilisateur: { id: string; username: string; isActive: boolean } | null;
}

const CONTRAT_TYPES: Record<string, { label: string; color: string }> = {
  CDI: { label: 'CDI', color: 'bg-green-500' },
  CDD: { label: 'CDD', color: 'bg-blue-500' },
  Stage: { label: 'Stage', color: 'bg-yellow-500' },
  Freelance: { label: 'Freelance', color: 'bg-purple-500' },
};

const TYPES_ABSENCE: Record<string, string> = {
  conge_paye: 'Congé payé',
  conge_sans_solde: 'Sans solde',
  permission: 'Permission',
  maladie: 'Maladie',
  maternite: 'Maternité',
};

export default function EmployeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [employe, setEmploye] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentEmploye[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEmploye();
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/employes/${id}/documents`);
      if (res.ok) setDocuments(await res.json());
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const [selectedDocType, setSelectedDocType] = useState<string>('autre');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType || selectedDocType);

      const res = await fetch(`/api/employes/${id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Document ajouté' });
        fetchDocuments();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSpecificUpload = async (file: File, type: 'photo' | 'cv') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/employes/${id}/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: type === 'photo' ? 'Photo ajoutée' : 'CV ajouté' });
        fetchEmploye();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/employes/${id}/documents?documentId=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document supprimé' });
        fetchDocuments();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  const fetchEmploye = async () => {
    try {
      const res = await fetch(`/api/employes/${id}`);
      if (res.ok) {
        setEmploye(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Employé non trouvé' });
        router.push('/administration/ressources-humaines/employes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/employes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Employé supprimé' });
        router.push('/administration/ressources-humaines/employes');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!employe) return null;

  const contratConfig = CONTRAT_TYPES[employe.typeContrat || ''] || { label: employe.typeContrat || '-', color: 'bg-gray-500' };
  const initials = `${employe.prenom.charAt(0)}${employe.nom.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administration/ressources-humaines/employes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {employe.prenom} {employe.nom}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {employe.poste}
                {employe.departement && (
                  <>
                    <span>•</span>
                    <Building2 className="h-4 w-4" />
                    {employe.departement}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/administration/ressources-humaines/employes/${id}/modifier`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employe.dateNaissance && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Né(e) le {formatDate(employe.dateNaissance)}</span>
              </div>
            )}
            {employe.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${employe.email}`} className="text-blue-600 hover:underline">
                  {employe.email}
                </a>
              </div>
            )}
            {employe.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employe.telephone}</span>
              </div>
            )}
            {employe.adresse && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span>{employe.adresse}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contrat</span>
              <Badge className={`${contratConfig.color} text-white`}>
                {contratConfig.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date d&apos;embauche</span>
              <span className="font-medium">{formatDate(employe.dateEmbauche)}</span>
            </div>
            {employe.salaire && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salaire mensuel</span>
                <span className="font-medium">{formatCurrency(employe.salaire)}</span>
              </div>
            )}
            {employe.utilisateur && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Compte utilisateur</p>
                <p className="font-medium">@{employe.utilisateur.username}</p>
                <Badge variant={employe.utilisateur.isActive ? 'default' : 'secondary'}>
                  {employe.utilisateur.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </span>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button size="sm" variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </span>
                </Button>
              </label>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span>Photo</span>
              <div className="flex items-center gap-2">
                {employe.hasPhoto ? (
                  <>
                    <a href={`/api/employes/${id}/photo`} target="_blank" rel="noopener noreferrer">
                      <Badge variant="default" className="cursor-pointer hover:opacity-80">
                        <Download className="h-3 w-3 mr-1" />
                        Voir
                      </Badge>
                    </a>
                  </>
                ) : (
                  <Badge variant="secondary">Non</Badge>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSpecificUpload(file, 'photo');
                      e.target.value = '';
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
                    <span><Upload className="h-3 w-3" /></span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span>CV</span>
              <div className="flex items-center gap-2">
                {employe.hasCV ? (
                  <a href={`/api/employes/${id}/cv`} target="_blank" rel="noopener noreferrer">
                    <Badge variant="default" className="cursor-pointer hover:opacity-80">
                      <Download className="h-3 w-3 mr-1" />
                      Voir
                    </Badge>
                  </a>
                ) : (
                  <Badge variant="secondary">Non</Badge>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSpecificUpload(file, 'cv');
                      e.target.value = '';
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
                    <span><Upload className="h-3 w-3" /></span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Other document types */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Autres documents</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'contrat_travail', label: 'Contrat de travail', accept: '.pdf,.doc,.docx' },
                  { type: 'assurance', label: 'Assurance', accept: '.pdf,.jpg,.jpeg,.png' },
                  { type: 'piece_identite', label: 'Pièce d\'identité', accept: '.pdf,.jpg,.jpeg,.png' },
                  { type: 'rib', label: 'RIB', accept: '.pdf,.jpg,.jpeg,.png' },
                  { type: 'diplome', label: 'Diplôme', accept: '.pdf,.jpg,.jpeg,.png' },
                  { type: 'certificat_medical', label: 'Certificat médical', accept: '.pdf,.jpg,.jpeg,.png' },
                  { type: 'attestation', label: 'Attestation', accept: '.pdf,.doc,.docx' },
                  { type: 'autre', label: 'Autre document', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
                ].map((docType) => {
                  const existingDoc = documents.find(d => d.type === docType.type);
                  return (
                    <div key={docType.type} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                      <span className="truncate text-xs">{docType.label}</span>
                      <div className="flex items-center gap-1">
                        {existingDoc ? (
                          <>
                            <a href={existingDoc.fichier} target="_blank" rel="noopener noreferrer">
                              <Badge variant="default" className="cursor-pointer hover:opacity-80 text-xs h-5">
                                <Download className="h-2.5 w-2.5" />
                              </Badge>
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-destructive"
                              onClick={() => handleDeleteDocument(existingDoc.id)}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept={docType.accept}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(e, docType.type);
                              }}
                              disabled={uploading}
                            />
                            <Button size="sm" variant="ghost" className="h-5 px-1.5" asChild disabled={uploading}>
                              <span>
                                {uploading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Upload className="h-2.5 w-2.5" />}
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional uploaded documents */}
            {documents.filter(d => !['contrat_travail', 'assurance', 'piece_identite', 'rib', 'diplome', 'certificat_medical', 'attestation', 'autre'].includes(d.type) || documents.filter(doc => doc.type === d.type).length > 1).length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Documents supplémentaires</p>
                {documents.filter(d => !['contrat_travail', 'assurance', 'piece_identite', 'rib', 'diplome', 'certificat_medical', 'attestation'].includes(d.type)).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                    <a
                      href={doc.fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline truncate flex-1"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.nom}</span>
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {DOCUMENT_TYPES[doc.type] || doc.type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Absences */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des absences</CardTitle>
        </CardHeader>
        <CardContent>
          {employe.absences.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">Aucune absence enregistrée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employe.absences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell>{TYPES_ABSENCE[absence.type] || absence.type}</TableCell>
                    <TableCell>{formatDate(absence.dateDebut)}</TableCell>
                    <TableCell>{formatDate(absence.dateFin)}</TableCell>
                    <TableCell className="text-muted-foreground">{absence.motif || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={absence.statut === 'approuve' ? 'default' : absence.statut === 'refuse' ? 'destructive' : 'secondary'}>
                        {absence.statut === 'approuve' ? 'Approuvé' : absence.statut === 'refuse' ? 'Refusé' : 'En attente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;employé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement {employe.prenom} {employe.nom} et toutes ses données associées.
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
    </div>
  );
}
