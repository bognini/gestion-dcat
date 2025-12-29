'use client';

import Link from 'next/link';
import { 
  FileSignature, 
  FolderOpen,
  FileText,
  Building2,
  Calendar,
  CheckCircle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GestionAdministrativePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion Administrative</h2>
          <p className="text-muted-foreground">
            Documents, contrats et suivi administratif
          </p>
        </div>
      </div>

      {/* Main sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/gestion-administrative/contrats-clients">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <FileSignature className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Contrats Clients</CardTitle>
                  <CardDescription className="text-blue-100">
                    Maintenance et partenariat
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Contrats par client
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Suivi des échéances
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Renouvellements
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/gestion-administrative/contrats-clients">
                  Gérer les contrats
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/gestion-administrative/contrats-prestataires">
            <CardHeader className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="h-10 w-10" />
                <div>
                  <CardTitle className="text-xl">Contrats Prestataires</CardTitle>
                  <CardDescription className="text-purple-100">
                    Prestations de service
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Contrats de prestation
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Suivi des délais
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Validation des travaux
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/administration/gestion-administrative/contrats-prestataires">
                  Gérer les contrats
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-10 w-10" />
              <div>
                <CardTitle className="text-xl">Dossiers & Documents</CardTitle>
                <CardDescription className="text-indigo-100">
                  Archivage numérique
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documents administratifs
              </li>
              <li className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                Organisation par dossiers
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">Bientôt disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
