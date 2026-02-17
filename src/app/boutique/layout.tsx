'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, Menu, X, Search, Phone, Mail, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { BoutiqueAuthProvider, useBoutiqueAuth } from '@/components/providers/boutique-auth-provider';

// Cart Context
interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantite'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantite: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dcat-emarket-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('dcat-emarket-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantite'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantite: i.quantite + 1 } : i
        );
      }
      return [...prev, { ...item, quantite: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantite: number) => {
    if (quantite <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, quantite } : i
    ));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantite, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

function Header() {
  const { items, total, itemCount, removeItem, updateQuantity } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      if (currentParams.get('featured') === 'true') {
        params.set('featured', 'true');
      }
      window.location.href = `/boutique/produits?${params.toString()}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-blue-600 text-white text-sm py-2">
        <div className="container mx-auto px-4 text-center">
          🚚 Livraison gratuite à Abidjan pour les commandes de plus de 500 000 FCFA
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/boutique" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/dcat-logo.png"
              alt="DCAT E-Market"
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-contain"
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-slate-900">DCAT</span>
              <span className="text-xl font-bold text-blue-600"> E-Market</span>
            </div>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 rounded-full bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Account */}
            <AccountButton />

            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="relative bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle>Votre Panier ({itemCount})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col flex-1 overflow-hidden">
                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                      Votre panier est vide
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="w-16 h-16 bg-slate-200 rounded flex-shrink-0 overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.nom} className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Image</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.nom}</p>
                              <p className="text-blue-600 font-semibold">{formatPrice(item.prix)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantite - 1)}
                                >
                                  -
                                </Button>
                                <span className="text-sm w-6 text-center">{item.quantite}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantite + 1)}
                                >
                                  +
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 ml-auto text-destructive"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">{formatPrice(total)}</span>
                        </div>
                        <SheetClose asChild>
                          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                            <Link href="/boutique/commander">
                              Commander
                            </Link>
                          </Button>
                        </SheetClose>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile menu */}
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search - Mobile */}
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <ul className="hidden md:flex items-center gap-8 py-3">
            <li>
              <Link href="/boutique/produits" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Tous les produits
              </Link>
            </li>
            <li>
              <Link href="/boutique/produits?featured=true" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Promotions
              </Link>
            </li>
            <li>
              <Link href="/boutique/devis" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Demander un devis
              </Link>
            </li>
            <li>
              <Link href="/boutique/contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Contact
              </Link>
            </li>
            <li className="ml-auto">
              <Link href="/boutique/mon-compte" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Mon compte
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white">
          <ul className="py-2">
            <li>
              <Link href="/boutique/produits" className="block px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Tous les produits
              </Link>
            </li>
            <li>
              <Link href="/boutique/produits?featured=true" className="block px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Promotions
              </Link>
            </li>
            <li>
              <Link href="/boutique/devis" className="block px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Demander un devis
              </Link>
            </li>
            <li>
              <Link href="/boutique/contact" className="block px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
            </li>
            <li className="border-t">
              <Link href="/boutique/mon-compte" className="block px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Mon compte
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">DCAT E-Market</h3>
            <p className="text-sm leading-relaxed">
              Votre boutique en ligne de confiance en Côte d&apos;Ivoire. 
              Produits de qualité, prix compétitifs et livraison rapide.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/boutique/produits" className="hover:text-white transition-colors">
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link href="/boutique/produits?featured=true" className="hover:text-white transition-colors">
                  Promotions
                </Link>
              </li>
              <li>
                <Link href="/boutique/devis" className="hover:text-white transition-colors">
                  Demander un devis
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Service client</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/boutique/contact" className="hover:text-white transition-colors">
                  Nous contacter
                </Link>
              </li>
              <li>
                <Link href="/boutique/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/boutique/livraison" className="hover:text-white transition-colors">
                  Livraison
                </Link>
              </li>
              <li>
                <Link href="/boutique/retours" className="hover:text-white transition-colors">
                  Retours & Remboursements
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <a 
                  href="https://google.com/maps/place/DCAT+(Data+Communications+%26+All+Technologies)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Angré Château, Immeuble BATIM,<br />
                  1er étage, Porte A108
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+2252721373363" className="hover:text-white transition-colors">
                  +225 27 21 37 33 63
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <a href="mailto:info@dcat.ci" className="hover:text-white transition-colors">
                    info@dcat.ci
                  </a>
                  <span>|</span>
                  <a href="https://dcat.ci" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    dcat.ci
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Copyright bar - same style as top bar */}
      <div className="bg-blue-600 text-white text-sm py-2">
        <div className="container mx-auto px-4 text-center">
          &copy; {new Date().getFullYear()} DCAT E-Market. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

function AccountButton() {
  const { client, loading, logout } = useBoutiqueAuth();

  if (loading) return null;

  if (client) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/boutique/mon-compte">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-700 hover:text-blue-600">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{client.prenom || client.nom}</span>
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/boutique/connexion">
        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-700 hover:text-blue-600">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Connexion</span>
        </Button>
      </Link>
      <Link href="/boutique/inscription" className="hidden sm:block">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          S&apos;inscrire
        </Button>
      </Link>
    </div>
  );
}

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoutiqueAuthProvider>
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-50" suppressHydrationWarning>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
    </BoutiqueAuthProvider>
  );
}
