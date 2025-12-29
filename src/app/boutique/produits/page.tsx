'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';

interface Produit {
  id: string;
  nom: string;
  description: string | null;
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

interface Categorie {
  id: string;
  nom: string;
  _count: { produits: number };
}

interface Marque {
  id: string;
  nom: string;
  _count: { produits: number };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

// Check if promo is currently active
function isPromoActive(product: Produit): boolean {
  const basePrice = product.prixVenteMin || product.prixVente || 0;
  if (product.promoPrice === null || product.promoPrice <= 0 || basePrice <= 0 || product.promoPrice >= basePrice) {
    return false;
  }
  const now = new Date();
  if (product.promoStart && new Date(product.promoStart) > now) return false;
  if (product.promoEnd && new Date(product.promoEnd) < now) return false;
  return true;
}

function ProductCard({ product }: { product: Produit }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const hasPromo = isPromoActive(product);
  const basePrice = product.prixVenteMin || product.prixVente || 0;
  const displayPrice = hasPromo ? product.promoPrice! : basePrice;
  const originalPrice = basePrice;
  const discount = hasPromo && originalPrice ? Math.round((1 - product.promoPrice! / originalPrice) * 100) : 0;
  
  // Get all available images
  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : []);
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Link
      href={`/boutique/produits/${product.id}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImageIndex(0); }}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={product.nom}
            className="w-full h-full object-contain p-2 transition-opacity duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Pas d&apos;image
          </div>
        )}
        
        {/* Image navigation arrows */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-all z-10"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-all z-10"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
            {/* Image dots indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-blue-600 w-3' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Promo badge */}
        {hasPromo && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {product.quantite <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      {/* Content - use flex column for price alignment */}
      <div className="p-3 sm:p-4 flex flex-col h-[120px] sm:h-[130px]">
        {/* Category */}
        {product.categorie && (
          <p className="text-xs text-gray-500 mb-1 truncate">{product.categorie.nom}</p>
        )}

        {/* Product name - fixed height with line clamp */}
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
          {product.marque ? `${product.marque.nom} ` : ''}{product.nom}
        </h3>

        {/* Price - always at bottom */}
        <div className="mt-auto pt-2">
          {hasPromo ? (
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-red-600">
                {formatPrice(displayPrice!)}
              </span>
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {formatPrice(originalPrice!)}
              </span>
            </div>
          ) : (
            <span className="text-base sm:text-lg font-bold text-gray-900">
              {displayPrice ? formatPrice(displayPrice) : (product.prixVenteMin ? formatPrice(product.prixVenteMin) : 'Prix sur demande')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-3 sm:p-4 h-[120px] sm:h-[130px] flex flex-col">
        <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-3/4 flex-grow" />
        <div className="h-5 bg-gray-200 rounded w-24 mt-auto" />
      </div>
    </div>
  );
}

// Product Filters Component
function ProductFilters({
  categories,
  marques,
  selectedCategorieId,
  selectedMarqueId,
}: {
  categories: Categorie[];
  marques: Marque[];
  selectedCategorieId?: string;
  selectedMarqueId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  const buildHref = (updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return `/boutique/produits${qs ? `?${qs}` : ''}`;
  };

  return (
    <aside className="lg:w-64 flex-shrink-0">
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          <Filter className="h-5 w-5" />
          Filtres
        </span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Filters content */}
      <div className={`bg-white rounded-lg shadow-sm p-4 sticky top-24 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <h2 className="font-semibold mb-4 hidden lg:block text-gray-900">Filtres</h2>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Catégories</h3>
          <ul className="space-y-1">
            <li>
              <a
                href={buildHref({ categorie: null })}
                className={`block py-1 text-sm ${!selectedCategorieId ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Toutes les catégories
              </a>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <a
                  href={buildHref({ categorie: cat.id })}
                  className={`block py-1 text-sm ${selectedCategorieId === cat.id ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {cat.nom} ({cat._count.produits})
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Marques */}
        {marques.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Marques</h3>
            <ul className="space-y-1">
              {marques.map((marque) => (
                <li key={marque.id}>
                  <a
                    href={buildHref({ marque: marque.id })}
                    className={`block py-1 text-sm ${selectedMarqueId === marque.id ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {marque.nom} ({marque._count.produits})
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function ProduitsPage() {
  return (
    <Suspense fallback={<ProduitsPageLoading />}>
      <ProduitsPageContent />
    </Suspense>
  );
}

function ProduitsPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    </div>
  );
}

function ProduitsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);

  const categorieId = searchParams.get('categorie') || undefined;
  const marqueId = searchParams.get('marque') || undefined;
  const search = searchParams.get('q') || searchParams.get('search') || undefined;
  const featured = searchParams.get('featured') === 'true';

  useEffect(() => {
    fetchData();
  }, [categorieId, marqueId, search, featured]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categorieId) params.set('categorie', categorieId);
      if (marqueId) params.set('marque', marqueId);
      if (featured) params.set('featured', 'true');
      params.set('limit', '100');

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/boutique/produits?${params}`, { cache: 'no-store' }),
        fetch('/api/boutique/categories', { cache: 'no-store' }),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {featured ? 'Promotions' : (search ? `Résultats pour "${search}"` : 'Tous les produits')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <ProductFilters
          categories={categories}
          marques={marques}
          selectedCategorieId={categorieId}
          selectedMarqueId={marqueId}
        />

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <>
              <p className="text-sm text-gray-600 mb-4">Chargement...</p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array(8).fill(0).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </>
          ) : products.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
              <a href={featured ? '/boutique/produits?featured=true' : '/boutique/produits'} className="text-blue-600 hover:underline mt-2 inline-block">
                Voir tous les produits
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
