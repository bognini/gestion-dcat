'use client';

import Link from 'next/link';
import { 
  Tags, 
  Users, 
  Cog,
  Package,
  Building2,
  Truck,
  Database,
  UserPlus,
  Shield,
  Key,
  UserCheck,
  Mail,
  Bell,
  Lock,
  Palette,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const parametresSections = [
  {
    id: 'references',
    title: 'Création des Références',
    description: 'Gérez les catégories, marques, modèles et emplacements',
    href: '/parametres/references',
    icon: Tags,
    colorClass: 'bg-amber-500',
    items: [
      { title: 'Catégories', href: '/parametres/references/categories', icon: Package },
      { title: 'Familles', href: '/parametres/references/familles', icon: Tags },
      { title: 'Marques', href: '/parametres/references/marques', icon: Building2 },
      { title: 'Modèles', href: '/parametres/references/modeles', icon: Tags },
      { title: 'Fournisseurs', href: '/parametres/references/fournisseurs', icon: Truck },
      { title: 'Partenaires', href: '/parametres/references/partenaires', icon: Building2 },
    ],
  },
  {
    id: 'utilisateurs',
    title: 'Création des Utilisateurs',
    description: 'Gérez les utilisateurs et invitations',
    href: '/parametres/utilisateurs',
    icon: Users,
    colorClass: 'bg-blue-500',
    items: [
      { title: 'Liste des utilisateurs', href: '/parametres/utilisateurs', icon: Users },
      { title: 'Créer un compte', href: '/parametres/utilisateurs', icon: UserPlus },
      { title: 'Rôles & permissions', href: '/parametres/utilisateurs', icon: Shield },
      { title: 'Réinitialisation mots de passe', href: '/parametres/utilisateurs', icon: Key },
      { title: 'Activation / Désactivation', href: '/parametres/utilisateurs', icon: UserCheck },
    ],
  },
  {
    id: 'options',
    title: 'Options',
    description: "Configuration générale de l'application",
    href: '/parametres/options',
    icon: Cog,
    colorClass: 'bg-slate-500',
    items: [
      { title: 'Boutique (WhatsApp)', href: '/parametres/options', icon: MessageCircle },
      { title: 'Configuration SMTP', href: '/parametres/options', icon: Mail },
      { title: 'Notifications par e-mail', href: '/parametres/options', icon: Bell },
      { title: 'Sécurité & accès', href: '/parametres/options', icon: Lock },
    ],
  },
];

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">
          Configuration de l&apos;application et gestion des références
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {parametresSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="overflow-hidden flex flex-col h-full">
              <Link href={section.href}>
                <CardHeader className={`text-white ${section.colorClass} min-h-[96px] flex items-center`}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-white/80 text-sm leading-snug line-clamp-2 min-h-[40px]">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
              <CardContent className="pt-4 flex-1">
                <div className="space-y-2">
                  {section.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={`${item.title}-${index}`}
                        href={item.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5"
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informations système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
              <p className="font-medium">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Environnement</p>
              <p className="font-medium">Production</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
