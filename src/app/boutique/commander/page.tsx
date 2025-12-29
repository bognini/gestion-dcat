'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Trash2,
  Loader2,
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../layout';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

const MODES_PAIEMENT = [
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, description: 'Orange Money, MTN MoMo' },
  { value: 'virement', label: 'Virement bancaire', icon: CreditCard, description: 'Paiement par virement' },
  { value: 'livraison', label: 'Paiement à la livraison', icon: Banknote, description: 'Payez à la réception' },
];

export default function CommanderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    quartier: '',
    adresse: '',
    modePaiement: 'mobile_money',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'Panier vide', description: 'Ajoutez des produits avant de commander' });
      return;
    }

    if (!form.nom || !form.telephone || !form.ville) {
      toast({ variant: 'destructive', title: 'Informations requises', description: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/boutique/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            nom: form.nom,
            prenom: form.prenom || null,
            email: form.email || null,
            telephone: form.telephone,
            ville: form.ville,
          },
          adresseLivraison: [form.quartier, form.adresse].filter(Boolean).join(', ') || form.ville,
          modePaiement: form.modePaiement,
          notes: form.notes || null,
          lignes: items.map(item => ({
            produitId: item.id,
            designation: item.nom,
            quantite: item.quantite,
            prixUnitaire: item.prix,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la commande');
      }

      const commande = await res.json();
      setOrderRef(commande.reference);
      setSuccess(true);
      clearCart();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Commande confirmée !</h1>
        <p className="text-slate-500 mb-2">
          Merci pour votre commande. Votre numéro de référence est :
        </p>
        <p className="text-2xl font-mono font-bold text-blue-600 mb-6">{orderRef}</p>
        <p className="text-sm text-slate-500 mb-8">
          Nous vous contacterons bientôt pour confirmer les détails de livraison.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/boutique">Continuer mes achats</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
        <p className="text-slate-500 mb-8">
          Ajoutez des produits à votre panier pour passer commande.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/boutique/produits">Voir les produits</Link>
        </Button>
      </div>
    );
  }

  const fraisLivraison = total >= 50000 ? 0 : 2000;
  const totalFinal = total + fraisLivraison;

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/boutique" className="hover:text-blue-600">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Commander</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">Finaliser ma commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client info */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Vos informations</h2>
              <p className="text-sm text-slate-500 mb-5">Nous utilisons ces informations pour vous contacter</p>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-slate-700">Nom *</Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      className="bg-white border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-slate-700">Prénom</Label>
                    <Input
                      id="prenom"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      className="bg-white border-slate-200"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-slate-700">Téléphone *</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="+225 07 XX XX XX XX"
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
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Adresse de livraison
              </h2>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="ville" className="text-slate-700">Ville *</Label>
                    <Input
                      id="ville"
                      value={form.ville}
                      onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      placeholder="Ex: Abidjan, Bouaké..."
                      className="bg-white border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quartier" className="text-slate-700">Quartier</Label>
                    <Input
                      id="quartier"
                      value={form.quartier}
                      onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                      placeholder="Ex: Cocody, Plateau..."
                      className="bg-white border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse" className="text-slate-700">Adresse complète</Label>
                  <Textarea
                    id="adresse"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Détails supplémentaires pour la livraison..."
                    className="bg-white border-slate-200"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-5">Mode de paiement</h2>
              <RadioGroup
                value={form.modePaiement}
                onValueChange={(v) => setForm({ ...form, modePaiement: v })}
                className="space-y-3"
              >
                {MODES_PAIEMENT.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <label
                      key={mode.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border bg-white cursor-pointer transition-colors ${
                        form.modePaiement === mode.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <RadioGroupItem value={mode.value} />
                      <Icon className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-900">{mode.label}</p>
                        <p className="text-sm text-slate-500">{mode.description}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-5">Notes (optionnel)</h2>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Instructions spéciales pour la livraison ou remarques..."
                className="bg-white border-slate-200"
                rows={3}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-slate-50 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Récapitulatif</h2>
              <p className="text-sm text-slate-500 mb-5">{items.length} article(s)</p>
              <div className="space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded flex-shrink-0">
                        {item.image && (
                          <img src={item.image} alt="" className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nom}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantite} x {formatPrice(item.prix)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span className={fraisLivraison === 0 ? 'text-green-600' : ''}>
                      {fraisLivraison === 0 ? 'Gratuit' : formatPrice(fraisLivraison)}
                    </span>
                  </div>
                  {fraisLivraison > 0 && (
                    <p className="text-xs text-slate-500">
                      Livraison gratuite à partir de 50 000 FCFA
                    </p>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(totalFinal)}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer la commande'
                  )}
                </Button>

                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/boutique/produits">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continuer mes achats
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
