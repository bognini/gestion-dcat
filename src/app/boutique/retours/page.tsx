'use client';

import Link from 'next/link';
import { RotateCcw, Clock, Shield, RefreshCw, Check, X, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS = [
  {
    title: '7 jours',
    description: 'Pour retourner un produit après réception',
    icon: Clock,
  },
  {
    title: 'Garantie constructeur',
    description: 'Tous nos produits sont garantis',
    icon: Shield,
  },
  {
    title: 'Échange ou remboursement',
    description: 'Selon votre préférence',
    icon: RefreshCw,
  },
];

const ELIGIBLE = [
  'Produit non utilisé et dans son emballage d\'origine',
  'Tous les accessoires et documentations inclus',
  'Retour demandé dans les 7 jours suivant la réception',
  'Preuve d\'achat (facture ou bon de commande)',
];

const NOT_ELIGIBLE = [
  'Produits personnalisés ou sur mesure',
  'Logiciels et licences activés',
  'Produits endommagés par le client',
  'Produits sans emballage d\'origine',
  'Consommables (câbles ouverts, piles, etc.)',
];

const RETURN_STEPS = [
  {
    title: 'Contactez notre service client',
    description: 'Envoyez un email à sales@dcat.ci avec votre numéro de commande et le motif du retour.',
  },
  {
    title: 'Recevez l\'autorisation de retour',
    description: 'Nous vous enverrons un numéro d\'autorisation de retour et les instructions.',
  },
  {
    title: 'Expédiez le produit',
    description: 'Emballez soigneusement le produit et envoyez-le à l\'adresse indiquée.',
  },
  {
    title: 'Traitement du retour',
    description: 'Après vérification, nous procédons à l\'échange ou au remboursement sous 5-7 jours ouvrés.',
  },
];

export default function RetoursPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/boutique" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Retours et Remboursements</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Retours et Remboursements</h1>
            <p className="text-slate-600">
              Votre satisfaction est notre priorité
            </p>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {HIGHLIGHTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-slate-50 rounded-lg p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>

          {/* Conditions */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Conditions de retour</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-green-700 font-semibold flex items-center gap-2 mb-4">
                <Check className="h-5 w-5" />
                Produits éligibles au retour
              </h3>
              <ul className="space-y-2">
                {ELIGIBLE.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-red-700 font-semibold flex items-center gap-2 mb-4">
                <X className="h-5 w-5" />
                Produits non éligibles
              </h3>
              <ul className="space-y-2">
                {NOT_ELIGIBLE.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How to return */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Comment effectuer un retour ?</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {RETURN_STEPS.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Refund info */}
          <div className="bg-slate-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-slate-900 mb-4">Remboursements</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Les remboursements sont effectués via le même mode de paiement utilisé lors de l'achat.</p>
              <p>Les frais de livraison initiaux ne sont pas remboursés, sauf en cas d'erreur de notre part.</p>
              <p>Les frais de retour sont à la charge du client, sauf si le produit est défectueux ou non conforme.</p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center p-8 bg-slate-50 rounded-lg">
            <p className="text-slate-600 mb-4">
              Besoin d'aide ? Contactez notre service client
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" className="border-slate-300">
                <a href="mailto:sales@dcat.ci">
                  <Mail className="h-4 w-4 mr-2" />
                  sales@dcat.ci
                </a>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/boutique/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
