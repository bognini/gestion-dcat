'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Loader2, LogOut, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBoutiqueAuth } from '@/components/providers/boutique-auth-provider';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500' },
  confirmee: { label: 'Confirmée', color: 'bg-blue-500' },
  en_preparation: { label: 'En préparation', color: 'bg-purple-500' },
  expediee: { label: 'Expédiée', color: 'bg-indigo-500' },
  livree: { label: 'Livrée', color: 'bg-green-500' },
  annulee: { label: 'Annulée', color: 'bg-red-500' },
};

interface OrderLine {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

interface Order {
  id: string;
  reference: string;
  date: string;
  statut: string;
  totalTTC: number;
  lignes: OrderLine[];
}

export default function MonComptePage() {
  const router = useRouter();
  const { client, loading: authLoading, logout } = useBoutiqueAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !client) {
      router.push('/boutique/connexion');
    }
  }, [authLoading, client, router]);

  useEffect(() => {
    if (client) {
      fetch('/api/boutique/auth/mes-commandes')
        .then(res => res.ok ? res.json() : [])
        .then(data => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [client]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mon compte</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Mes informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Nom</span>
              <p className="font-medium">{[client.nom, client.prenom].filter(Boolean).join(' ')}</p>
            </div>
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Téléphone</span>
              <p className="font-medium">{client.telephone}</p>
            </div>
            {client.adresse && (
              <div>
                <span className="text-slate-500">Adresse</span>
                <p className="font-medium">{client.adresse}</p>
              </div>
            )}
            {client.ville && (
              <div>
                <span className="text-slate-500">Ville</span>
                <p className="font-medium">{client.ville}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => { await logout(); router.push('/boutique'); }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </CardContent>
        </Card>

        {/* Orders */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Mes commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Aucune commande pour le moment</p>
                  <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm">
                    <Link href="/boutique/produits">Voir les produits</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const statut = STATUT_LABELS[order.statut] || STATUT_LABELS.en_attente;
                    return (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-mono font-bold text-blue-600">#{order.reference}</span>
                            <span className="text-sm text-slate-500 ml-3">
                              {new Date(order.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <Badge className={`${statut.color} text-white`}>{statut.label}</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">
                          {order.lignes.map(l => `${l.designation} x${l.quantite}`).join(', ')}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{formatPrice(order.totalTTC)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/boutique/commandes/${order.id}/recu`, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Reçu
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
