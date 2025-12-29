'use client';

import Link from 'next/link';
import { Truck, Clock, MapPin, Package, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DELIVERY_OPTIONS = [
  {
    title: 'Livraison Standard',
    description: 'Abidjan et environs',
    delay: '2-3 jours',
    icon: Truck,
  },
  {
    title: 'Livraison Express',
    description: 'Abidjan uniquement',
    delay: '24-48h',
    icon: Clock,
  },
  {
    title: 'Livraison Nationale',
    description: 'Toute la Côte d\'Ivoire',
    delay: '5-7 jours',
    icon: MapPin,
  },
];

const STEPS = [
  {
    title: 'Passez votre commande',
    description: 'Ajoutez vos produits au panier et soumettez votre demande de devis.',
  },
  {
    title: 'Confirmation et paiement',
    description: 'Notre équipe vous contacte pour confirmer votre commande et les modalités de paiement.',
  },
  {
    title: 'Préparation',
    description: 'Votre commande est préparée et emballée avec soin dans nos locaux.',
  },
  {
    title: 'Livraison',
    description: 'Votre commande est livrée à l\'adresse indiquée. Vous êtes informé par SMS/email.',
  },
];

export default function LivraisonPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/boutique" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Livraison</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Livraison</h1>
            <p className="text-slate-600">
              Nous livrons dans toute la Côte d'Ivoire
            </p>
          </div>

          {/* Delivery Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {DELIVERY_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="bg-slate-50 rounded-lg p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{option.title}</h3>
                  <p className="text-slate-600 text-sm mb-2">{option.description}</p>
                  <p className="text-2xl font-bold text-blue-600">{option.delay}</p>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {STEPS.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing note */}
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Tarifs de livraison
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Les tarifs peuvent varier selon le poids et le volume des produits.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <strong className="text-slate-900">Livraison gratuite à Abidjan pour les commandes supérieures à 500 000 FCFA.</strong>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Les frais exacts vous seront communiqués lors de la confirmation de votre devis.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
