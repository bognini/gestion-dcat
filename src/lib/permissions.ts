import { ROLES, type Role } from './utils';

export type Module = 
  | 'administration'
  | 'calendrier'
  | 'stock'
  | 'technique'
  | 'marketing'
  | 'parametres';

export type Action = 'read' | 'write' | 'delete' | 'manage';

// Permission matrix definition
const PERMISSIONS: Record<Role, Record<Module, Action[]>> = {
  [ROLES.ADMIN]: {
    administration: ['read', 'write', 'delete', 'manage'],
    calendrier: ['read', 'write', 'delete', 'manage'],
    stock: ['read', 'write', 'delete', 'manage'],
    technique: ['read', 'write', 'delete', 'manage'],
    marketing: ['read', 'write', 'delete', 'manage'],
    parametres: ['read', 'write', 'delete', 'manage'],
  },
  [ROLES.TECHNICIEN]: {
    administration: [],
    calendrier: ['read', 'write'],
    stock: ['read', 'write'],
    technique: ['read', 'write'],
    marketing: [],
    parametres: [],
  },
  [ROLES.MARKETING]: {
    administration: [],
    calendrier: ['read', 'write'],
    stock: ['read'],
    technique: ['read'],
    marketing: ['read', 'write', 'delete', 'manage'],
    parametres: [],
  },
  [ROLES.COMPTABLE]: {
    administration: ['read'], // Only finance section
    calendrier: ['read', 'write'],
    stock: [],
    technique: [],
    marketing: [],
    parametres: [],
  },
  [ROLES.ASSISTANTE]: {
    administration: [],
    calendrier: ['read', 'write'],
    stock: ['read', 'write'], // Mouvements de stock
    technique: [],
    marketing: [],
    parametres: [],
  },
};

export function hasPermission(role: string, module: Module, action: Action): boolean {
  const rolePermissions = PERMISSIONS[role as Role];
  if (!rolePermissions) return false;
  
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;
  
  return modulePermissions.includes(action);
}

export function canAccess(role: string, module: Module): boolean {
  return hasPermission(role, module, 'read');
}

export function canWrite(role: string, module: Module): boolean {
  return hasPermission(role, module, 'write');
}

export function canDelete(role: string, module: Module): boolean {
  return hasPermission(role, module, 'delete');
}

export function canManage(role: string, module: Module): boolean {
  return hasPermission(role, module, 'manage');
}

// Get all accessible modules for a role
export function getAccessibleModules(role: string): Module[] {
  const rolePermissions = PERMISSIONS[role as Role];
  if (!rolePermissions) return [];
  
  return (Object.keys(rolePermissions) as Module[]).filter(
    module => rolePermissions[module].length > 0
  );
}

// Section visibility configuration
export interface SectionConfig {
  id: string;
  title: string;
  module: Module;
  href: string;
  color: string;
  subsections: {
    id: string;
    title: string;
    href: string;
    color: string;
  }[];
}

export const SECTIONS: SectionConfig[] = [
  {
    id: 'administration',
    title: 'ADMINISTRATION',
    module: 'administration',
    href: '/administration',
    color: 'section-card-administration',
    subsections: [
      { id: 'gestion-admin', title: 'Gestion Administrative', href: '/administration/gestion-administrative', color: 'subsection-blue' },
      { id: 'finance', title: 'Finance et Comptabilité', href: '/administration/finance-comptabilite', color: 'subsection-indigo' },
      { id: 'rh', title: 'RH', href: '/administration/ressources-humaines', color: 'subsection-emerald' },
    ],
  },
  {
    id: 'calendrier',
    title: 'CALENDRIER',
    module: 'calendrier',
    href: '/calendrier',
    color: 'section-card-calendrier',
    subsections: [
      { id: 'planning', title: 'Planning des Réunions', href: '/calendrier?view=reunions', color: 'subsection-purple' },
      { id: 'equipes', title: 'Programmes des Équipes', href: '/calendrier?view=equipes', color: 'subsection-indigo' },
    ],
  },
  {
    id: 'stock',
    title: 'GESTION DE STOCK',
    module: 'stock',
    href: '/stock',
    color: 'section-card-stock',
    subsections: [
      { id: 'mouvements', title: 'Mouvements de Stock', href: '/stock/mouvements', color: 'subsection-emerald' },
      { id: 'rangement', title: 'Rangement', href: '/stock/rangement', color: 'subsection-teal' },
    ],
  },
  {
    id: 'technique',
    title: 'TECHNIQUE',
    module: 'technique',
    href: '/technique',
    color: 'section-card-technique',
    subsections: [
      { id: 'projets', title: 'Gestion des Projets', href: '/technique/projets', color: 'subsection-blue' },
      { id: 'interventions', title: 'Gestion des Interventions', href: '/technique/interventions', color: 'subsection-teal' },
    ],
  },
  {
    id: 'marketing',
    title: 'MARKETING ET COMMERCIAL',
    module: 'marketing',
    href: '/marketing',
    color: 'section-card-marketing',
    subsections: [
      { id: 'emarket', title: 'DCAT E-Market', href: '/marketing/emarket', color: 'subsection-purple' },
      { id: 'stats', title: 'Statistiques', href: '/marketing/statistiques', color: 'subsection-rose' },
    ],
  },
  {
    id: 'parametres',
    title: 'PARAMÈTRES',
    module: 'parametres',
    href: '/parametres',
    color: 'section-card-parametres',
    subsections: [
      { id: 'references', title: 'Création des Références', href: '/parametres/references', color: 'subsection-amber' },
      { id: 'utilisateurs', title: 'Création des Utilisateurs', href: '/parametres/utilisateurs', color: 'subsection-blue' },
      { id: 'options', title: 'Options', href: '/parametres/options', color: 'subsection-indigo' },
    ],
  },
];

export function getVisibleSections(role: string): SectionConfig[] {
  return SECTIONS.filter(section => canAccess(role, section.module));
}
