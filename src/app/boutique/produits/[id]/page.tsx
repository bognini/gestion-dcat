'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, ShoppingCart, Minus, Plus, MessageCircle } from 'lucide-react';
import { useCart } from '../../layout';

interface Produit {
  id: string;
  nom: string;
  description: string | null;
  sku: string | null;
  prixVente: number | null;
  prixVenteMin: number | null;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  quantite: number;
  poids: number | null;
  couleur: string | null;
  categorie: { id: string; nom: string } | null;
  marque: { id: string; nom: string } | null;
  imageUrls: string[];
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

export default function ProduitDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Produit | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/boutique/produits/${params.id}`, { cache: 'no-store' });
      if (res.ok) {
        setProduct(await res.json());
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-gray-500 mb-8">Ce produit n&apos;existe pas ou n&apos;est plus disponible.</p>
        <a
          href="/boutique/produits"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Voir tous les produits
        </a>
      </div>
    );
  }

  const hasPromo = isPromoActive(product);
  const basePrice = product.prixVenteMin || product.prixVente || 0;
  const displayPrice = hasPromo ? product.promoPrice! : basePrice;
  const originalPrice = basePrice;
  const discount = hasPromo && originalPrice ? Math.round((1 - product.promoPrice! / originalPrice) * 100) : 0;
  const productName = product.marque ? `${product.marque.nom} ${product.nom}` : product.nom;

  const handleAddToCart = () => {
    const price = hasPromo ? product.promoPrice! : basePrice;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        nom: productName,
        prix: price,
        image: product.imageUrls[0] || undefined,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/boutique" className="hover:text-gray-700">Accueil</Link>
        <ChevronRight className="h-3 w-3 flex-shrink-0" />
        <Link href="/boutique/produits" className="hover:text-gray-700">Produits</Link>
        {product.categorie && (
          <>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <Link href={`/boutique/produits?categorie=${product.categorie.id}`} className="hover:text-gray-700">
              {product.categorie.nom}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 flex-shrink-0" />
        <span className="text-gray-900 truncate max-w-[150px]">{productName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Gallery */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="relative aspect-[4/3] max-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {product.imageUrls.length > 0 ? (
              <img
                src={product.imageUrls[selectedImage]}
                alt={productName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Pas d&apos;image
              </div>
            )}
            {hasPromo && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.categorie && (
            <p className="text-xs text-gray-500 mb-1">{product.categorie.nom}</p>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{productName}</h1>

          {/* Price */}
          <div className="mb-4">
            {hasPromo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(displayPrice!)}
                  </span>
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(originalPrice!)}
                  </span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                </div>
                <p className="text-xs text-green-600 font-medium">
                  Économie: {formatPrice(originalPrice! - displayPrice!)}
                </p>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {displayPrice ? formatPrice(displayPrice) : (product.prixVenteMin ? formatPrice(product.prixVenteMin) : 'Prix sur demande')}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className="mb-4">
            {product.quantite > 0 ? (
              <span className="inline-flex items-center gap-2 text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                En stock ({product.quantite} disponible{product.quantite > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-red-600">
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                Rupture de stock
              </span>
            )}
          </div>

          {/* CTA buttons */}
          {product.quantite > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
                >
                  <Minus className="h-4 w-4 text-gray-700" />
                </button>
                <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.quantite, quantity + 1))}
                  disabled={quantity >= product.quantite}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.quantite <= 0}
                className={`py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  added 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? 'Ajouté !' : 'Ajouter'}
              </button>
              <a
                href="https://wa.me/2250709029625"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <h2 className="text-sm font-semibold mb-2">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">Caractéristiques</h2>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {product.marque && (
                <div>
                  <dt className="text-gray-500">Marque</dt>
                  <dd className="font-medium text-gray-900">{product.marque.nom}</dd>
                </div>
              )}
              {product.categorie && (
                <div>
                  <dt className="text-gray-500">Catégorie</dt>
                  <dd className="font-medium text-gray-900">{product.categorie.nom}</dd>
                </div>
              )}
              {product.couleur && (
                <div>
                  <dt className="text-gray-500">Couleur</dt>
                  <dd className="font-medium text-gray-900">{product.couleur}</dd>
                </div>
              )}
              {product.poids && (
                <div>
                  <dt className="text-gray-500">Poids</dt>
                  <dd className="font-medium text-gray-900">{product.poids} kg</dd>
                </div>
              )}
              {product.sku && (
                <div>
                  <dt className="text-gray-500">SKU</dt>
                  <dd className="font-medium text-gray-900">{product.sku}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
