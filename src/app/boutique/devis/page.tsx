'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Loader2,
  CheckCircle,
  Send,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface DevisLigne {
  description: string;
  quantite: number;
}

export default function DevisPage() {
  return (
    <Suspense fallback={<DevisPageLoading />}>
      <DevisPageContent />
    </Suspense>
  );
}

function DevisPageLoading() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

function DevisPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Pre-fill product if coming from product page
  const productName = searchParams.get('produit') || '';
  const productQty = parseInt(searchParams.get('quantite') || '1');
  
  const [form, setForm] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    message: '',
  });

  const [lignes, setLignes] = useState<DevisLigne[]>(
    productName ? [{ description: productName, quantite: productQty }] : []
  );

  const addLigne = () => {
    setLignes([...lignes, { description: '', quantite: 1 }]);
  };

  const updateLigne = (index: number, field: keyof DevisLigne, value: string | number) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignes(newLignes);
  };

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom || (!form.email && !form.telephone)) {
      toast({ 
        variant: 'destructive', 
        title: 'Informations requises', 
        description: 'Veuillez remplir votre nom et au moins un moyen de contact' 
      });
      return;
    }

    if (lignes.length === 0 || lignes.some(l => !l.description)) {
      toast({ 
        variant: 'destructive', 
        title: 'Produits requis', 
        description: 'Veuillez ajouter au moins un produit à votre demande de devis' 
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/boutique/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lignes,
        }),
      });

      if (!res.ok) throw new Error('Erreur');

      setSuccess(true);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Demande envoyée !</h1>
          <p className="text-slate-600 mb-8">
            Merci pour votre demande de devis. Notre équipe commerciale vous contactera dans les plus brefs délais avec une proposition personnalisée.
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
          <span className="text-slate-900">Demande de devis</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Demande de devis</h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Vous avez besoin de plusieurs produits ou d'une commande spéciale ? 
              Remplissez ce formulaire et nous vous enverrons un devis personnalisé.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact info */}
              <div className="bg-slate-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Vos coordonnées</h2>
                <p className="text-sm text-slate-600 mb-6">Pour vous recontacter avec le devis</p>
                <div className="space-y-4">
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
                    <Label htmlFor="entreprise" className="text-slate-700">Entreprise</Label>
                    <Input
                      id="entreprise"
                      value={form.entreprise}
                      onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                      className="bg-white border-slate-200"
                      placeholder="Optionnel"
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

                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-slate-700">Téléphone *</Label>
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
                    <Label htmlFor="adresse" className="text-slate-700">Adresse de livraison</Label>
                    <Textarea
                      id="adresse"
                      value={form.adresse}
                      onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                      rows={2}
                      className="bg-white border-slate-200"
                      placeholder="Ville, quartier..."
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="bg-slate-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Produits souhaités</h2>
                <p className="text-sm text-slate-600 mb-6">Décrivez les produits dont vous avez besoin</p>
                <div className="space-y-4">
                  {lignes.map((ligne, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          value={ligne.description}
                          onChange={(e) => updateLigne(index, 'description', e.target.value)}
                          className="bg-white border-slate-200"
                          placeholder="Description du produit"
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 1)}
                          className="bg-white border-slate-200"
                          placeholder="Qté"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLigne(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLigne}
                    className="w-full border-slate-300 hover:bg-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un produit
                  </Button>

                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <Label htmlFor="message" className="text-slate-700">Informations complémentaires</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="bg-white border-slate-200"
                      placeholder="Spécifications techniques, délais souhaités, questions..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button 
                type="submit" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-12"
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
                    Envoyer ma demande de devis
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
