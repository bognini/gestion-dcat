'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from './layout';

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

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(price) + ' FCFA';
}

// Check if promo is currently active
function isPromoActive(produit: Produit): boolean {
  const basePrice = produit.prixVenteMin || produit.prixVente || 0;
  if (produit.promoPrice === null || produit.promoPrice <= 0 || basePrice <= 0 || produit.promoPrice >= basePrice) {
    return false;
  }
  const now = new Date();
  if (produit.promoStart && new Date(produit.promoStart) > now) return false;
  if (produit.promoEnd && new Date(produit.promoEnd) < now) return false;
  return true;
}

// Slider images from /public/slides folder
const SLIDER_IMAGES = [
  '/slides/slide-1.jpg',
  // Add more slides here: '/slides/slide-2.jpg', '/slides/slide-3.jpg', etc.
];

function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || SLIDER_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative w-full aspect-[3/1] md:aspect-[3/1] overflow-hidden bg-gray-100">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {SLIDER_IMAGES.map((src, index) => (
          <div key={index} className="w-full flex-shrink-0 h-full">
            <img
              src={src}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows - only show if multiple slides */}
      {SLIDER_IMAGES.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
            aria-label="Slide suivant"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
            {SLIDER_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
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
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : []);
  const hasMultipleImages = allImages.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
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
        {allImages.length > 0 ? (
          <img
            src={allImages[currentImageIndex]}
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
              {allImages.map((_, idx) => (
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

export default function BoutiquePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Produit[]>([]);
  const [newProducts, setNewProducts] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        fetch('/api/boutique/produits?featured=true&limit=4', { cache: 'no-store' }),
        fetch('/api/boutique/produits?limit=8', { cache: 'no-store' }),
        fetch('/api/boutique/categories', { cache: 'no-store' }),
      ]);

      if (featuredRes.ok) setFeaturedProducts(await featuredRes.json());
      if (newRes.ok) setNewProducts(await newRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Features */}
      <section className="bg-white py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4">
              <Truck className="h-10 w-10 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Livraison rapide</h3>
                <p className="text-sm text-gray-600">Partout en Côte d&apos;Ivoire</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <Shield className="h-10 w-10 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Paiement sécurisé</h3>
                <p className="text-sm text-gray-600">Transactions protégées</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <Headphones className="h-10 w-10 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Support client</h3>
                <p className="text-sm text-gray-600">À votre écoute 7j/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">Nos catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/boutique/produits?categorie=${category.id}`}
                  className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">{category.nom}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {category._count.produits} produit{category._count.produits > 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Products */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-orange-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-orange-600">🔥 Promotions</h2>
              <Link
                href="/boutique/produits?featured=true"
                className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {newProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Produits en vedette</h2>
              <Link
                href="/boutique/produits"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              ) : (
                newProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Empty state if no products */}
      {!loading && featuredProducts.length === 0 && newProducts.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Bientôt disponible</h2>
            <p className="text-gray-600 mb-8">
              Notre catalogue est en cours de préparation. Revenez bientôt pour découvrir nos produits !
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
