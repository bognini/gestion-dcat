'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Building2, 
  Tags, 
  Truck, 
  Users,
  ChevronRight,
  Loader2,
  FolderTree
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const referencesList = [
  {
    id: 'categories',
    title: 'Catégories',
    description: 'Classement des produits par type',
    href: '/parametres/references/categories',
    apiPath: '/api/categories',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    id: 'familles',
    title: 'Familles',
    description: 'Sous-catégories de produits',
    href: '/parametres/references/familles',
    apiPath: '/api/familles',
    icon: FolderTree,
    color: 'bg-indigo-500',
  },
  {
    id: 'marques',
    title: 'Marques',
    description: 'Fabricants et marques de produits',
    href: '/parametres/references/marques',
    apiPath: '/api/marques',
    icon: Building2,
    color: 'bg-emerald-500',
  },
  {
    id: 'modeles',
    title: 'Modèles',
    description: 'Modèles par marque',
    href: '/parametres/references/modeles',
    apiPath: '/api/modeles',
    icon: Tags,
    color: 'bg-purple-500',
  },
  {
    id: 'fournisseurs',
    title: 'Fournisseurs',
    description: 'Sources d\'approvisionnement',
    href: '/parametres/references/fournisseurs',
    apiPath: '/api/fournisseurs',
    icon: Truck,
    color: 'bg-cyan-500',
  },
  {
    id: 'partenaires',
    title: 'Partenaires & Clients',
    description: 'Contacts commerciaux',
    href: '/parametres/references/partenaires',
    apiPath: '/api/partenaires',
    icon: Users,
    color: 'bg-pink-500',
  },
];

export default function ReferencesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        referencesList.map(async (ref) => {
          try {
            const res = await fetch(ref.apiPath);
            if (res.ok) {
              const data = await res.json();
              results[ref.id] = Array.isArray(data) ? data.length : 0;
            }
          } catch {
            results[ref.id] = 0;
          }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Création des Références</h2>
          <p className="text-muted-foreground">
            Gérez les données de référence utilisées dans l&apos;application
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {referencesList.map((ref) => {
          const Icon = ref.icon;
          const count = counts[ref.id] ?? 0;
          return (
            <Link key={ref.id} href={ref.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${ref.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-3">{ref.title}</CardTitle>
                  <CardDescription>{ref.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Badge variant="secondary">
                        {count} élément{count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
