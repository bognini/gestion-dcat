'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Receipt, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  CalendarPlus,
  Upload,
  FileText,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';

interface Charge {
  id: string;
  nom: string;
  description: string | null;
  montant: number;
  type: string;
  frequence: string;
  dateDebut: string;
  dateFin: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Depense {
  id: string;
  description: string;
  montant: number;
  categorie: string;
  date: string;
  justificatif: string | null;
  createdAt: string;
}

interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  description: string | null;
  justificatif: string | null;
  date: string;
  createdAt: string;
}

const TYPES_CHARGE = [
  { value: 'loyer', label: 'Loyer' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'eau', label: 'Eau' },
  { value: 'internet', label: 'Internet' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'abonnement', label: 'Abonnement' },
  { value: 'autre', label: 'Autre' },
];

const FREQUENCES = [
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'bimensuelle', label: 'Bi-Mensuelle' },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'semestrielle', label: 'Semestrielle' },
  { value: 'annuelle', label: 'Annuelle' },
];

const CATEGORIES_DEPENSE = [
  { value: 'fournitures', label: 'Fournitures de bureau' },
  { value: 'transport', label: 'Transport' },
  { value: 'repas', label: 'Repas' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'formation', label: 'Formation' },
  { value: 'travaux', label: 'Travaux' },
  { value: 'autre', label: 'Autre' },
  // Include charge types for échéances
  { value: 'loyer', label: 'Loyer' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'eau', label: 'Eau' },
  { value: 'internet', label: 'Internet' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'abonnement', label: 'Abonnement' },
  // Include abonnement types
  { value: 'hosting', label: 'Hébergement Web' },
  { value: 'electricity', label: 'Électricité' },
  { value: 'water', label: 'Eau' },
  { value: 'software', label: 'Logiciel' },
  { value: 'ai', label: 'Intelligence Artificielle' },
  { value: 'antivirus', label: 'Antivirus / Sécurité' },
  { value: 'telecom', label: 'Télécom' },
  { value: 'other', label: 'Autre' },
];

