'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Star, Heart, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ScrollReveal from '../components/ScrollReveal';
import useSEO from '../hooks/useSEO';

export default function Home() {
  const { toggleWishlist, wishlist, formatPrice, getProductsList } = useCart();
  const router = useRouter();

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://nestsleepora.store';

  useSEO({
    title: "NestSleepora | Premium Orthopedic Beds & Cooling Mattresses",
    description: "Discover premium solid timber bed frames, natural cooling mattresses, and sleep systems with zero-noise lock-in joints. Enjoy free delivery in Europe.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "NestSleepora",
      "url": currentOrigin,
      "description": "Discover premium solid timber bed frames, natural cooling mattresses, and sleep systems with zero-noise lock-in joints.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${currentOrigin}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  });

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const rotatingWords = ['luxury.', 'comfort.', 'support.'];
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState('');
  const [delta, setDelta] = useState(120);

  useEffect(() => {
    const handleTyping = () => {
      let i = loopNum % rotatingWords.length;
      let fullText = rotatingWords[i];
      let updatedText = isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1);

      setText(updatedText);

      if (isDeleting) {
        setDelta(50);
      } else {
        setDelta(120);
      }

      if (!isDeleting && updatedText === fullText) {
        setDelta(2200);
        setIsDeleting(true);
      } else if (isDeleting && updatedText === '') {
        setIsDeleting(false);
        setLoopNum((prev) => prev + 1);
        setDelta(400);
      }
    };

    const timer = setTimeout(handleTyping, delta);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, delta]);

  useEffect(() => {
    getProductsList()
      .then(data => {
        setFeaturedProducts(data.slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load home products:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative bg-dreamBlush py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left max-w-xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-dreamAccent/20">
              <Sparkles className="w-4 h-4 text-dreamAccent animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-dreamAccent-dark">Premium Sleep Sanctuary</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-dreamNavy leading-tight">
              Sleep in absolute,<br className="hidden sm:inline" />{' '}
              <span className="inline-block text-dreamAccent relative">
                <span>{text}</span>
                <span className="inline-block border-r-2 border-dreamAccent animate-pulse ml-1 h-[0.8em] w-[2px] align-middle"></span>
              </span>
            </h1>
            <p className="text-sm sm:text-base text-dreamNavy/70 leading-relaxed font-medium">
              Discover the absolute peak of night-time recovery. Engineered with advanced orthopedic support, natural temperature-regulating materials, and premium finishes, NestSleepora sleep systems are designed to transform your sleep health.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                href="/shop" 
                className="h-12 px-8 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-sm font-bold rounded-premium shadow-lg shadow-dreamAccent/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/about" 
                className="h-12 px-8 border border-dreamNavy/20 hover:border-dreamNavy text-dreamNavy text-sm font-bold rounded-premium flex items-center justify-center transition-colors"
              >
                Learn Our Craft
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in-up animation-delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-dreamAccent/10 to-transparent rounded-premiumLarge transform rotate-3 scale-105"></div>
            <img 
              src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800" 
              alt="NestSleepora Platform Bed" 
              className="rounded-premiumLarge shadow-2xl relative z-10 w-full object-cover max-h-[460px] aspect-[4/3] border border-dreamBorder animate-float"
            />
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white border border-dreamBorder rounded-premiumLarge p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 animate-fade-in-up">
            <div className="p-3 bg-dreamBlush rounded-premium text-dreamAccent shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 animate-float" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-poppins text-dreamNavy">Free Delivery</h4>
              <p className="text-[10px] sm:text-xs text-dreamMuted mt-1 leading-normal">Zero shipping costs across the country.</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 animate-fade-in-up animation-delay-100">
            <div className="p-3 bg-dreamBlush rounded-premium text-dreamAccent shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-poppins text-dreamNavy">Artisan Crafted</h4>
              <p className="text-[10px] sm:text-xs text-dreamMuted mt-1 leading-normal">Bespoke hand-built designs.</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 animate-fade-in-up animation-delay-200">
            <div className="p-3 bg-dreamBlush rounded-premium text-dreamAccent shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-poppins text-dreamNavy">Zero-Noise Joint</h4>
              <p className="text-[10px] sm:text-xs text-dreamMuted mt-1 leading-normal">Squeak-free frame connections.</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 animate-fade-in-up animation-delay-300">
            <div className="p-3 bg-dreamBlush rounded-premium text-dreamAccent shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-dreamGold text-dreamGold" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-poppins text-dreamNavy">Specialist Checked</h4>
              <p className="text-[10px] sm:text-xs text-dreamMuted mt-1 leading-normal">Designed for spinal posture alignment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-dreamNavy">Browse our Categories</h2>
            <p className="text-sm text-dreamMuted">Explore carefully balanced elements crafted for your recovery sleep.</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Beds */}
          <ScrollReveal delay={0}>
            <div className="perspective-container">
              <Link href="/shop/beds" className="group relative rounded-premiumLarge overflow-hidden shadow-md aspect-[4/3] block border border-dreamBorder card-3d">
                <div className="absolute inset-0 bg-dreamNavy/40 group-hover:bg-dreamNavy/30 transition-colors z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=600" 
                  alt="Beds" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 space-y-1">
                  <h3 className="text-xl font-bold font-poppins text-white">Luxury Beds</h3>
                  <p className="text-xs text-[#F1EEE8] flex items-center gap-1">
                    Explore bed frames <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                  </p>
                </div>
              </Link>
            </div>
          </ScrollReveal>

          {/* Mattresses */}
          <ScrollReveal delay={150}>
            <div className="perspective-container">
              <Link href="/shop/mattresses" className="group relative rounded-premiumLarge overflow-hidden shadow-md aspect-[4/3] block border border-dreamBorder card-3d">
                <div className="absolute inset-0 bg-dreamNavy/40 group-hover:bg-dreamNavy/30 transition-colors z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600" 
                  alt="Mattresses" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 space-y-1">
                  <h3 className="text-xl font-bold font-poppins text-white">Hybrid Mattresses</h3>
                  <p className="text-xs text-[#F1EEE8] flex items-center gap-1">
                    Explore mattress tech <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                  </p>
                </div>
              </Link>
            </div>
          </ScrollReveal>

          {/* Accessories */}
          <ScrollReveal delay={300}>
            <div className="perspective-container">
              <Link href="/shop/accessories" className="group relative rounded-premiumLarge overflow-hidden shadow-md aspect-[4/3] block border border-dreamBorder card-3d">
                <div className="absolute inset-0 bg-dreamNavy/40 group-hover:bg-dreamNavy/30 transition-colors z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=600" 
                  alt="Accessories" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 space-y-1">
                  <h3 className="text-xl font-bold font-poppins text-white">Bedding Accessories</h3>
                  <p className="text-xs text-[#F1EEE8] flex items-center gap-1">
                    Explore accessories <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                  </p>
                </div>
              </Link>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* Featured / Best Sellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-dreamNavy">Our Best Sellers</h2>
            <p className="text-sm text-dreamMuted">Loved by our customers, built for optimal spinal alignment.</p>
          </div>
          <Link href="/shop" className="text-dreamAccent hover:text-dreamAccent-dark text-sm font-bold flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-dreamBorder rounded-premiumLarge p-3 sm:p-4 space-y-3">
                <div className="bg-dreamBlush h-32 sm:h-48 w-full rounded-premium"></div>
                <div className="h-4 bg-dreamBlush w-3/4 rounded-full"></div>
                <div className="h-4 bg-dreamBlush w-1/2 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {featuredProducts.map((p, idx) => {
              const isWishlisted = wishlist.some(item => item.id === p.id);
              const hasDiscount = p.original_price_usd !== undefined && p.original_price_usd !== null && p.original_price_usd > (p.price_usd || p.base_price);
              const pctOff = hasDiscount ? Math.round(((parseFloat(p.original_price_usd) - parseFloat(p.price_usd || p.base_price)) / parseFloat(p.original_price_usd)) * 100) : 0;

              return (
                <ScrollReveal key={p.id} delay={idx * 100}>
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
      </section>

      {/* Mid-Page Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-dreamNavy text-white rounded-premiumLarge overflow-hidden border border-dreamBorder relative shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-dreamAccent/35 via-transparent to-transparent z-0"></div>
          <div className="relative z-10 px-8 py-12 sm:px-16 sm:py-20 max-w-2xl text-left space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-wider text-dreamAccent">Signature Suite Collection</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-poppins text-white leading-tight">
              The Art of Restful Alignment.
            </h2>
            <p className="text-sm sm:text-base text-[#F1EEE8]/80 leading-relaxed">
              Pair any premium solid timber bed frame with our orthopedic Hybrid Mattress to create the ultimate sleep system. Engineered to deliver absolute spinal support and zero-noise rest.
            </p>
            <div className="pt-2">
              <Link 
                href="/shop" 
                className="h-11 px-6 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-sm font-bold rounded-premium flex items-center gap-2 inline-flex transition-transform hover:-translate-y-0.5"
              >
                Explore Sleep Systems
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-dreamNavy">What Sleepers Say</h2>
          <p className="text-sm text-dreamMuted">Join thousands of customers who woke up fully energized today.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Peterson',
              title: 'Best mattress in 20 years',
              text: 'The combination of memory foam cooling top and support pocket springs works miracles. My lower back pain has completely cleared in under two weeks.',
              rating: 5,
              tag: 'Verified Buyer'
            },
            {
              name: 'Dr. Michael Chen',
              title: 'Recommended for posture',
              text: 'As a chiropractor, spinal posture is crucial. The NestSleepora support frame distributes weight uniformly. It provides the firm orthopedic alignment recommended.',
              rating: 5,
              tag: 'Verified Doctor'
            },
            {
              name: 'Amanda K.',
              title: 'Solid Oak Frame looks gorgeous',
              text: 'Exceptional craftsmanship. The oak joints fit together perfectly, absolutely silent frame when tossing. Looks beautiful in our master bedroom.',
              rating: 5,
              tag: 'Verified Buyer'
            }
          ].map((t, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="perspective-container h-full">
                <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 sm:p-8 shadow-sm flex flex-col justify-between card-3d h-full">
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.rating)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-dreamGold text-dreamGold" />
                      ))}
                    </div>
                    <h4 className="text-base font-bold font-poppins text-dreamNavy mb-2">"{t.title}"</h4>
                    <p className="text-sm text-dreamNavy/70 leading-relaxed italic font-medium">"{t.text}"</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-dreamBorder flex items-center justify-between">
                    <span className="text-sm font-bold text-dreamNavy">{t.name}</span>
                    <span className="text-[10px] font-extrabold text-dreamGreen bg-dreamGreen/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{t.tag}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

    </div>
  );
}
