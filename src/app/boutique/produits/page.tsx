'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Filter, Loader2, SlidersHorizontal } from 'lucide-react';
import { ProductCard, ProductSkeleton, ProductGrid, type ProduitCard } from '@/components/boutique/product-card';

type Produit = ProduitCard;

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
        className="lg:hidden w-full flex items-center justify-between bg-white rounded-2xl border border-boutique-line p-4 mb-4"
      >
        <span className="flex items-center gap-2 font-bold text-boutique-navy">
          <Filter className="h-5 w-5" />
          Filtres
        </span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Filters content */}
      <div className={`bg-white rounded-2xl border border-boutique-line p-5 sticky top-40 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <h2 className="font-extrabold mb-4 hidden lg:flex items-center gap-2 text-boutique-navy"><SlidersHorizontal className="h-4 w-4" /> Filtres</h2>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-boutique-muted mb-2">Catégories</h3>
          <ul className="space-y-1">
            <li>
              <a
                href={buildHref({ categorie: null })}
                className={`block py-1.5 text-sm rounded-md ${!selectedCategorieId ? 'text-boutique-navy font-bold' : 'text-boutique-muted hover:text-boutique-navy'}`}
              >
                Toutes les catégories
              </a>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <a
                  href={buildHref({ categorie: cat.id })}
                  className={`block py-1.5 text-sm rounded-md ${selectedCategorieId === cat.id ? 'text-boutique-navy font-bold' : 'text-boutique-muted hover:text-boutique-navy'}`}
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
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-boutique-muted mb-2">Marques</h3>
            <ul className="space-y-1">
              {marques.map((marque) => (
                <li key={marque.id}>
                  <a
                    href={buildHref({ marque: marque.id })}
                    className={`block py-1.5 text-sm rounded-md ${selectedMarqueId === marque.id ? 'text-boutique-navy font-bold' : 'text-boutique-muted hover:text-boutique-navy'}`}
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
        <Loader2 className="h-8 w-8 animate-spin text-boutique-navy" />
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
      <h1 className="text-2xl sm:text-3xl font-extrabold text-boutique-navy tracking-tight mb-6">
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
              <p className="text-sm text-boutique-muted mb-4">Chargement...</p>
              <ProductGrid>
                {Array(8).fill(0).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </ProductGrid>
            </>
          ) : products.length > 0 ? (
            <>
              <p className="text-sm text-boutique-muted mb-4">
                {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </p>
              <ProductGrid>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ProductGrid>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-boutique-muted text-lg">Aucun produit trouvé</p>
              <a href={featured ? '/boutique/produits?featured=true' : '/boutique/produits'} className="text-boutique-navy font-semibold hover:underline mt-2 inline-block">
                Voir tous les produits
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
