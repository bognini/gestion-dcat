'use client';

import Link from 'next/link';
import { 
  FileText, 
  Wallet, 
  Users, 
  FilePlus2,
  ClipboardList,
  Receipt,
  CreditCard,
  UserCog,
  CalendarCheck,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const adminSections = [
  {
    id: 'gestion-administrative',
    title: 'Gestion Administrative',
    description: 'Contrats, documents et suivi administratif',
    href: '/administration/gestion-administrative',
    icon: FileText,
    colorClass: 'bg-blue-500 hover:bg-blue-600',
    subsections: [
      { title: 'Contrats Clients', href: '/administration/gestion-administrative/contrats-clients', icon: ClipboardList },
      { title: 'Contrats Prestataires', href: '/administration/gestion-administrative/contrats-prestataires', icon: FileCheck2 },
    ]
  },
  {
    id: 'finance',
    title: 'Finance et Comptabilité',
    description: 'Devis, factures, paiements et suivi financier',
    href: '/administration/finance-comptabilite',
    icon: Wallet,
    colorClass: 'bg-indigo-500 hover:bg-indigo-600',
    subsections: [
      { title: 'Générer un Devis', href: '/administration/finance-comptabilite/devis', icon: FilePlus2 },
      { title: 'Factures', href: '/administration/finance-comptabilite/factures', icon: Receipt },
      { title: 'Paiements', href: '/administration/finance-comptabilite/paiements', icon: CreditCard },
    ]
  },
  {
    id: 'rh',
    title: 'Ressources Humaines',
    description: 'Employés, absences et gestion des salaires',
    href: '/administration/ressources-humaines',
    icon: Users,
    colorClass: 'bg-emerald-500 hover:bg-emerald-600',
    subsections: [
      { title: 'Employés', href: '/administration/ressources-humaines/employes', icon: UserCog },
      { title: 'Absences', href: '/administration/ressources-humaines/absences', icon: CalendarCheck },
      { title: 'Salaires', href: '/administration/ressources-humaines/salaires', icon: CreditCard },
    ]
  },
  {
    id: 'charges',
    title: 'Suivi Charges et Dépenses',
    description: 'Charges, dépenses et abonnements de l\'entreprise',
    href: '/administration/charges-depenses',
    icon: Receipt,
    colorClass: 'bg-orange-500 hover:bg-orange-600',
    subsections: [
      { title: 'Charges fixes', href: '/administration/charges?tab=charges', icon: ClipboardList },
      { title: 'Dépenses', href: '/administration/charges?tab=depenses', icon: CreditCard },
      { title: 'Abonnements', href: '/administration/abonnements', icon: RefreshCw },
    ]
  },
];

export default function AdministrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Administration</h2>
        <p className="text-muted-foreground">
          Gérez les aspects administratifs, financiers et RH de l&apos;entreprise
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="overflow-hidden">
              <Link href={section.href}>
                <CardHeader className={cn("text-white", section.colorClass)}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
              </Link>
              <CardContent className="pt-4">
                <CardDescription className="mb-4">{section.description}</CardDescription>
                <div className="space-y-2">
                  {section.subsections.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                      >
                        <SubIcon className="h-4 w-4" />
                        <span>{sub.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
