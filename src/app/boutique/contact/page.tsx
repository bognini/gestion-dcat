'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin,
  Send,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom || !form.message || (!form.email && !form.telephone)) {
      toast({ 
        variant: 'destructive', 
        title: 'Informations requises', 
        description: 'Veuillez remplir au moins votre nom, un moyen de contact et votre message' 
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Message envoyé !</h1>
          <p className="text-slate-600 mb-8">
            Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/boutique">Retour à la boutique</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/boutique" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Contact</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Nous Contacter</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Une question ? Un projet ? N'hésitez pas à nous contacter.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
              <a href="mailto:info@dcat.ci" className="text-blue-600 hover:underline block">
                info@dcat.ci
              </a>
              <a href="mailto:sales@dcat.ci" className="text-blue-600 hover:underline block">
                sales@dcat.ci
              </a>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Téléphones</h3>
              <a href="tel:+2252721373363" className="text-blue-600 hover:underline block">
                +225 27 21 37 33 63
              </a>
              <a href="tel:+2250709029625" className="text-blue-600 hover:underline block">
                +225 07 09 02 96 25
              </a>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Adresse</h3>
              <p className="text-slate-600 text-sm mb-2">
                Angré Château, Immeuble BATIM,<br />
                1er étage, Porte A108<br />
                Abidjan, Côte d'Ivoire
              </p>
              <a 
                href="https://google.com/maps/place/DCAT+(Data+Communications+%26+All+Technologies)/data=!4m2!3m1!1s0x0:0x8ac01db5ac44fb4b"
                target="_blank"
                className="text-blue-600 hover:underline text-sm"
              >
                Voir sur Google Maps
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-slate-700">Nom complet *</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="bg-white border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-slate-700">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="bg-white border-slate-200"
                    placeholder="+225 XX XX XX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sujet" className="text-slate-700">Sujet</Label>
                  <Input
                    id="sujet"
                    value={form.sujet}
                    onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                    className="bg-white border-slate-200"
                    placeholder="Ex: Question sur un produit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-700">Message *</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="bg-white border-slate-200"
                  required
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
