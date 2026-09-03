'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ShoppingCart, Menu, X, Search, Phone, Mail, MapPin, User, LogOut, Trash2, Minus, Plus, ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { BoutiqueAuthProvider, useBoutiqueAuth } from '@/components/providers/boutique-auth-provider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-boutique',
  display: 'swap',
});

// ---------------------------------------------------------------------------
// Panier (contexte partagé par toutes les pages de la boutique)
// ---------------------------------------------------------------------------
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dcat-emarket-cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('dcat-emarket-cart', JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, 'quantite'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { ...item, quantite: 1 }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantite: number) => {
    if (quantite <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantite } : i)));
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

const NAV_LINKS = [
  { href: '/boutique/produits', label: 'Tous les produits' },
  { href: '/boutique/produits?featured=true', label: 'Promotions' },
  { href: '/boutique/devis', label: 'Demander un devis' },
  { href: '/boutique/livraison', label: 'Livraison' },
  { href: '/boutique/contact', label: 'Contact' },
];

// ---------------------------------------------------------------------------
// En-tête
// ---------------------------------------------------------------------------
function CartSheet() {
  const { items, total, itemCount, removeItem, updateQuantity } = useCart();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="relative h-10 px-3 sm:px-4 rounded-xl bg-boutique-navy text-white hover:bg-boutique-navy2 transition-colors flex items-center gap-2 font-semibold text-sm"
          aria-label="Ouvrir le panier"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="hidden sm:inline">Panier</span>
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-boutique-amber text-boutique-navy text-[11px] font-extrabold flex items-center justify-center tabular-nums">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md font-boutique">
        <SheetHeader>
          <SheetTitle className="text-boutique-navy">Votre panier ({itemCount})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-boutique-muted gap-3">
              <ShoppingCart className="h-10 w-10 opacity-40" />
              <p>Votre panier est vide</p>
              <SheetClose asChild>
                <Link href="/boutique/produits" className="text-sm font-semibold text-boutique-navy hover:underline">
                  Parcourir le catalogue
                </Link>
              </SheetClose>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-boutique-line bg-white">
                    <div className="w-16 h-16 bg-boutique-ground rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.nom} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-boutique-muted">Image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-boutique-ink line-clamp-2 leading-snug">{item.nom}</p>
                      <p className="text-boutique-navy font-bold text-sm tabular-nums mt-0.5">{formatPrice(item.prix)}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantite - 1)} className="h-7 w-7 rounded-md border border-boutique-line hover:bg-boutique-ground flex items-center justify-center" aria-label="Diminuer">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm w-7 text-center tabular-nums font-medium">{item.quantite}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantite + 1)} className="h-7 w-7 rounded-md border border-boutique-line hover:bg-boutique-ground flex items-center justify-center" aria-label="Augmenter">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="h-7 w-7 ml-auto rounded-md text-boutique-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center" aria-label="Retirer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-boutique-line pt-4 mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-boutique-muted">Total</span>
                  <span className="text-xl font-extrabold text-boutique-navy tabular-nums">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-boutique-muted flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Livraison offerte à Abidjan dès 500 000 FCFA
                </p>
                <SheetClose asChild>
                  <Link href="/boutique/commander" className="w-full inline-flex items-center justify-center gap-2 bg-boutique-amber text-boutique-navy font-bold h-11 rounded-xl hover:bg-boutique-navy hover:text-white transition-colors">
                    Commander <ArrowRight className="h-4 w-4" />
                  </Link>
                </SheetClose>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccountButton() {
  const { client, loading, logout } = useBoutiqueAuth();
  if (loading) return <div className="h-10 w-24 rounded-xl bg-boutique-ground animate-pulse hidden sm:block" />;

  if (client) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/boutique/mon-compte" className="h-10 px-3 rounded-xl hover:bg-boutique-ground flex items-center gap-2 text-sm font-semibold text-boutique-ink">
          <User className="h-4 w-4 text-boutique-navy" />
          <span className="hidden sm:inline max-w-28 truncate">{client.prenom || client.nom}</span>
        </Link>
        <button onClick={() => logout()} className="h-10 w-10 rounded-xl hover:bg-red-50 text-boutique-muted hover:text-red-600 flex items-center justify-center" aria-label="Se déconnecter">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/boutique/connexion" className="h-10 px-3 rounded-xl hover:bg-boutique-ground flex items-center gap-2 text-sm font-semibold text-boutique-ink">
        <User className="h-4 w-4 text-boutique-navy" />
        <span className="hidden sm:inline">Connexion</span>
      </Link>
      <Link href="/boutique/inscription" className="hidden md:inline-flex h-10 px-4 rounded-xl border border-boutique-navy text-boutique-navy text-sm font-semibold items-center hover:bg-boutique-navy hover:text-white transition-colors">
        S&apos;inscrire
      </Link>
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      window.location.href = `/boutique/produits?${params.toString()}`;
    }
  };

  const searchBox = (compact: boolean) => (
    <form onSubmit={handleSearch} className={compact ? 'w-full' : 'hidden md:flex flex-1 max-w-xl'}>
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-boutique-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Rechercher un produit, une marque…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-24 rounded-full bg-boutique-ground border border-transparent focus:border-boutique-navy/40 focus:bg-white focus:outline-none text-sm text-boutique-ink placeholder:text-boutique-muted transition-colors"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-boutique-navy text-white text-xs font-bold hover:bg-boutique-amber hover:text-boutique-navy transition-colors">
          Chercher
        </button>
      </div>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-boutique-line">
      {/* Bandeau */}
      <div className="bg-boutique-navy text-white text-xs">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 truncate">
            <Truck className="h-3.5 w-3.5 text-boutique-amber shrink-0" />
            <span className="truncate">Livraison gratuite à Abidjan pour les commandes de plus de 500 000 FCFA</span>
          </p>
          <a href="tel:+2252721373363" className="hidden sm:flex items-center gap-1.5 hover:text-boutique-amber transition-colors shrink-0">
            <Phone className="h-3.5 w-3.5" /> +225 27 21 37 33 63
          </a>
        </div>
      </div>

      {/* Barre principale */}
      <div className="container mx-auto px-4">
        <div className="h-[72px] flex items-center justify-between gap-4">
          <Link href="/boutique" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/dcat-logo.png" alt="DCAT" width={40} height={40} className="h-10 w-10 rounded-lg object-contain" />
            <div className="leading-none">
              <span className="block text-lg font-extrabold text-boutique-navy tracking-tight">
                DCAT <span className="text-boutique-amberDark">E-Market</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-boutique-muted mt-1">Audiovisuel · IT · Domotique · Solaire</span>
            </div>
          </Link>

          {searchBox(false)}

          <div className="flex items-center gap-1.5">
            <AccountButton />
            <CartSheet />
            <button
              className="md:hidden h-10 w-10 rounded-xl border border-boutique-line flex items-center justify-center text-boutique-ink"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">{searchBox(true)}</div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-boutique-line">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1 h-11">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href.split('?')[0] && (l.href.includes('featured') ? false : true);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`inline-flex items-center h-11 px-3 text-sm font-semibold border-b-2 transition-colors ${
                      active ? 'border-boutique-amber text-boutique-navy' : 'border-transparent text-boutique-ink/80 hover:text-boutique-navy'
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="ml-auto">
              <Link href="/boutique/mon-compte" className="inline-flex items-center h-11 px-3 text-sm font-semibold text-boutique-ink/80 hover:text-boutique-navy">
                Mon compte
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-boutique-line bg-white">
          <ul className="py-2">
            {[...NAV_LINKS, { href: '/boutique/mon-compte', label: 'Mon compte' }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block px-4 py-3 text-sm font-semibold text-boutique-ink hover:bg-boutique-ground" onClick={() => setMobileMenuOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Pied de page
// ---------------------------------------------------------------------------
function Footer() {
  return (
    <footer className="bg-boutique-navy text-white/80 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/dcat-logo.png" alt="DCAT" width={36} height={36} className="h-9 w-9 rounded-lg object-contain bg-white/10 p-0.5" />
              <span className="text-lg font-extrabold text-white tracking-tight">
                DCAT <span className="text-boutique-amber">E-Market</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              La boutique en ligne de Data Communications &amp; All Technologies. Matériel audiovisuel, informatique, domotique et solaire, livré et installé en Côte d&apos;Ivoire.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-[0.12em]">Boutique</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/boutique/produits" className="hover:text-boutique-amber transition-colors">Tous les produits</Link></li>
              <li><Link href="/boutique/produits?featured=true" className="hover:text-boutique-amber transition-colors">Promotions</Link></li>
              <li><Link href="/boutique/devis" className="hover:text-boutique-amber transition-colors">Demander un devis</Link></li>
              <li><Link href="/boutique/mon-compte" className="hover:text-boutique-amber transition-colors">Mon compte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-[0.12em]">Service client</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/boutique/contact" className="hover:text-boutique-amber transition-colors">Nous contacter</Link></li>
              <li><Link href="/boutique/faq" className="hover:text-boutique-amber transition-colors">FAQ</Link></li>
              <li><Link href="/boutique/livraison" className="hover:text-boutique-amber transition-colors">Livraison</Link></li>
              <li><Link href="/boutique/retours" className="hover:text-boutique-amber transition-colors">Retours &amp; remboursements</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-[0.12em]">Nous trouver</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-boutique-amber" />
                <a href="https://google.com/maps/place/DCAT+(Data+Communications+%26+All+Technologies)" target="_blank" rel="noopener noreferrer" className="hover:text-boutique-amber transition-colors">
                  Angré Château, Immeuble BATIM,<br />1er étage, Porte A108 — Abidjan
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-boutique-amber" />
                <a href="tel:+2252721373363" className="hover:text-boutique-amber transition-colors">+225 27 21 37 33 63</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-boutique-amber" />
                <span>
                  <a href="mailto:info@dcat.ci" className="hover:text-boutique-amber transition-colors">info@dcat.ci</a>
                  <span className="mx-2 text-white/30">|</span>
                  <a href="https://dcat.ci" target="_blank" rel="noopener noreferrer" className="hover:text-boutique-amber transition-colors">dcat.ci</a>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <p>&copy; {new Date().getFullYear()} DCAT — Data Communications &amp; All Technologies. Tous droits réservés.</p>
          <p>Paiement à la livraison · Mobile Money · Virement</p>
        </div>
      </div>
    </footer>
  );
}

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoutiqueAuthProvider>
      <CartProvider>
        <div className={`${jakarta.variable} font-boutique min-h-screen flex flex-col bg-boutique-ground text-boutique-ink`} suppressHydrationWarning>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </BoutiqueAuthProvider>
  );
}
