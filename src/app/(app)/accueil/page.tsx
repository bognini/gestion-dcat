'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  Calendar, 
  Package, 
  Wrench, 
  ShoppingBag, 
  Settings,
  FileText,
  Wallet,
  Users,
  CalendarDays,
  UserCog,
  ArrowLeftRight,
  FolderCog,
  FolderKanban,
  TrendingUp,
  Store,
  Tags,
  Cog,
  Repeat,
  LayoutDashboard
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubsectionItem {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
  colorClass: string;
}

interface SectionConfig {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
  colorClass: string;
  module: 'administration' | 'calendrier' | 'stock' | 'technique' | 'marketing' | 'parametres';
  subsections: SubsectionItem[];
}

const sections: SectionConfig[] = [
  {
    id: 'administration',
    title: 'ADMINISTRATION',
    href: '/administration',
    icon: Building2,
    colorClass: 'section-card-administration',
    module: 'administration',
    subsections: [
      { id: 'tableau-bord', title: 'Tableau de Bord', href: '/administration/tableau-de-bord', icon: LayoutDashboard, colorClass: 'bg-slate-600 hover:bg-slate-700' },
      { id: 'gestion-admin', title: 'Gestion Administrative', href: '/administration/gestion-administrative', icon: FileText, colorClass: 'bg-blue-500 hover:bg-blue-600' },
      { id: 'finance', title: 'Finance et Comptabilité', href: '/administration/finance-comptabilite', icon: Wallet, colorClass: 'bg-indigo-500 hover:bg-indigo-600' },
      { id: 'rh', title: 'RH', href: '/administration/ressources-humaines', icon: Users, colorClass: 'bg-emerald-500 hover:bg-emerald-600' },
      { id: 'charges-depenses', title: 'Suivi Charges et Dépenses', href: '/administration/charges-depenses', icon: Repeat, colorClass: 'bg-pink-500 hover:bg-pink-600' },
    ],
  },
  {
    id: 'calendrier',
    title: 'PLANNING DE TRAVAIL',
    href: '/calendrier',
    icon: Calendar,
    colorClass: 'section-card-calendrier',
    module: 'calendrier',
    subsections: [
      { id: 'mois', title: 'Vue Mois', href: '/calendrier?view=month', icon: CalendarDays, colorClass: 'bg-purple-500 hover:bg-purple-600' },
      { id: 'semaine', title: 'Vue Semaine', href: '/calendrier?view=week', icon: Calendar, colorClass: 'bg-violet-500 hover:bg-violet-600' },
    ],
  },
  {
    id: 'stock',
    title: 'GESTION DE STOCK',
    href: '/stock',
    icon: Package,
    colorClass: 'section-card-stock',
    module: 'stock',
    subsections: [
      { id: 'produits', title: 'État de Stock', href: '/stock/produits', icon: Package, colorClass: 'bg-green-500 hover:bg-green-600' },
      { id: 'mouvements', title: 'Mouvements de Stock', href: '/stock/mouvements', icon: ArrowLeftRight, colorClass: 'bg-emerald-500 hover:bg-emerald-600' },
      { id: 'rangement', title: 'Rangement', href: '/stock/rangement', icon: FolderCog, colorClass: 'bg-teal-500 hover:bg-teal-600' },
    ],
  },
  {
    id: 'technique',
    title: 'TECHNIQUE',
    href: '/technique',
    icon: Wrench,
    colorClass: 'section-card-technique',
    module: 'technique',
    subsections: [
      { id: 'projets', title: 'Gestion des Projets', href: '/technique/projets', icon: FolderKanban, colorClass: 'bg-cyan-500 hover:bg-cyan-600' },
      { id: 'interventions', title: 'Gestion des Interventions', href: '/technique/interventions', icon: Wrench, colorClass: 'bg-sky-500 hover:bg-sky-600' },
      { id: 'missions', title: 'Fiches de Mission', href: '/technique/fiches-mission', icon: FileText, colorClass: 'bg-violet-500 hover:bg-violet-600' },
    ],
  },
  {
    id: 'marketing',
    title: 'MARKETING ET COMMERCIAL',
    href: '/marketing',
    icon: ShoppingBag,
    colorClass: 'section-card-marketing',
    module: 'marketing',
    subsections: [
      { id: 'emarket', title: 'DCAT E-Market', href: '/marketing/emarket', icon: Store, colorClass: 'bg-violet-500 hover:bg-violet-600' },
      { id: 'stats', title: 'Statistiques', href: '/marketing/statistiques', icon: TrendingUp, colorClass: 'bg-purple-500 hover:bg-purple-600' },
    ],
  },
  {
    id: 'parametres',
    title: 'PARAMÈTRES',
    href: '/parametres',
    icon: Settings,
    colorClass: 'section-card-parametres',
    module: 'parametres',
    subsections: [
      { id: 'references', title: 'Création des Références', href: '/parametres/references', icon: Tags, colorClass: 'bg-amber-500 hover:bg-amber-600' },
      { id: 'utilisateurs', title: 'Création des Utilisateurs', href: '/parametres/utilisateurs', icon: Users, colorClass: 'bg-blue-500 hover:bg-blue-600' },
      { id: 'options', title: 'Options', href: '/parametres/options', icon: Cog, colorClass: 'bg-slate-500 hover:bg-slate-600' },
    ],
  },
];

function SectionCard({ section }: { section: SectionConfig }) {
  const Icon = section.icon;
  
  return (
    <div className={cn(
      "rounded-2xl p-4 md:p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
      section.colorClass
    )}>
      {/* Section Header */}
      <Link href={section.href} className="block mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5" />
          <h2 className="text-sm md:text-base font-bold tracking-wide">{section.title}</h2>
        </div>
      </Link>
      
      {/* Subsections Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {section.subsections.map((sub) => {
          const SubIcon = sub.icon;
          return (
            <Link
              key={sub.id}
              href={sub.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-white text-center transition-all duration-200",
                sub.colorClass
              )}
            >
              <SubIcon className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-[10px] md:text-xs font-medium leading-tight">{sub.title}</span>
            </Link>
          );
        })}
      </div>

      {section.id === 'marketing' && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <Button variant="secondary" className="w-full" asChild>
            <Link href="https://emarket.dcat.ci" target="_blank" rel="noopener noreferrer">
              <Store className="mr-2 h-4 w-4" />
              Voir la Boutique
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AccueilPage() {
  const { canAccess } = usePermissions();
  
  const visibleSections = sections.filter(section => canAccess(section.module));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex justify-center mb-1">
          <Image
            src="/dcat-logo.png"
            alt="DCAT Logo"
            width={50}
            height={50}
            className="rounded-xl shadow-lg"
            priority
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Accédez rapidement à tous vos modules de gestion
        </p>
      </div>

      {/* Sections Grid - 2 rows x 3 columns on desktop, responsive on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
        {visibleSections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
