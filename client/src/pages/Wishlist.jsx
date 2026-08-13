import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-dreamBlush rounded-full flex items-center justify-center mx-auto text-dreamAccent">
          <Heart className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-poppins text-dreamNavy">Your wishlist is empty</h2>
          <p className="text-xs text-dreamMuted">Keep track of your favorite beds, mattresses, and sleep sheets here.</p>
        </div>
        <Link 
          to="/shop" 
          className="h-11 px-8 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-sm font-bold rounded-premium inline-flex items-center justify-center shadow-lg shadow-dreamAccent/20 transition-all hover:-translate-y-0.5"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <h1 className="text-3xl font-extrabold font-poppins text-dreamNavy border-b border-dreamBorder pb-6">Your Wishlist</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {wishlist.map((p) => {
          const hasDiscount = p.discount_price !== null;
          return (
            <div 
              key={p.id} 
              className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div className="relative">
                {/* Remove heart */}
                <button
                  onClick={() => toggleWishlist(p)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 bg-white border border-dreamBorder rounded-full shadow-md text-dreamAccent transition-colors hover:text-dreamNavy"
                >
                  <Heart className="w-3.5 h-3.5 fill-dreamAccent" />
                </button>
 
                {/* Image */}
                <Link to={`/product/${p.id}`} className="block overflow-hidden aspect-[4/3] bg-dreamBlush">
                  <img 
                    src={p.image_urls[0]} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                </Link>
              </div>
 
              {/* Info */}
              <div className="p-3 sm:p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${
                          i < Math.round(p.avg_rating || 5) 
                            ? 'fill-dreamGold text-dreamGold' 
                            : 'text-dreamBorder fill-dreamBorder'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-dreamMuted font-bold">({p.review_count || 0})</span>
                  </div>
                  
                  <Link to={`/product/${p.id}`}>
                    <h3 className="text-xs sm:text-base font-bold font-poppins text-dreamNavy group-hover:text-dreamAccent transition-colors leading-snug line-clamp-1">
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
                        <span className="text-xs sm:text-base font-bold text-dreamNavy">${p.discount_price}</span>
                        <span className="text-[9px] sm:text-xs text-dreamMuted line-through">${p.base_price}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-base font-bold text-dreamNavy">${p.base_price}</span>
                    )}
                  </div>
                  <Link 
                    to={`/product/${p.id}`}
                    className="h-7 sm:h-9 px-2 sm:px-4 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-[10px] sm:text-xs font-bold rounded-premium flex items-center justify-center transition-colors text-center"
                  >
                    Options
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
