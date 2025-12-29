'use client';

import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    question: 'Comment passer une commande ?',
    answer: 'Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis remplissez le formulaire de demande de devis. Notre équipe commerciale vous contactera rapidement avec une offre personnalisée.',
  },
  {
    question: 'Quels sont les modes de paiement acceptés ?',
    answer: 'Nous acceptons les paiements par virement bancaire, Mobile Money (Orange Money, MTN Money, Wave), et espèces à la livraison pour certaines commandes. Les détails de paiement vous seront communiqués lors de la confirmation de votre devis.',
  },
  {
    question: 'Proposez-vous des garanties sur vos produits ?',
    answer: 'Oui, tous nos produits bénéficient d\'une garantie constructeur. La durée varie selon le type de produit (généralement de 1 à 3 ans). Les conditions de garantie sont précisées sur chaque fiche produit.',
  },
  {
    question: 'Livrez-vous dans toute la Côte d\'Ivoire ?',
    answer: 'Oui, nous livrons dans toute la Côte d\'Ivoire. Les délais et frais de livraison varient selon votre localisation. La livraison est gratuite à Abidjan pour les commandes supérieures à 500 000 FCFA.',
  },
  {
    question: 'Puis-je retourner un produit ?',
    answer: 'Oui, vous disposez de 7 jours après réception pour retourner un produit non utilisé dans son emballage d\'origine. Consultez notre politique de retours pour plus de détails.',
  },
  {
    question: 'Proposez-vous des services d\'installation ?',
    answer: 'Oui, notre équipe technique peut assurer l\'installation et la mise en service de vos équipements audiovisuels, informatiques, domotiques et solaires. Ce service est disponible sur devis.',
  },
  {
    question: 'Comment suivre ma commande ?',
    answer: 'Après validation de votre commande, vous recevrez un email de confirmation avec un numéro de suivi. Vous pouvez également nous contacter directement pour connaître l\'état de votre commande.',
  },
  {
    question: 'Proposez-vous des produits sur mesure ?',
    answer: 'Oui, nous sommes spécialisés dans les solutions sur mesure. Contactez-nous avec votre projet et notre équipe technique vous proposera une solution adaptée à vos besoins.',
  },
];

export default function FAQPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/boutique" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">FAQ</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Foire Aux Questions</h1>
            <p className="text-slate-600">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-slate-50 border-none rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-8 bg-slate-50 rounded-lg">
            <p className="text-slate-600 mb-4">
              Vous n'avez pas trouvé la réponse à votre question ?
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/boutique/contact">Contactez-nous</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
