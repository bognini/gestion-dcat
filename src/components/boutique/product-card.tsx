'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, ImageOff } from 'lucide-react';
import { useCart } from '@/app/boutique/layout';

export interface ProduitCard {
  id: string;
  nom: string;
  description?: string | null;
  prixVente: number | null;
  prixVenteMin: number | null;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  quantite: number;
  categorie: { id: string; nom: string } | null;
  marque: { id: string; nom: string } | null;
  imageUrl: string | null;
  images?: string[];
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

export function isPromoActive(p: ProduitCard): boolean {
  const basePrice = p.prixVenteMin || p.prixVente || 0;
  if (p.promoPrice === null || p.promoPrice <= 0 || basePrice <= 0 || p.promoPrice >= basePrice) return false;
  const now = new Date();
  if (p.promoStart && new Date(p.promoStart) > now) return false;
  if (p.promoEnd && new Date(p.promoEnd) < now) return false;
  return true;
}

export function ProductCard({ product }: { product: ProduitCard }) {
  const { addItem } = useCart();
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const hasPromo = isPromoActive(product);
  const basePrice = product.prixVenteMin || product.prixVente || 0;
  const displayPrice = hasPromo ? product.promoPrice! : basePrice;
  const discount = hasPromo && basePrice ? Math.round((1 - product.promoPrice! / basePrice) * 100) : 0;
  const images = product.images && product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const outOfStock = product.quantite <= 0;
  const lowStock = !outOfStock && product.quantite <= 3;
  const canAdd = !outOfStock && displayPrice > 0;
  const href = `/boutique/produits/${product.id}`;

  const step = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + dir + images.length) % images.length);
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAdd) return;
    addItem({ id: product.id, nom: product.nom, prix: displayPrice, image: images[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article
      className="group relative flex flex-col bg-white rounded-2xl border border-boutique-line overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(11,37,69,0.35)] hover:border-boutique-navy/30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setImageIndex(0);
      }}
    >
      <Link href={href} className="absolute inset-0 z-[1]" aria-label={product.nom} />

      {/* Image */}
      <div className="relative aspect-[4/3] bg-boutique-ground overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[imageIndex]}
            alt={product.nom}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-boutique-muted gap-1">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">Pas d&apos;image</span>
          </div>
        )}

        {images.length > 1 && hovered && (
          <>
            <button onClick={step(-1)} className="absolute left-1.5 top-1/2 -translate-y-1/2 z-[2] bg-white/90 hover:bg-white rounded-full p-1 shadow" aria-label="Image précédente">
              <ChevronLeft className="h-4 w-4 text-boutique-ink" />
            </button>
            <button onClick={step(1)} className="absolute right-1.5 top-1/2 -translate-y-1/2 z-[2] bg-white/90 hover:bg-white rounded-full p-1 shadow" aria-label="Image suivante">
              <ChevronRight className="h-4 w-4 text-boutique-ink" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-[2]">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-boutique-navy w-3' : 'bg-boutique-muted/50 w-1.5'}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-[2]">
          {hasPromo && (
            <span className="bg-boutique-amber text-boutique-navy text-[11px] font-extrabold tracking-wide px-2 py-0.5 rounded-md shadow-sm">
              −{discount}%
            </span>
          )}
          {lowStock && (
            <span className="bg-white/95 text-boutique-ink text-[11px] font-semibold px-2 py-0.5 rounded-md border border-boutique-line">
              Plus que {product.quantite}
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 bg-boutique-navy/55 backdrop-blur-[1px] flex items-center justify-center z-[2]">
            <span className="bg-white text-boutique-ink px-3 py-1 rounded-md text-xs font-semibold">Rupture de stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1 gap-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-boutique-muted truncate">
          {product.categorie?.nom || 'Produit'}
          {product.marque && <span className="normal-case tracking-normal"> · {product.marque.nom}</span>}
        </p>
        <h3 className="text-sm font-semibold text-boutique-ink leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-boutique-navy transition-colors">
          {product.nom}
        </h3>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {displayPrice > 0 ? (
              <>
                <p className={`text-base font-extrabold tabular-nums leading-none ${hasPromo ? 'text-boutique-amberDark' : 'text-boutique-navy'}`}>
                  {formatPrice(displayPrice)}
                </p>
                {hasPromo && <p className="text-xs text-boutique-muted line-through tabular-nums mt-1">{formatPrice(basePrice)}</p>}
              </>
            ) : (
              <p className="text-sm font-semibold text-boutique-navy">Prix sur demande</p>
            )}
          </div>
          <button
            onClick={quickAdd}
            disabled={!canAdd}
            aria-label={canAdd ? 'Ajouter au panier' : 'Indisponible'}
            className={`relative z-[2] h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-all
              ${added ? 'bg-emerald-500 text-white' : canAdd ? 'bg-boutique-navy text-white hover:bg-boutique-amber hover:text-boutique-navy' : 'bg-boutique-line text-boutique-muted cursor-not-allowed'}
              md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 focus-visible:opacity-100`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-boutique-line overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-boutique-ground" />
      <div className="p-3.5 space-y-2">
        <div className="h-2.5 bg-boutique-ground rounded w-20" />
        <div className="h-3.5 bg-boutique-ground rounded w-full" />
        <div className="h-3.5 bg-boutique-ground rounded w-3/4" />
        <div className="flex justify-between items-end pt-2">
          <div className="h-4 bg-boutique-ground rounded w-24" />
          <div className="h-9 w-9 bg-boutique-ground rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">{children}</div>;
}