export default function ChargesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [mouvementsCaisse, setMouvementsCaisse] = useState<MouvementCaisse[]>([]);
  const [soldeCaisse, setSoldeCaisse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'charges');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'charges');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/administration/charges?${params.toString()}`);
  };
  
  // Charge dialog states
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [savingCharge, setSavingCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    nom: '',
    description: '',
    montant: '',
    type: '',
    frequence: 'mensuelle',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
  });
  
  // Depense dialog states
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [savingDepense, setSavingDepense] = useState(false);
  const [uploadingJustificatif, setUploadingJustificatif] = useState<string | null>(null);
  const [depenseForm, setDepenseForm] = useState({
    description: '',
    montant: '',
    categorie: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Caisse dialog states
  const [caisseDialogOpen, setCaisseDialogOpen] = useState(false);
  const [savingCaisse, setSavingCaisse] = useState(false);
  const [caisseForm, setCaisseForm] = useState({
    type: 'entree' as 'entree' | 'sortie',
    montant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'charge' | 'depense' | 'caisse'; id: string } | null>(null);

  // Échéance dialog
  const [echeanceDialogOpen, setEcheanceDialogOpen] = useState(false);
  const [selectedChargeForEcheance, setSelectedChargeForEcheance] = useState<Charge | null>(null);
  const [echeanceForm, setEcheanceForm] = useState({
    periode: '',
    datePaiement: new Date().toISOString().split('T')[0],
    isPaid: false,
  });
  const [savingEcheance, setSavingEcheance] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chargesRes, depensesRes, caisseRes] = await Promise.all([
        fetch('/api/charges'),
        fetch('/api/depenses'),
        fetch('/api/caisse'),
      ]);
      
      if (chargesRes.ok) setCharges(await chargesRes.json());
      if (depensesRes.ok) setDepenses(await depensesRes.json());
      if (caisseRes.ok) {
        const caisseData = await caisseRes.json();
        setMouvementsCaisse(caisseData.mouvements || []);
        setSoldeCaisse(caisseData.solde || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharge = async () => {
    if (!chargeForm.nom.trim() || !chargeForm.montant || !chargeForm.type) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    setSavingCharge(true);
    try {
      const url = editingCharge ? `/api/charges/${editingCharge.id}` : '/api/charges';
      const method = editingCharge ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...chargeForm,
          montant: parseFloat(chargeForm.montant),
          dateFin: chargeForm.dateFin || null,
        }),
      });

      if (res.ok) {
        toast({ title: editingCharge ? 'Charge mise à jour' : 'Charge créée' });
        fetchData();
        setChargeDialogOpen(false);
        resetChargeForm();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'enregistrement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingCharge(false);
    }
  };

  const handleSaveDepense = async () => {
    if (!depenseForm.description.trim() || !depenseForm.montant || !depenseForm.categorie) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    const montant = parseFloat(depenseForm.montant);

    // Check if caisse has sufficient balance (only for new depenses or if amount increased)
    if (!editingDepense && montant > soldeCaisse) {
      toast({ 
        variant: 'destructive', 
        title: 'Solde caisse insuffisant', 
        description: `Solde actuel: ${soldeCaisse.toLocaleString()} FCFA. Veuillez approvisionner la caisse.` 
      });
      return;
    }

    setSavingDepense(true);
    try {
      const isEditing = !!editingDepense;
      const url = isEditing ? `/api/depenses/${editingDepense.id}` : '/api/depenses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...depenseForm,
          montant,
        }),
      });

      if (res.ok) {
        // Auto-subtract from caisse only for new depenses
        if (!isEditing) {
          await fetch('/api/caisse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'sortie',
              montant,
              description: `Dépense: ${depenseForm.description}`,
              date: depenseForm.date,
            }),
          });
          toast({ title: 'Dépense enregistrée et déduite de la caisse' });
        } else {
          toast({ title: 'Dépense mise à jour' });
        }
        fetchData();
        setDepenseDialogOpen(false);
        resetDepenseForm();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'enregistrement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingDepense(false);
    }
  };

  const handleUploadJustificatif = async (depenseId: string, file: File) => {
    setUploadingJustificatif(depenseId);
    try {
      const formData = new FormData();
      formData.append('justificatif', file);

      const res = await fetch(`/api/depenses/${depenseId}/justificatif`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Justificatif ajouté' });
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'upload' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setUploadingJustificatif(null);
    }
  };

  const handleSaveCaisse = async () => {
    if (!caisseForm.montant || parseFloat(caisseForm.montant) <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Montant invalide' });
      return;
    }

    setSavingCaisse(true);
    try {
      const res = await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: caisseForm.type,
          montant: parseFloat(caisseForm.montant),
          description: caisseForm.description.trim() || null,
          date: caisseForm.date,
        }),
      });

      if (res.ok) {
        toast({ title: caisseForm.type === 'entree' ? 'Entrée caisse enregistrée' : 'Sortie caisse enregistrée' });
        fetchData();
        setCaisseDialogOpen(false);
        resetCaisseForm();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', title: 'Erreur', description: data.error || 'Erreur lors de l\'enregistrement' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setSavingCaisse(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      let url = '';
      if (itemToDelete.type === 'charge') url = `/api/charges/${itemToDelete.id}`;
      else if (itemToDelete.type === 'depense') url = `/api/depenses/${itemToDelete.id}`;
      else url = `/api/caisse/${itemToDelete.id}`;
      
      const res = await fetch(url, { method: 'DELETE' });
      
      if (res.ok) {
        const msg = itemToDelete.type === 'charge' ? 'Charge supprimée' : itemToDelete.type === 'depense' ? 'Dépense supprimée' : 'Mouvement supprimé';
        toast({ title: msg });
        fetchData();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const resetChargeForm = () => {
    setChargeForm({
      nom: '',
      description: '',
      montant: '',
      type: '',
      frequence: 'mensuelle',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
    });
    setEditingCharge(null);
  };

  const resetDepenseForm = () => {
    setDepenseForm({
      description: '',
      montant: '',
      categorie: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingDepense(null);
  };

  const openEditDepense = (depense: Depense) => {
    setEditingDepense(depense);
    setDepenseForm({
      description: depense.description,
      montant: String(depense.montant),
      categorie: depense.categorie,
      date: depense.date.split('T')[0],
    });
    setDepenseDialogOpen(true);
  };

  const resetCaisseForm = () => {
    setCaisseForm({
      type: 'entree',
      montant: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleOpenEcheanceDialog = (charge: Charge) => {
    setSelectedChargeForEcheance(charge);
    // Calculate current period based on frequency
    const today = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let periode = '';
    
    switch (charge.frequence) {
      case 'mensuelle':
        periode = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
        break;
      case 'bimensuelle':
        const biMonth = Math.floor(today.getMonth() / 2) * 2;
        periode = `${monthNames[biMonth]}-${monthNames[biMonth + 1]} ${today.getFullYear()}`;
        break;
      case 'trimestrielle':
        const quarter = Math.floor(today.getMonth() / 3) + 1;
        periode = `T${quarter} ${today.getFullYear()}`;
        break;
      case 'semestrielle':
        const semester = today.getMonth() < 6 ? '1er' : '2ème';
        periode = `${semester} Semestre ${today.getFullYear()}`;
        break;
      case 'annuelle':
        periode = `Année ${today.getFullYear()}`;
        break;
      default:
        periode = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    }
    
    setEcheanceForm({
      periode,
      datePaiement: today.toISOString().split('T')[0],
      isPaid: true,
    });
    setEcheanceDialogOpen(true);
  };

  const handleSaveEcheance = async () => {
    if (!selectedChargeForEcheance) return;
    
    setSavingEcheance(true);
    try {
      // Create a depense entry to record this payment
      const res = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `${selectedChargeForEcheance.nom} - ${echeanceForm.periode}${echeanceForm.isPaid ? ' (Payé)' : ' (Non payé)'}`,
          montant: selectedChargeForEcheance.montant,
          categorie: selectedChargeForEcheance.type || 'autre',
          date: echeanceForm.datePaiement,
        }),
      });

      if (res.ok) {
        toast({ 
          title: echeanceForm.isPaid ? 'Paiement enregistré' : 'Échéance enregistrée',
          description: `${selectedChargeForEcheance.nom} pour ${echeanceForm.periode}` 
        });
        setEcheanceDialogOpen(false);
        setSelectedChargeForEcheance(null);
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer l\'échéance' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer l\'échéance' });
    } finally {
      setSavingEcheance(false);
    }
  };

  const openEditCharge = (charge: Charge) => {
    setEditingCharge(charge);
    setChargeForm({
      nom: charge.nom,
      description: charge.description || '',
      montant: String(charge.montant),
      type: charge.type,
      frequence: charge.frequence,
      dateDebut: charge.dateDebut.split('T')[0],
      dateFin: charge.dateFin ? charge.dateFin.split('T')[0] : '',
    });
    setChargeDialogOpen(true);
  };

  // Calculate stats
  const totalChargesMensuelles = charges
    .filter(c => c.isActive)
    .reduce((sum, c) => {
      const montant = c.montant;
      switch (c.frequence) {
        case 'annuel': return sum + montant / 12;
        case 'semestriel': return sum + montant / 6;
        case 'trimestriel': return sum + montant / 3;
        default: return sum + montant;
      }
    }, 0);

  const totalDepensesMois = depenses
    .filter(d => {
      const date = new Date(d.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.montant, 0);

  if (loading) {
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
          <Link href="/administration/charges-depenses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Suivi Charges et Dépenses
          </h2>
          <p className="text-muted-foreground">
            Gérez les charges fixes et les dépenses de l&apos;entreprise
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Charges mensuelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 whitespace-nowrap">
              {formatCurrency(totalChargesMensuelles)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {charges.filter(c => c.isActive).length} charges actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 whitespace-nowrap">
              {formatCurrency(totalDepensesMois)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {depenses.filter(d => {
                const date = new Date(d.date);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length} dépenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total mensuel estimé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold whitespace-nowrap">
              {formatCurrency(totalChargesMensuelles + totalDepensesMois)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Charges + Dépenses
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              Solde Caisse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold whitespace-nowrap ${soldeCaisse >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(soldeCaisse)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mouvementsCaisse.length} mouvements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="charges">Charges fixes</TabsTrigger>
            <TabsTrigger value="depenses">Dépenses</TabsTrigger>
            <TabsTrigger value="caisse" className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Approvisionnement Caisse
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => {
            if (activeTab === 'charges') setChargeDialogOpen(true);
            else if (activeTab === 'depenses') setDepenseDialogOpen(true);
            else setCaisseDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'charges' ? 'Nouvelle charge' : activeTab === 'depenses' ? 'Nouvelle dépense' : 'Nouveau mouvement'}
          </Button>
        </div>

        <TabsContent value="charges" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {charges.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucune charge enregistrée
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fréquence</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>
                          <p className="font-medium">{charge.nom}</p>
                          {charge.description && (
                            <p className="text-sm text-muted-foreground">{charge.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {TYPES_CHARGE.find(t => t.value === charge.type)?.label || charge.type}
                        </TableCell>
                        <TableCell>
                          {FREQUENCES.find(f => f.value === charge.frequence)?.label || charge.frequence}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatCurrency(charge.montant)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={charge.isActive ? 'default' : 'secondary'}>
                            {charge.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Générer échéance"
                              onClick={() => handleOpenEcheanceDialog(charge)}
                            >
                              <CalendarPlus className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditCharge(charge)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ type: 'charge', id: charge.id });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {depenses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucune dépense enregistrée
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Justificatif</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...depenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((depense) => (
                      <TableRow key={depense.id}>
                        <TableCell>{formatDate(depense.date)}</TableCell>
                        <TableCell>{depense.description}</TableCell>
                        <TableCell>
                          {CATEGORIES_DEPENSE.find(c => c.value === depense.categorie)?.label || depense.categorie}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatCurrency(depense.montant)}
                        </TableCell>
                        <TableCell>
                          {depense.justificatif ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-green-600"
                            >
                              <a href={depense.justificatif} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </a>
                            </Button>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadJustificatif(depense.id, file);
                                }}
                                disabled={uploadingJustificatif === depense.id}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={uploadingJustificatif === depense.id}
                              >
                                <span>
                                  {uploadingJustificatif === depense.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Ajouter
                                    </>
                                  )}
                                </span>
                              </Button>
                            </label>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDepense(depense)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ type: 'depense', id: depense.id });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caisse" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Mouvements de Caisse
              </CardTitle>
              <CardDescription>
                Entrées et sorties de fonds. Les dépenses sont automatiquement déduites de la caisse.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mouvementsCaisse.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucun mouvement enregistré
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...mouvementsCaisse].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((mouvement) => (
                      <TableRow key={mouvement.id}>
                        <TableCell>{formatDate(mouvement.date)}</TableCell>
                        <TableCell>
                          <Badge variant={mouvement.type === 'entree' ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                            {mouvement.type === 'entree' ? (
                              <><ArrowDownCircle className="h-3 w-3" /> Entrée</>
                            ) : (
                              <><ArrowUpCircle className="h-3 w-3" /> Sortie</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{mouvement.description || '-'}</TableCell>
                        <TableCell className={`text-right font-medium whitespace-nowrap ${mouvement.type === 'entree' ? 'text-green-600' : 'text-red-600'}`}>
                          {mouvement.type === 'entree' ? '+' : '-'}{formatCurrency(mouvement.montant)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              setItemToDelete({ type: 'caisse', id: mouvement.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Charge Dialog */}
      <Dialog open={chargeDialogOpen} onOpenChange={(open) => { setChargeDialogOpen(open); if (!open) resetChargeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharge ? 'Modifier la charge' : 'Nouvelle charge fixe'}</DialogTitle>
            <DialogDescription>
              Enregistrez une charge récurrente de l&apos;entreprise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={chargeForm.nom}
                onChange={(e) => setChargeForm({ ...chargeForm, nom: e.target.value })}
                placeholder="Ex: Loyer bureau"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={chargeForm.type} onValueChange={(v) => setChargeForm({ ...chargeForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_CHARGE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fréquence *</Label>
                <Select value={chargeForm.frequence} onValueChange={(v) => setChargeForm({ ...chargeForm, frequence: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <MoneyInput
                min="0"
                value={chargeForm.montant}
                onChange={(e) => setChargeForm({ ...chargeForm, montant: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input
                  type="date"
                  value={chargeForm.dateDebut}
                  onChange={(e) => setChargeForm({ ...chargeForm, dateDebut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin (optionnel)</Label>
                <Input
                  type="date"
                  value={chargeForm.dateFin}
                  onChange={(e) => setChargeForm({ ...chargeForm, dateFin: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={chargeForm.description}
                onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveCharge} disabled={savingCharge}>
              {savingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCharge ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Depense Dialog */}
      <Dialog open={depenseDialogOpen} onOpenChange={(open) => { setDepenseDialogOpen(open); if (!open) resetDepenseForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
            <DialogDescription>
              {editingDepense ? 'Modifiez les informations de la dépense' : 'Enregistrez une dépense ponctuelle'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={depenseForm.description}
                onChange={(e) => setDepenseForm({ ...depenseForm, description: e.target.value })}
                placeholder="Ex: Achat fournitures"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={depenseForm.categorie} onValueChange={(v) => setDepenseForm({ ...depenseForm, categorie: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_DEPENSE.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={depenseForm.date}
                  onChange={(e) => setDepenseForm({ ...depenseForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <MoneyInput
                min="0"
                value={depenseForm.montant}
                onChange={(e) => setDepenseForm({ ...depenseForm, montant: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepenseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveDepense} disabled={savingDepense}>
              {savingDepense && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Caisse Dialog */}
      <Dialog open={caisseDialogOpen} onOpenChange={(open) => { setCaisseDialogOpen(open); if (!open) resetCaisseForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Nouveau mouvement de caisse
            </DialogTitle>
            <DialogDescription>
              Enregistrez une entrée ou sortie de fonds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de mouvement *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={caisseForm.type === 'entree' ? 'default' : 'outline'}
                  className={caisseForm.type === 'entree' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setCaisseForm({ ...caisseForm, type: 'entree' })}
                >
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Entrée
                </Button>
                <Button
                  type="button"
                  variant={caisseForm.type === 'sortie' ? 'default' : 'outline'}
                  className={caisseForm.type === 'sortie' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setCaisseForm({ ...caisseForm, type: 'sortie' })}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Sortie
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <MoneyInput
                min="0"
                value={caisseForm.montant}
                onChange={(e) => setCaisseForm({ ...caisseForm, montant: e.target.value })}
                placeholder="0"
              />
              {caisseForm.type === 'sortie' && (
                <p className="text-xs text-muted-foreground">
                  Solde disponible: {formatCurrency(soldeCaisse)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={caisseForm.date}
                onChange={(e) => setCaisseForm({ ...caisseForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description / Justificatif</Label>
              <Input
                value={caisseForm.description}
                onChange={(e) => setCaisseForm({ ...caisseForm, description: e.target.value })}
                placeholder="Ex: Approvisionnement mensuel, Retrait pour achat..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaisseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveCaisse} disabled={savingCaisse}>
              {savingCaisse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Échéance Dialog */}
      <Dialog open={echeanceDialogOpen} onOpenChange={(open) => { setEcheanceDialogOpen(open); if (!open) setSelectedChargeForEcheance(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
              Enregistrer un paiement
            </DialogTitle>
            <DialogDescription>
              {selectedChargeForEcheance?.nom} - {formatCurrency(selectedChargeForEcheance?.montant || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Charge:</span>
                <span className="font-medium">{selectedChargeForEcheance?.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fréquence:</span>
                <span>{FREQUENCES.find(f => f.value === selectedChargeForEcheance?.frequence)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant:</span>
                <span className="font-medium text-primary">{formatCurrency(selectedChargeForEcheance?.montant || 0)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Période concernée</Label>
              <Input
                value={echeanceForm.periode}
                onChange={(e) => setEcheanceForm({ ...echeanceForm, periode: e.target.value })}
                placeholder="Ex: Janvier 2025, T1 2025..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input
                type="date"
                value={echeanceForm.datePaiement}
                onChange={(e) => setEcheanceForm({ ...echeanceForm, datePaiement: e.target.value })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Statut du paiement</p>
                <p className="text-sm text-muted-foreground">Cette charge a-t-elle été payée ?</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={echeanceForm.isPaid ? 'default' : 'outline'}
                  className={echeanceForm.isPaid ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setEcheanceForm({ ...echeanceForm, isPaid: true })}
                >
                  Payé
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!echeanceForm.isPaid ? 'default' : 'outline'}
                  className={!echeanceForm.isPaid ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  onClick={() => setEcheanceForm({ ...echeanceForm, isPaid: false })}
                >
                  Non payé
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEcheanceDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEcheance} disabled={savingEcheance}>
              {savingEcheance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?
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
