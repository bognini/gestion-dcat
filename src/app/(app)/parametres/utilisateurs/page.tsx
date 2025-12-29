'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  Pencil,
  UserX,
  UserCheck,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/utils';

interface Utilisateur {
  id: string;
  username: string;
  nom: string;
  prenom: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrateur', icon: ShieldCheck, color: 'text-red-600' },
  { value: 'technicien', label: 'Technicien', icon: Shield, color: 'text-blue-600' },
  { value: 'marketing', label: 'Marketing', icon: Shield, color: 'text-purple-600' },
  { value: 'comptable', label: 'Comptable', icon: Shield, color: 'text-green-600' },
  { value: 'assistante', label: 'Assistante', icon: Shield, color: 'text-orange-600' },
];

export default function UtilisateursPage() {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Deactivate dialog
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<Utilisateur | null>(null);
  
  // Reset password dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<Utilisateur | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nom: '',
    prenom: '',
    role: 'technicien',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch('/api/utilisateurs?all=true');
      if (res.ok) {
        setUtilisateurs(await res.json());
      }
    } catch (error) {
      console.error('Error fetching utilisateurs:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les utilisateurs' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUtilisateurs = utilisateurs.filter(u => {
    const fullName = `${u.prenom || ''} ${u.nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && u.isActive) ||
                          (filterStatus === 'inactive' && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      nom: '',
      prenom: '',
      role: 'technicien',
      password: '',
      isActive: true,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEditDialog = (user: Utilisateur) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = editingUser ? `/api/utilisateurs/${editingUser.id}` : '/api/utilisateurs';
      const method = editingUser ? 'PUT' : 'POST';
      
      const body: Record<string, unknown> = {
        username: formData.username,
        email: formData.email,
        nom: formData.nom,
        prenom: formData.prenom || null,
        role: formData.role,
        isActive: formData.isActive,
      };
      
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      toast({
        title: editingUser ? 'Utilisateur modifié' : 'Utilisateur créé',
        description: `${formData.prenom} ${formData.nom} a été ${editingUser ? 'modifié' : 'créé'} avec succès`,
      });
      
      setDialogOpen(false);
      fetchUtilisateurs();
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

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    
    try {
      const res = await fetch(`/api/utilisateurs/${userToDeactivate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !userToDeactivate.isActive }),
      });

      if (!res.ok) throw new Error('Erreur');

      toast({
        title: userToDeactivate.isActive ? 'Utilisateur désactivé' : 'Utilisateur réactivé',
        description: `${userToDeactivate.prenom || ''} ${userToDeactivate.nom}`,
      });
      
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
      fetchUtilisateurs();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le statut' });
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    
    try {
      const res = await fetch(`/api/utilisateurs/${userToReset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });

      if (!res.ok) throw new Error('Erreur');

      const data = await res.json();
      setTempPassword(data.tempPassword);
      
      toast({
        title: 'Mot de passe réinitialisé',
        description: `Nouveau mot de passe temporaire généré pour ${userToReset.prenom || ''} ${userToReset.nom}`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de réinitialiser le mot de passe' });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role);
    const Icon = roleConfig?.icon || Shield;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${roleConfig?.color || ''}`} />
        {ROLE_LABELS[role] || role}
      </Badge>
    );
  };

  const stats = {
    total: utilisateurs.length,
    active: utilisateurs.filter(u => u.isActive).length,
    admins: utilisateurs.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">
            Créez et gérez les comptes utilisateurs
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              Administrateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des utilisateurs ({filteredUtilisateurs.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredUtilisateurs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUtilisateurs.map((user) => (
                  <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.prenom} {user.nom}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToReset(user);
                            setTempPassword(null);
                            setResetPasswordDialogOpen(true);
                          }}
                          title="Réinitialiser mot de passe"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToDeactivate(user);
                            setDeactivateDialogOpen(true);
                          }}
                          title={user.isActive ? 'Désactiver' : 'Réactiver'}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Modifiez les informations de l\'utilisateur'
                : 'Créez un nouveau compte utilisateur'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nom d&apos;utilisateur *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className={`h-4 w-4 ${role.color}`} />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe *'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Min. 6 caractères'}
                  required={!editingUser}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToDeactivate?.isActive ? 'Désactiver l\'utilisateur ?' : 'Réactiver l\'utilisateur ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDeactivate?.isActive
                ? `${userToDeactivate?.prenom || ''} ${userToDeactivate?.nom} ne pourra plus se connecter.`
                : `${userToDeactivate?.prenom || ''} ${userToDeactivate?.nom} pourra à nouveau se connecter.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>
              {userToDeactivate?.isActive ? 'Désactiver' : 'Réactiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) setTempPassword(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {tempPassword 
                ? 'Mot de passe temporaire généré avec succès'
                : `Générer un nouveau mot de passe pour ${userToReset?.prenom || ''} ${userToReset?.nom}`}
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Nouveau mot de passe temporaire :</p>
                <p className="font-mono text-lg font-bold">{tempPassword}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                L&apos;utilisateur devra changer ce mot de passe lors de sa prochaine connexion.
              </p>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Un mot de passe temporaire sera généré. L&apos;utilisateur devra le changer lors de sa prochaine connexion.
              </p>
            </div>
          )}
          <DialogFooter>
            {tempPassword ? (
              <Button onClick={() => setResetPasswordDialogOpen(false)}>
                Fermer
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleResetPassword}>
                  <Key className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
