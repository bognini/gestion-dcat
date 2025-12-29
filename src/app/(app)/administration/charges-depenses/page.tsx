'use client';

import Link from 'next/link';
import { ArrowLeft, Receipt, Repeat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ChargesDepensesHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suivi Charges et Dépenses</h2>
          <p className="text-muted-foreground">Choisissez une rubrique</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/administration">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/charges?tab=charges">
            <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Receipt className="h-8 w-8" />
                <div>
                  <CardTitle>Charges & Dépenses</CardTitle>
                  <CardDescription className="text-orange-100">
                    Charges fixes et dépenses ponctuelles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Enregistrer les charges récurrentes</li>
              <li>• Suivre les dépenses du mois</li>
              <li>• Total mensuel estimé</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/administration/abonnements">
            <CardHeader className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Repeat className="h-8 w-8" />
                <div>
                  <CardTitle>Abonnements</CardTitle>
                  <CardDescription className="text-pink-100">
                    Logiciels, services…
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Suivre les échéances</li>
              <li>• Alertes avant paiement</li>
              <li>• Justificatifs par échéance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
