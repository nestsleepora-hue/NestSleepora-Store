'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ScrollReveal from '../../components/ScrollReveal';
import useSEO from '../../hooks/useSEO';

function ShopContent({ categoryFilter }) {
  const { toggleWishlist, wishlist, formatPrice, getProductsList } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search/Category info from URL
  const querySearch = searchParams.get('search') || '';
  const queryCategory = categoryFilter || searchParams.get('category') || '';

  // Local filter states
  const [category, setCategory] = useState(queryCategory);
  const [search, setSearch] = useState(querySearch);
  const [size, setSize] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('newest');

  // Products data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync state if categoryFilter prop changes
  useEffect(() => {
    setCategory(categoryFilter || searchParams.get('category') || '');
  }, [categoryFilter, searchParams]);

  // Sync search state if URL search param changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch products with filters
  useEffect(() => {
    setLoading(true);
    setError(null);

    getProductsList()
      .then((data) => {
        let filtered = [...data];

        // 1. Filter by Category
        if (category) {
          filtered = filtered.filter(p => p.category === category.toLowerCase());
        }

        // 2. Filter by Search Text
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
        }

        // 3. Filter by Size
        if (size) {
          filtered = filtered.filter(p => p.variants && p.variants.some(v => v.size === size));
        }

        // 4. Filter by Min/Max Price
        if (priceRange.min) {
          filtered = filtered.filter(p => (p.discount_price || p.base_price) >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
          filtered = filtered.filter(p => (p.discount_price || p.base_price) <= parseFloat(priceRange.max));
        }

        // 5. Filter by Rating
        if (minRating) {
          filtered = filtered.filter(p => {
            const reviews = p.reviews || [];
            const avg = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
            return avg >= parseFloat(minRating);
          });
        }

        // 6. Sorting
        if (sort === 'price_asc') {
          filtered.sort((a, b) => (a.discount_price || a.base_price) - (b.discount_price || b.base_price));
        } else if (sort === 'price_desc') {
          filtered.sort((a, b) => (b.discount_price || b.base_price) - (a.discount_price || a.base_price));
        } else if (sort === 'newest') {
          filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } else if (sort === 'rating_desc') {
          filtered.sort((a, b) => {
            const avgA = a.reviews?.length > 0 ? (a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length) : 0;
            const avgB = b.reviews?.length > 0 ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length) : 0;
            return avgB - avgA;
          });
        }

        setProducts(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('Error loading products. Please try again.');
        setLoading(false);
      });
  }, [category, search, size, priceRange, minRating, sort, getProductsList]);

  const handleClearFilters = () => {
    setCategory(categoryFilter || '');
    setSearch('');
    setSize('');
    setPriceRange({ min: '', max: '' });
    setMinRating('');
    setSort('newest');
    router.push('/shop');
  };

  const getCategoryTitle = () => {
    if (category === 'beds') return 'Beds';
    if (category === 'sofa') return 'Sofas';
    if (category === 'mattresses') return 'Mattresses';
    if (category === 'accessories') return 'Accessories';
    return 'All Products';
  };

  const categoryTitle = getCategoryTitle();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nestsleepora.store/shop';

  useSEO({
    title: `Shop Premium ${categoryTitle} | NestSleepora`,
    description: `Explore NestSleepora's premium collection of ${categoryTitle.toLowerCase()}. Orthopedic design and zero-noise joinery for perfect night-time recovery.`,
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `Shop Premium ${categoryTitle} - NestSleepora`,
      "url": currentUrl,
      "description": `Browse our catalog of premium ${categoryTitle.toLowerCase()} designed for orthopedic comfort and spinal posture support.`
    }
  });

  const updateSearchCategory = (newCat) => {
    setCategory(newCat);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newCat) newParams.set('category', newCat);
    else newParams.delete('category');
    router.push(`/shop?${newParams.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-dreamMuted font-sans">
        <Link href="/" className="hover:text-dreamAccent">Home</Link>
        <ChevronRight className="w-4 h-4 shrink-0 text-dreamBorder" />
        {categoryFilter ? (
          <>
            <Link href="/shop" className="hover:text-dreamAccent">Shop</Link>
            <ChevronRight className="w-4 h-4 shrink-0 text-dreamBorder" />
            <span className="text-dreamNavy font-bold">{getCategoryTitle()}</span>
          </>
        ) : (
          <span className="text-dreamNavy font-bold">Shop</span>
        )}
      </div>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-dreamBorder pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-poppins text-dreamNavy leading-tight">
            {getCategoryTitle()}
          </h1>
          {search && (
            <p className="text-sm text-dreamMuted mt-1">
              Search results for "<strong className="text-dreamNavy">{search}</strong>"
            </p>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-dreamMuted">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 border border-dreamBorder rounded-premium text-sm font-bold bg-white text-dreamNavy outline-none focus:border-dreamAccent cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Best Customer Rated</option>
          </select>
        </div>
      </div>

      {/* Mobile Filters Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full h-11 bg-white border border-dreamBorder rounded-premium flex items-center justify-center gap-2 text-xs font-bold text-dreamNavy hover:border-dreamMuted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-dreamAccent" />
          {showMobileFilters ? 'Hide Filters & Sorting' : 'Show Filters & Sorting'}
        </button>
      </div>

      {/* Mobile Filters Drawer Backdrop */}
      {showMobileFilters && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Filter Sidebar */}
        <aside 
          className={`
            bg-white space-y-6 lg:block lg:sticky lg:top-36 lg:self-start lg:col-span-1 lg:border lg:border-dreamBorder lg:rounded-premiumLarge lg:p-6 lg:shadow-none
            ${showMobileFilters 
              ? 'fixed inset-y-0 right-0 w-[290px] p-6 border-l border-dreamBorder shadow-2xl z-50 overflow-y-auto block' 
              : 'hidden'
            }
          `}
        >
          {/* Header inside drawer for mobile */}
          <div className="flex lg:hidden items-center justify-between border-b border-dreamBorder pb-4">
            <h3 className="text-sm font-extrabold uppercase text-dreamNavy tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-dreamAccent" />
              Filters
            </h3>
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="p-1.5 text-dreamMuted hover:text-dreamNavy rounded-full hover:bg-dreamBlush transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Header for desktop */}
          <div className="hidden lg:flex items-center justify-between border-b border-dreamBorder pb-4">
            <h3 className="text-base font-bold font-poppins text-dreamNavy flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-dreamAccent" />
              Filters
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-dreamAccent hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          {!categoryFilter && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-dreamNavy tracking-wider">Category</h4>
              <div className="space-y-1">
                {[
                  { key: '', label: 'All Categories' },
                  { key: 'beds', label: 'Beds' },
                  { key: 'sofa', label: 'Sofas' },
                  { key: 'mattresses', label: 'Mattresses' },
                  { key: 'accessories', label: 'Accessories' }
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => updateSearchCategory(c.key)}
                    className={`w-full text-left py-1 text-sm font-medium hover:text-dreamAccent flex items-center justify-between ${
                      category === c.key ? 'text-dreamAccent font-bold' : 'text-dreamNavy/70'
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-dreamNavy tracking-wider">Size</h4>
            <div className="flex flex-wrap gap-2">
              {['Twin', 'Full', 'Queen', 'King', 'Split King'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(size === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    size === s
                      ? 'bg-dreamGreen text-white border-dreamGreen'
                      : 'bg-white text-dreamNavy border-dreamBorder hover:border-dreamMuted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-dreamNavy tracking-wider">Price Range ($)</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-full h-10 px-3 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-full h-10 px-3 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
              />
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-dreamNavy tracking-wider">Minimum Rating</h4>
            <div className="space-y-1">
              {[4, 3, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? '' : r)}
                  className={`w-full flex items-center gap-2 py-1 text-sm font-medium hover:text-dreamAccent ${
                    minRating === r ? 'text-dreamAccent font-bold' : 'text-dreamNavy/70'
                  }`}
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < r ? 'fill-dreamGold text-dreamGold' : 'text-dreamBorder fill-dreamBorder'
                        }`}
                      />
                    ))}
                  </div>
                  <span>&amp; Up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Footer Drawer Actions */}
          <div className="flex lg:hidden flex-col gap-2 pt-4 border-t border-dreamBorder mt-6">
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full h-10 bg-dreamAccent text-white text-xs font-bold rounded-premium flex items-center justify-center shadow-md shadow-dreamAccent/10"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                handleClearFilters();
                setShowMobileFilters(false);
              }}
              className="w-full h-10 border border-dreamBorder text-dreamNavy text-xs font-bold rounded-premium flex items-center justify-center hover:bg-dreamBlush/5"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-dreamBorder rounded-premiumLarge p-4 space-y-4">
                  <div className="bg-dreamBlush h-48 w-full rounded-premium"></div>
                  <div className="h-4 bg-dreamBlush w-3/4 rounded-full"></div>
                  <div className="h-4 bg-dreamBlush w-1/2 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white border border-dreamBorder rounded-premiumLarge">
              <p className="text-dreamRed text-sm font-semibold">{error}</p>
              <button 
                onClick={handleClearFilters}
                className="mt-4 px-6 py-2 bg-dreamAccent text-white text-xs font-bold rounded-premium"
              >
                Reset Filters
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dreamBorder rounded-premiumLarge space-y-4">
              <p className="text-dreamNavy text-base font-bold font-poppins">No products matched your criteria.</p>
              <p className="text-xs text-dreamMuted max-w-xs mx-auto">Try widening your price range, resetting categories, or searching for other keywords.</p>
              <button 
                onClick={handleClearFilters}
                className="h-10 px-6 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p, idx) => {
                const isWishlisted = wishlist.some(item => item.id === p.id);
                const hasDiscount = p.original_price_usd !== undefined && p.original_price_usd !== null && p.original_price_usd > (p.price_usd || p.base_price);
                const pctOff = hasDiscount ? Math.round(((parseFloat(p.original_price_usd) - parseFloat(p.price_usd || p.base_price)) / parseFloat(p.original_price_usd)) * 100) : 0;

                return (
                  <ScrollReveal key={p.id} delay={(idx % 3) * 100}>
                    <div className="perspective-container h-full">
                      <div
                        className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden shadow-sm card-3d group flex flex-col justify-between h-full"
                      >
                        <div className="relative">
                          {/* Sale Badge */}
                          {hasDiscount && (
                            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-2 py-0.5 sm:px-3 sm:py-1 bg-dreamRed text-white text-[9px] sm:text-[10px] font-extrabold uppercase rounded-full">
                              Sale: {pctOff}% OFF
                            </span>
                          )}

                          {/* Wishlist Button */}
                          <button
                            onClick={() => toggleWishlist(p)}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 bg-white border border-dreamBorder rounded-full shadow-md text-dreamNavy transition-colors hover:text-dreamAccent"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-dreamAccent text-dreamAccent' : ''}`} />
                          </button>

                          {/* Image */}
                          <Link href={`/product/${p.id}`} className="block overflow-hidden aspect-[4/3] bg-dreamBlush">
                            <img
                              src={p.image_urls[0]}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                        </div>

                        {/* Info */}
                        <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1 mb-1.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.round(p.avg_rating)
                                      ? 'fill-dreamGold text-dreamGold'
                                      : 'text-dreamBorder fill-dreamBorder'
                                  }`}
                                />
                              ))}
                              <span className="text-[10px] font-bold text-dreamNavy ml-1">
                                {Number(p.avg_rating || 0).toFixed(1)} / 5
                              </span>
                              <span className="text-[10px] text-dreamMuted">
                                ({p.review_count})
                              </span>
                            </div>

                            <Link href={`/product/${p.id}`}>
                              <h3 className="text-xs sm:text-base font-bold font-poppins text-dreamNavy group-hover:text-dreamAccent transition-colors leading-snug line-clamp-1 sm:line-clamp-none">
                                {p.name}
                              </h3>
                            </Link>
                            <p className="text-xs text-dreamMuted mt-1 hidden sm:line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-dreamBorder flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-left">
                            <div>
                              {hasDiscount ? (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs sm:text-base font-bold text-dreamNavy">{formatPrice(p.price_usd || p.base_price, p)}</span>
                                  <span className="text-[9px] sm:text-xs text-dreamMuted line-through">{formatPrice(p.original_price_usd, p, 0, true)}</span>
                                </div>
                              ) : (
                                <span className="text-xs sm:text-base font-bold text-dreamNavy">{formatPrice(p.price_usd || p.base_price, p)}</span>
                              )}
                              <span className="text-[9px] text-dreamMuted block">Free shipping</span>
                            </div>
                            <Link
                              href={`/product/${p.id}`}
                              className="h-7 sm:h-9 px-2 sm:px-4 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-[10px] sm:text-xs font-bold rounded-premium flex items-center justify-center transition-colors text-center"
                            >
                              Options
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Shop(props) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-pulse">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-dreamAccent mx-auto"></div>
        <p className="text-xs text-dreamMuted mt-4">Loading store catalog...</p>
      </div>
    }>
      <ShopContent {...props} />
    </Suspense>
  );
}
