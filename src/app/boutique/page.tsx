'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  FileText,
  Clapperboard,
  Monitor,
  Home,
  Sun,
  Network,
  Package,
  Wrench,
  Phone,
} from 'lucide-react';
import { ProductCard, ProductSkeleton, ProductGrid, type ProduitCard } from '@/components/boutique/product-card';

interface Categorie {
  id: string;
  nom: string;
  _count: { produits: number };
}

/** Icône d'univers déduite du nom de la catégorie. */
function categoryIcon(nom: string) {
  const n = nom.toLowerCase();
  if (/audio|vid[eé]o|son|visuel|cam[eé]ra|studio/.test(n)) return Clapperboard;
  if (/inform|ordi|pc|laptop|bureau|imprim/.test(n)) return Monitor;
  if (/domot|maison|smart/.test(n)) return Home;
  if (/sol|[eé]nerg|batter|ondul/.test(n)) return Sun;
  if (/r[eé]seau|wifi|t[eé]l[eé]com|switch|routeur/.test(n)) return Network;
  if (/s[eé]cu|alarme|surveil/.test(n)) return ShieldCheck;
  if (/outil|access|c[aâ]ble/.test(n)) return Wrench;
  return Package;
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-boutique-amberDark mb-1">{eyebrow}</p>}
        <h2 className="text-xl sm:text-2xl font-extrabold text-boutique-navy tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-boutique-navy hover:text-boutique-amberDark transition-colors">
          {linkLabel || 'Voir tout'} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function BoutiquePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProduitCard[]>([]);
  const [newProducts, setNewProducts] = useState<ProduitCard[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const totalProduits = categories.reduce((s, c) => s + c._count.produits, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-boutique-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 80% at 85% 20%, rgba(244,163,0,0.28) 0%, rgba(244,163,0,0) 60%), radial-gradient(50% 60% at 10% 90%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%)',
          }}
        />
        <div className="container mx-auto px-4 py-10 md:py-16 relative">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 lg:col-span-5">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-boutique-amber mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-boutique-amber" />
                DCAT E-Market · Abidjan
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-balance">
                Le matériel pro pour l&apos;audiovisuel, l&apos;informatique, la domotique et le solaire.
              </h1>
              <p className="mt-4 text-white/75 text-base sm:text-lg max-w-prose">
                Équipements sélectionnés, conseils d&apos;experts et installation par nos techniciens. Livraison partout en Côte d&apos;Ivoire.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/boutique/produits"
                  className="inline-flex items-center gap-2 bg-boutique-amber text-boutique-navy font-bold px-5 py-3 rounded-xl hover:bg-white transition-colors"
                >
                  Voir le catalogue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/boutique/devis"
                  className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <FileText className="h-4 w-4" /> Demander un devis
                </Link>
              </div>
              <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md text-sm">
                <div>
                  <dt className="text-white/55 text-xs">Références</dt>
                  <dd className="font-bold text-lg tabular-nums">{loading ? '—' : `${totalProduits}+`}</dd>
                </div>
                <div>
                  <dt className="text-white/55 text-xs">Livraison</dt>
                  <dd className="font-bold text-lg">24–72 h</dd>
                </div>
                <div>
                  <dt className="text-white/55 text-xs">Support</dt>
                  <dd className="font-bold text-lg">7j/7</dd>
                </div>
              </dl>
            </div>
            <div className="md:col-span-6 lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] aspect-[16/10]">
                <img src="/slides/slide-1.jpg" alt="Showroom DCAT : audiovisuel, informatique, domotique, énergie solaire" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-boutique-navy/80 to-transparent p-4 sm:p-5">
                  <p className="text-xs sm:text-sm text-white/90 font-medium">Showroom Angré Château · Immeuble BATIM, 1er étage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="bg-white border-b border-boutique-line">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-boutique-line">
            {[
              { icon: Truck, t: 'Livraison rapide', s: 'Partout en Côte d’Ivoire' },
              { icon: ShieldCheck, t: 'Paiement sécurisé', s: 'Transactions protégées' },
              { icon: Headphones, t: 'Support client', s: 'À votre écoute 7j/7' },
              { icon: Wrench, t: 'Installation', s: 'Par nos techniciens' },
            ].map(({ icon: Icon, t, s }) => (
              <div key={t} className="flex items-center gap-3 py-4 px-3 first:pl-0">
                <span className="h-10 w-10 shrink-0 rounded-xl bg-boutique-ground text-boutique-navy flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-boutique-ink truncate">{t}</p>
                  <p className="text-xs text-boutique-muted truncate">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Univers */}
      {categories.length > 0 && (
        <section className="py-12 bg-boutique-ground">
          <div className="container mx-auto px-4">
            <SectionHeading eyebrow="Nos univers" title="Trouvez votre matériel par domaine" href="/boutique/produits" linkLabel="Tout le catalogue" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((c) => {
                const Icon = categoryIcon(c.nom);
                return (
                  <Link
                    key={c.id}
                    href={`/boutique/produits?categorie=${c.id}`}
                    className="group bg-white rounded-2xl border border-boutique-line p-4 sm:p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:border-boutique-navy/30 hover:shadow-[0_12px_30px_-12px_rgba(11,37,69,0.35)]"
                  >
                    <span className="h-11 w-11 rounded-xl bg-boutique-navy/5 text-boutique-navy flex items-center justify-center group-hover:bg-boutique-amber group-hover:text-boutique-navy transition-colors">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-boutique-ink leading-tight">{c.nom}</p>
                      <p className="text-xs text-boutique-muted mt-0.5">
                        {c._count.produits} produit{c._count.produits > 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Promotions */}
      {(loading || featuredProducts.length > 0) && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <SectionHeading eyebrow="Offres du moment" title="Promotions" href="/boutique/produits?featured=true" />
            <ProductGrid>
              {loading ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />) : featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
          </div>
        </section>
      )}

      {/* Nouveautés */}
      {(loading || newProducts.length > 0) && (
        <section className="py-12 bg-boutique-ground">
          <div className="container mx-auto px-4">
            <SectionHeading eyebrow="Sélection" title="Produits en vedette" href="/boutique/produits" />
            <ProductGrid>
              {loading ? Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />) : newProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
            <div className="mt-6 sm:hidden text-center">
              <Link href="/boutique/produits" className="inline-flex items-center gap-1 text-sm font-semibold text-boutique-navy">
                Voir tout le catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* B2B / devis */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-boutique-navy text-white p-6 sm:p-10 grid md:grid-cols-12 gap-6 items-center relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-boutique-amber/20 blur-3xl" />
            <div className="md:col-span-8 relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-boutique-amber mb-2">Entreprises &amp; institutions</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">Un projet d&apos;équipement ? Nous chiffrons, livrons et installons.</h2>
              <p className="mt-3 text-white/75 max-w-prose">
                Studios, salles de réunion, réseaux d&apos;entreprise, installations solaires : envoyez-nous votre besoin, un devis détaillé vous revient sous 48 h.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3 relative">
              <Link href="/boutique/devis" className="inline-flex items-center justify-center gap-2 bg-boutique-amber text-boutique-navy font-bold px-5 py-3 rounded-xl hover:bg-white transition-colors">
                <FileText className="h-4 w-4" /> Demander un devis
              </Link>
              <a href="tel:+2252721373363" className="inline-flex items-center justify-center gap-2 border border-white/30 font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <Phone className="h-4 w-4" /> +225 27 21 37 33 63
              </a>
            </div>
          </div>
        </div>
      </section>

      {!loading && featuredProducts.length === 0 && newProducts.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-extrabold text-boutique-navy mb-3">Bientôt disponible</h2>
            <p className="text-boutique-muted">Notre catalogue est en cours de préparation. Revenez bientôt pour découvrir nos produits !</p>
          </div>
        </section>
      )}
    </div>
  );
}
