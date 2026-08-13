import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, Plus, Minus, Check, MessageSquare, ArrowLeft, ChevronRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import useSEO from '../hooks/useSEO';

export default function ProductDetail() {
  const id = useParams().id;
  const navigate = useNavigate();
  const { currency, addToCart, toggleWishlist, wishlist, user, formatPrice, getProductDetails, getProductsList, addProductReview } = useCart();

  // Product and reviews states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery and options states
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'description' | 'shipping'

  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const mainCtaRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main CTA is out of view
        setShowStickyCTA(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const timer = setTimeout(() => {
      if (mainCtaRef.current) {
        observer.observe(mainCtaRef.current);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (mainCtaRef.current) {
        observer.unobserve(mainCtaRef.current);
      }
    };
  }, [loading, data]);

  const productSchema = data ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.product.name,
    "image": data.product.image_urls || [],
    "description": data.product.description,
    "category": data.product.category,
    "brand": {
      "@type": "Brand",
      "name": "NestSleepora"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": currency || "EUR",
      "lowPrice": data.product.discount_price !== null ? data.product.discount_price : data.product.base_price,
      "highPrice": data.product.base_price,
      "offerCount": data.variants?.length || 1,
      "availability": "https://schema.org/InStock",
      "url": window.location.href
    },
    "aggregateRating": data.stats?.review_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": data.stats.avg_rating,
      "reviewCount": data.stats.review_count,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined
  } : null;

  useSEO({
    title: data ? `${data.product.name} | NestSleepora` : "Premium Product | NestSleepora",
    description: data ? data.product.description : "Explore NestSleepora's premium sleep systems designed for orthopedic alignment and luxury resting.",
    schema: productSchema
  });

  // Write Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState(user ? user.name : '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Fetch product data from Firestore
  const fetchProductDetails = () => {
    setLoading(true);
    getProductDetails(id)
      .then((resData) => {
        setData(resData);
        setActiveImage(resData.product.image_urls[0]);
        if (resData.variants.length > 0) {
          setSelectedVariant(resData.variants[0]);
        }
        setLoading(false);
        // Fetch related products
        fetchRelated(resData.product.category, resData.product.id);
      })
      .catch((err) => {
        console.error('Fetch detail error:', err);
        setError('Could not load product details.');
        setLoading(false);
      });
  };

  const fetchRelated = (category, currentId) => {
    getProductsList()
      .then(productsList => {
        const matching = productsList.filter(p => p.category === category && p.id !== currentId).slice(0, 4);
        setRelatedProducts(matching);
      })
      .catch(err => console.error('Failed to load related products:', err));
  };

  useEffect(() => {
    fetchProductDetails();
    setQuantity(1);
  }, [id]);

  // Sync user name if logged in
  useEffect(() => {
    if (user) {
      setReviewName(user.name);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-dreamBlush h-96 rounded-premiumLarge"></div>
            <div className="space-y-4">
              <div className="h-6 bg-dreamBlush w-1/4 rounded-full"></div>
              <div className="h-10 bg-dreamBlush w-3/4 rounded-full"></div>
              <div className="h-4 bg-dreamBlush w-full rounded-full"></div>
              <div className="h-20 bg-dreamBlush w-full rounded-premium"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <p className="text-dreamRed font-semibold text-lg">{error || 'Product not found'}</p>
        <Link to="/shop" className="inline-flex items-center gap-2 text-dreamAccent font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  const { product, variants, reviews, stats } = data;
  const isWishlisted = wishlist.some(item => item.id === product.id);

  // Price calculations
  const basePrice = product.price_usd || product.base_price;
  const originalBasePrice = product.original_price_usd;
  const currentPrice = basePrice + (selectedVariant ? selectedVariant.price_modifier : 0);
  const hasDiscount = product.original_price_usd !== undefined && product.original_price_usd !== null && product.original_price_usd > (product.price_usd || product.base_price);
  const pctOff = hasDiscount ? Math.round(((parseFloat(product.original_price_usd) - parseFloat(product.price_usd || product.base_price)) / parseFloat(product.original_price_usd)) * 100) : 0;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    // Fast path: add to cart and navigate straight to checkout
    addToCart(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!reviewName.trim() || !reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError('All fields are required.');
      return;
    }

    addProductReview(product.id, {
      user_name: reviewName,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      verified: user ? true : false,
      created_at: new Date().toISOString()
    })
      .then(() => {
        setReviewSuccess(true);
        setReviewTitle('');
        setReviewComment('');
        fetchProductDetails();
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess(false);
        }, 1500);
      })
      .catch((err) => {
        setReviewError(err.message || 'Could not submit review. Please try again.');
      });
  };

  // Helper to calculate percentages
  const getRatingPercent = (stars) => {
    if (stats.review_count === 0) return 0;
    const count = stats.distribution[stars] || 0;
    return Math.round((count / stats.review_count) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-dreamMuted font-sans">
        <Link to="/" className="hover:text-dreamAccent">Home</Link>
        <ChevronRight className="w-4 h-4 text-dreamBorder" />
        <Link to="/shop" className="hover:text-dreamAccent">Shop</Link>
        <ChevronRight className="w-4 h-4 text-dreamBorder" />
        <Link to={`/shop/${product.category}`} className="hover:text-dreamAccent capitalize">{product.category}</Link>
        <ChevronRight className="w-4 h-4 text-dreamBorder" />
        <span className="text-dreamNavy font-bold truncate max-w-[150px]">{product.name}</span>
      </div>

      {/* Main product presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Gallery block */}
        <div className="space-y-4">
          <div className="border border-dreamBorder rounded-premiumLarge overflow-hidden aspect-[4/3] bg-dreamBlush">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {product.image_urls.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`border rounded-premium overflow-hidden aspect-[4/3] bg-dreamBlush transition-all ${
                  activeImage === img ? 'border-dreamAccent ring-2 ring-dreamAccent/10' : 'border-dreamBorder hover:border-dreamMuted'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Configurations block */}
        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${
                    i < Math.round(stats.avg_rating) 
                      ? 'fill-dreamGold text-dreamGold' 
                      : 'text-dreamBorder fill-dreamBorder'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-dreamNavy ml-1">{stats.avg_rating} / 5</span>
              <span className="text-xs text-dreamMuted">({stats.review_count} Reviews)</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold font-poppins text-dreamNavy leading-tight">
              {product.name}
            </h1>
            
            <span className="inline-block px-3 py-1 bg-dreamGreen/10 text-dreamGreen text-[10px] font-extrabold uppercase rounded-full tracking-wider">
              In Stock &amp; Ready to Ship
            </span>
          </div>

          <p className="text-sm text-dreamNavy/70 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Sizing selector */}
          <div className="space-y-2 border-t border-b border-dreamBorder py-4">
            <h3 className="text-xs font-extrabold uppercase text-dreamNavy tracking-wider">Select Size Options</h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id || v.size}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-5 py-2 rounded-full text-xs font-bold border transition-all ${
                    selectedVariant && (selectedVariant.id || selectedVariant.size) === (v.id || v.size)
                      ? 'bg-dreamGreen text-white border-dreamGreen'
                      : 'bg-white text-dreamNavy border-dreamBorder hover:border-dreamMuted'
                  }`}
                >
                  {v.size} {v.price_modifier > 0 ? `(+${formatPrice(v.price_modifier)})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing display */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-dreamNavy">
              {formatPrice(basePrice, product, selectedVariant ? selectedVariant.price_modifier : 0, false)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-dreamMuted line-through">
                  {formatPrice(originalBasePrice, product, selectedVariant ? selectedVariant.price_modifier : 0, true)}
                </span>
                <span className="px-2 py-0.5 bg-dreamRed text-white text-[10px] font-extrabold uppercase rounded-full">
                  Sale: {pctOff}% OFF
                </span>
              </>
            )}
            <span className="text-xs text-dreamMuted block w-full">Free shipping &amp; secure transaction</span>
          </div>

          {/* Stepper and Add to Cart / Buy Now CTAs */}
          <div ref={mainCtaRef} className="flex flex-wrap items-center gap-4 border-b border-dreamBorder pb-6">
            
            {/* Quantity Stepper */}
            <div className="flex items-center border border-dreamBorder rounded-premium h-12 bg-white px-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 text-dreamMuted hover:text-dreamNavy hover:bg-dreamBlush rounded-full transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-dreamNavy">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-1.5 text-dreamMuted hover:text-dreamNavy hover:bg-dreamBlush rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Twin CTAs */}
            <button
              onClick={handleAddToCart}
              className="flex-grow sm:flex-grow-0 h-12 px-8 bg-dreamGreen hover:bg-dreamGreen/90 text-white text-sm font-bold rounded-premium shadow-lg shadow-dreamGreen/10 transition-colors flex items-center justify-center gap-2"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-grow sm:flex-grow-0 h-12 px-8 bg-dreamGold hover:bg-[#EAA01C] text-dreamNavy text-sm font-bold rounded-premium transition-colors flex items-center justify-center"
            >
              Buy Now
            </button>

            {/* Wishlist toggle */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 border border-dreamBorder rounded-premium hover:border-dreamMuted text-dreamNavy hover:text-dreamAccent transition-colors ${
                isWishlisted ? 'text-dreamAccent border-dreamAccent bg-dreamBlush' : ''
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-dreamAccent' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs row - Moved outside the grid to span full-width */}
      <div className="border-t border-dreamBorder pt-10 mt-6">
        <div className="space-y-6">
          <div className="flex gap-6 border-b border-dreamBorder">
            {[
              { id: 'reviews', label: 'Ratings & Reviews' },
              { id: 'description', label: 'Detailed Description' },
              { id: 'shipping', label: 'Shipping & Returns' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-xs uppercase font-extrabold tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-dreamAccent text-dreamAccent' 
                    : 'border-transparent text-dreamMuted hover:text-dreamNavy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="text-sm text-dreamNavy/70 leading-relaxed min-h-[100px]">
            {activeTab === 'description' && (
              <div className="space-y-3 font-medium animate-fade-in-up">
                <p>Our Sleep Specialists engineered the {product.name} to deliver pressure-relieving body support. Built with premium materials to guarantee durability.</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Premium density raw material layers ensure zero structural sagging.</li>
                  <li>Sourced responsibly using eco-friendly materials and adhesives.</li>
                  <li>Hypoallergenic properties repel dust mites and microbes.</li>
                </ul>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-3 font-medium animate-fade-in-up">
                <p>🚚 <strong>Safe &amp; Free Secure Shipping:</strong> Handled by premium carriers, your orders are shipped fully tracked and delivered right to your front door safely.</p>
                <p>🛡️ <strong>Secure Checkout Guarantee:</strong> SSL encrypted checkout supporting all major credit cards. Your personal data is always protected.</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Column: Dynamic Sticky Rating Summary Block */}
                <div className="lg:col-span-1 bg-white border border-dreamBorder rounded-premiumLarge p-6 space-y-6 sticky top-36 self-start shadow-sm animate-fade-in-up">
                  {/* Overall score */}
                  <div className="text-center flex flex-col justify-center items-center border-b border-dreamBorder pb-6">
                    <span className="text-5xl font-extrabold text-dreamNavy font-poppins leading-none">{stats.avg_rating}</span>
                    <div className="flex gap-0.5 my-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.round(stats.avg_rating) 
                              ? 'fill-dreamGold text-dreamGold' 
                              : 'text-dreamBorder fill-dreamBorder'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-dreamMuted font-semibold">Based on {stats.review_count} ratings</span>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2 pb-6 border-b border-dreamBorder">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const pct = getRatingPercent(stars);
                      return (
                        <div key={stars} className="flex items-center gap-2 text-xs font-semibold text-dreamNavy">
                          <span className="w-3">{stars}</span>
                          <Star className="w-3 h-3 text-dreamGold fill-dreamGold shrink-0" />
                          <div className="flex-grow h-2 bg-dreamBorder rounded-full overflow-hidden">
                            <div className="h-full bg-dreamGold rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="w-8 text-right text-dreamMuted">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Write review CTA */}
                  <div className="flex flex-col justify-center items-center text-center">
                    <MessageSquare className="w-6 h-6 text-dreamAccent mb-2" />
                    <h4 className="text-xs font-extrabold uppercase text-dreamNavy">Share Your Sleep</h4>
                    <p className="text-[11px] text-dreamMuted mt-1 mb-4 leading-relaxed font-semibold">Have you slept on this? Tell us about your sleep experience.</p>
                    <button
                      onClick={() => {
                        setReviewError('');
                        setReviewSuccess(false);
                        setShowReviewModal(true);
                      }}
                      className="w-full py-2.5 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-xs font-bold rounded-premium transition-colors text-center"
                    >
                      Write a Review
                    </button>
                  </div>
                </div>

                {/* Right Column: Dynamic Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-dreamBorder rounded-premiumLarge shadow-sm animate-fade-in-up">
                      <p className="text-xs text-dreamMuted font-medium italic">No reviews yet. Be the first to share your sleep experience!</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 space-y-6 shadow-sm divide-y divide-dreamBorder animate-fade-in-up">
                      {reviews.map((r) => (
                        <div key={r.id} className="pt-6 first:pt-0 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              {/* Avatar circle */}
                              <div className="w-10 h-10 rounded-full bg-dreamBlush text-dreamAccent text-sm font-extrabold flex items-center justify-center shrink-0 border border-dreamAccent/10">
                                {r.user_initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-dreamNavy leading-none">{r.user_name}</span>
                                  {r.verified === 1 && (
                                    <span className="text-[9px] font-extrabold uppercase bg-dreamGreen/10 text-dreamGreen px-1.5 py-0.5 rounded-full tracking-wider">
                                      Verified Buyer
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-dreamMuted block mt-1">
                                  {new Date(r.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Stars */}
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, idx) => (
                                <Star 
                                  key={idx} 
                                  className={`w-3.5 h-3.5 ${
                                    idx < r.rating 
                                      ? 'fill-dreamGold text-dreamGold' 
                                      : 'text-dreamBorder fill-dreamBorder'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1 pl-13 text-left">
                            <h4 className="text-sm font-bold font-poppins text-dreamNavy">{r.title}</h4>
                            <p className="text-xs text-dreamNavy/80 leading-relaxed font-medium">{r.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dreamNavy/40 backdrop-blur-sm">
          <div className="bg-white border border-dreamBorder rounded-premiumLarge shadow-2xl p-6 w-full max-w-lg relative mx-4 animate-scale-up">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1 text-dreamMuted hover:text-dreamNavy rounded-full hover:bg-dreamBlush"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-poppins mb-6">Write a Review</h3>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-dreamGreen/10 text-dreamGreen rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold font-poppins text-dreamNavy">Review Submitted!</h4>
                <p className="text-xs text-dreamMuted">Thank you for sharing your feedback with NestSleepora.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-left">
                {reviewError && (
                  <div className="p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-semibold rounded-premium">
                    {reviewError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dreamNavy mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dreamNavy mb-1">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-white cursor-pointer"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Very Bad)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Comfortable sleep / Easy build"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Review Details</label>
                  <textarea
                    required
                    rows="4"
                    placeholder="How does it feel to sleep on this? Detail support, texture, temperature..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-dreamAccent hover:bg-dreamAccent-dark text-white font-bold rounded-premium transition-colors text-sm"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* You might like also / Related items row */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-dreamBorder text-left">
          <h2 className="text-2xl font-extrabold font-poppins text-dreamNavy">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              const hasDiscount = p.discount_price !== null;
              return (
                <div 
                  key={p.id} 
                  className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <Link to={`/product/${p.id}`} className="block overflow-hidden aspect-[4/3] bg-dreamBlush">
                    <img 
                      src={p.image_urls[0]} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </Link>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-dreamMuted uppercase tracking-wider mb-1">{p.category}</h4>
                      <Link to={`/product/${p.id}`} className="text-sm font-bold font-poppins text-dreamNavy hover:text-dreamAccent transition-colors leading-snug line-clamp-1">
                        {p.name}
                      </Link>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {p.discount_price !== null ? (
                        <>
                          <span className="text-sm font-extrabold text-dreamNavy">{formatPrice(p.discount_price, p)}</span>
                          <span className="text-xs text-dreamMuted line-through">{formatPrice(p.base_price, p)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-extrabold text-dreamNavy">{formatPrice(p.base_price, p)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky Bottom Mobile CTA Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-dreamBorder p-3 shadow-2xl lg:hidden flex items-center justify-between gap-3 transition-transform duration-300 ${
          showStickyCTA ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2 text-left min-w-0 flex-1">
          <img 
            src={product.image_urls[0]} 
            alt={product.name} 
            className="w-10 h-10 object-cover rounded-premium border border-dreamBorder bg-dreamBlush shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-dreamNavy line-clamp-1 truncate">{product.name}</div>
            <div className="text-xs font-extrabold text-dreamAccent">
              {formatPrice(currentPrice)}
            </div>
          </div>
        </div>
        <button
          onClick={handleBuyNow}
          className="h-10 px-5 bg-dreamGold hover:bg-[#EAA01C] text-dreamNavy text-xs font-bold rounded-premium transition-colors flex items-center justify-center shadow-md shadow-dreamGold/10 shrink-0"
        >
          Buy Now
        </button>
      </div>

    </div>
  );
}
