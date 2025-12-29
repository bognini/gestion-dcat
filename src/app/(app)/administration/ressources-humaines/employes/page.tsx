'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatDate, formatCurrency } from '@/lib/utils';

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  departement: string | null;
  email: string | null;
  telephone: string | null;
  dateEmbauche: string;
  typeContrat: string | null;
  salaire: number | null;
  hasPhoto: boolean;
  utilisateur: { id: string; username: string; isActive: boolean } | null;
}

const CONTRAT_TYPES: Record<string, { label: string; color: string }> = {
  CDI: { label: 'CDI', color: 'bg-green-500' },
  CDD: { label: 'CDD', color: 'bg-blue-500' },
  Stage: { label: 'Stage', color: 'bg-yellow-500' },
  Freelance: { label: 'Freelance', color: 'bg-purple-500' },
};

export default function EmployesPage() {
  const { toast } = useToast();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [employeToDelete, setEmployeToDelete] = useState<Employe | null>(null);

  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = async () => {
    try {
      const res = await fetch('/api/employes');
      if (res.ok) {
        setEmployes(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!employeToDelete) return;
    try {
      const res = await fetch(`/api/employes/${employeToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployes(employes.filter(e => e.id !== employeToDelete.id));
        toast({ title: 'Employé supprimé' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setEmployeToDelete(null);
    }
  };

  const departments = [...new Set(employes.map(e => e.departement).filter(Boolean))] as string[];

  const filteredEmployes = employes.filter((e) => {
    const matchesSearch = 
      `${e.prenom} ${e.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || e.departement === deptFilter;
    return matchesSearch && matchesDept;
  });

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestion des Employés
          </h2>
          <p className="text-muted-foreground">
            {employes.length} employé(s) enregistré(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/administration/ressources-humaines/employes/nouveau">
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel Employé
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, poste, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Contrat</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Embauche</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredEmployes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun employé trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployes.map((employe) => {
                const contratConfig = CONTRAT_TYPES[employe.typeContrat || ''] || { label: employe.typeContrat || '-', color: 'bg-gray-500' };
                return (
                  <TableRow key={employe.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials(employe.prenom, employe.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            href={`/administration/ressources-humaines/employes/${employe.id}`}
                            className="font-medium hover:underline"
                          >
                            {employe.prenom} {employe.nom}
                          </Link>
                          {employe.utilisateur && (
                            <p className="text-xs text-muted-foreground">
                              @{employe.utilisateur.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        {employe.poste}
                      </div>
                    </TableCell>
                    <TableCell>
                      {employe.departement ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {employe.departement}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {employe.typeContrat && (
                        <Badge className={`${contratConfig.color} text-white`}>
                          {contratConfig.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {employe.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employe.email}
                          </div>
                        )}
                        {employe.telephone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employe.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(employe.dateEmbauche)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/administration/ressources-humaines/employes/${employe.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/administration/ressources-humaines/employes/${employe.id}/modifier`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setEmployeToDelete(employe)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!employeToDelete} onOpenChange={(open) => !open && setEmployeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;employé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement {employeToDelete?.prenom} {employeToDelete?.nom} et toutes ses données associées.
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
