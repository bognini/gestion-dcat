'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { 
  FileText,
  Calendar,
  Clock,
  Wrench,
  Download,
  Printer,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface Partenaire {
  id: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  telephone1: string | null;
  email: string | null;
}

interface InterventionReport {
  id: string;
  reference: string | null;
  date: string;
  problemeSignale: string;
  typeMaintenance: string;
  typeDefaillance: string | null;
  rapport: string | null;
  recommandations: string | null;
  dureeMinutes: number | null;
  dureeFormatted: string;
  statut: string;
  modeIntervention: string | null;
  lieu: string | null;
  intervenants: string;
  contrat: string | null;
}

interface RapportData {
  partenaire: Partenaire;
  mois: {
    annee: number;
    mois: number;
    label: string;
  };
  statistiques: {
    totalInterventions: number;
    totalHeures: number;
    minutesRestantes: number;
    totalMinutes: number;
    dureeFormatted: string;
    parType: Record<string, number>;
    parStatut: Record<string, number>;
  };
  interventions: InterventionReport[];
}

const TYPE_LABELS: Record<string, string> = {
  corrective: 'Corrective',
  preventive: 'Préventive',
  planifiee: 'Planifiée',
};

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  a_faire: { label: 'À faire', color: 'bg-yellow-500' },
  en_cours: { label: 'En cours', color: 'bg-blue-500' },
  en_attente: { label: 'En attente', color: 'bg-orange-500' },
  termine: { label: 'Terminé', color: 'bg-green-500' },
};

export default function RapportMensuelPage() {
  const { toast } = useToast();
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [selectedPartenaire, setSelectedPartenaire] = useState('');
  const [selectedMois, setSelectedMois] = useState('');
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState<RapportData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPartenaires();
    // Set default month to current month
    const now = new Date();
    setSelectedMois(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const fetchPartenaires = async () => {
    try {
      const res = await fetch('/api/partenaires');
      if (res.ok) {
        setPartenaires(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateRapport = async () => {
    if (!selectedPartenaire || !selectedMois) {
      toast({ variant: 'destructive', title: 'Veuillez sélectionner un client et un mois' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/interventions/rapport-mensuel?partenaireId=${selectedPartenaire}&mois=${selectedMois}`
      );
      if (res.ok) {
        setRapport(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Erreur lors de la génération du rapport' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate month options (last 12 months)
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    monthOptions.push({ value, label });
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 15mm 15mm 25mm 15mm;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            padding: 10px 15mm;
            background: white;
          }
        }
      `}</style>
      <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Rapport Mensuel d&apos;Interventions
        </h2>
        <p className="text-muted-foreground">
          Générer un rapport mensuel des interventions pour un client
        </p>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Sélection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedPartenaire} onValueChange={setSelectedPartenaire}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {partenaires.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={selectedMois} onValueChange={setSelectedMois}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mois" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateRapport} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer le rapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rapport */}
      {rapport && (
        <div ref={printRef} className="space-y-6">
          {/* Action buttons */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>

          {/* Header */}
          <Card className="print:shadow-none print:border-0">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-start">
                  <Image
                    src="/dcat-logo.png"
                    alt="DCAT Logo"
                    width={80}
                    height={80}
                    className="rounded-lg"
                  />
                  <div>
                    <h1 className="text-2xl font-bold">RAPPORT MENSUEL D&apos;INTERVENTIONS</h1>
                    <p className="text-lg text-muted-foreground capitalize">{rapport.mois.label}</p>
                    <p className="text-sm text-blue-600 font-medium">DCAT - Data Communications & All Technologies</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{rapport.partenaire.nom}</p>
                  {rapport.partenaire.adresse && (
                    <p className="text-sm text-muted-foreground">{rapport.partenaire.adresse}</p>
                  )}
                  {rapport.partenaire.ville && (
                    <p className="text-sm text-muted-foreground">{rapport.partenaire.ville}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Total Interventions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{rapport.statistiques.totalInterventions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Durée Totale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{rapport.statistiques.dureeFormatted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Terminées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {rapport.statistiques.parStatut.termine || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  En attente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  {(rapport.statistiques.parStatut.en_attente || 0) + 
                   (rapport.statistiques.parStatut.a_faire || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interventions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détail des Interventions</CardTitle>
            </CardHeader>
            <CardContent>
              {rapport.interventions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucune intervention ce mois-ci
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Problème</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Intervenants</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rapport.interventions.map((int) => {
                      const statutConfig = STATUT_LABELS[int.statut] || { label: int.statut, color: 'bg-gray-500' };
                      return (
                        <TableRow key={int.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(int.date)}</TableCell>
                          <TableCell className="font-mono text-sm">{int.reference || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{TYPE_LABELS[int.typeMaintenance] || int.typeMaintenance}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{int.problemeSignale}</TableCell>
                          <TableCell className="whitespace-nowrap">{int.dureeFormatted}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{int.intervenants || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`${statutConfig.color} text-white`}>
                              {statutConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="print:mt-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground print:hidden">
                  Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total: {rapport.statistiques.totalInterventions} intervention(s)</p>
                  <p className="text-sm font-medium">Durée totale: {rapport.statistiques.dureeFormatted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixed Footer for Print */}
      {rapport && (
        <div className="print-footer hidden print:block">
          <p>DCAT (Data Communications & All Technologies) • E-Mail : info@dcat.ci • Site Web : www.dcat.ci</p>
          <p>S.A.R.L. au Capital de 10.000.000 FCFA • R.C. N° CI-ABJ-2004-B-4038 • C.C. N° 0411512 K</p>
          <p>Angré Château, Imm.BATIM, 1er Etage, Porte A108 - 27 B.P 826 Abidjan 27 • Tél.: (+225) 27 21 37 33 63 / 27 22 46 82 07</p>
        </div>
      )}
    </div>
    </>
  );
}
