import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { User, LogOut, Heart, ShoppingBag, ShieldCheck } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function Profile() {
  const { user, logout, wishlist, cart } = useCart();
  const navigate = useNavigate();

  // If no user is logged in, redirect to login page
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  const isMockSession = user.uid.startsWith('mock_uid_');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      {/* Header Profile Title */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-dreamBorder pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-dreamBlush rounded-full flex items-center justify-center text-dreamAccent border border-dreamBorder">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins text-dreamNavy">
                Welcome, {user.displayName || user.email.split('@')[0]}
              </h1>
              <p className="text-sm text-dreamMuted">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="h-10 px-5 bg-white border border-dreamRed text-dreamRed hover:bg-dreamRed/5 rounded-premium text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </ScrollReveal>



      {/* Main dashboard splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Wishlist Dashboard Column */}
        <ScrollReveal delay={200}>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-dreamBorder pb-3">
              <h3 className="text-lg font-bold font-poppins text-dreamNavy flex items-center gap-2">
                <Heart className="w-5 h-5 text-dreamAccent fill-dreamAccent" />
                Wishlist Items ({wishlist.length})
              </h3>
              <Link to="/shop" className="text-xs font-bold text-dreamAccent hover:underline">Browse Products</Link>
            </div>

            {wishlist.length === 0 ? (
              <div className="bg-white border border-dreamBorder rounded-premiumLarge p-8 text-center space-y-4">
                <p className="text-sm text-dreamMuted">No products wishlisted yet. Build your custom collection in our shop.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map(product => {
                  const displayPrice = product.discount_price !== null ? product.discount_price : product.base_price;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex gap-4 p-3 bg-white border border-dreamBorder rounded-premium hover:border-dreamAccent transition-colors"
                    >
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded bg-dreamBlush"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold font-poppins text-dreamNavy truncate">{product.name}</h4>
                        <p className="text-xs text-dreamMuted mt-0.5 capitalize">{product.category}</p>
                        <p className="text-sm font-bold text-dreamAccent mt-1">${displayPrice}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Current Cart Overview Dashboard */}
        <ScrollReveal delay={300}>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-dreamBorder pb-3">
              <h3 className="text-lg font-bold font-poppins text-dreamNavy flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-dreamAccent" />
                Active Cart ({cart.length} items)
              </h3>
              <Link to="/cart" className="text-xs font-bold text-dreamAccent hover:underline">View Full Cart</Link>
            </div>

            {cart.length === 0 ? (
              <div className="bg-white border border-dreamBorder rounded-premiumLarge p-8 text-center space-y-4">
                <p className="text-sm text-dreamMuted">Your cart is currently empty. Explore our bedroom items to get started.</p>
              </div>
            ) : (
              <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 space-y-4 shadow-sm">
                <div className="divide-y divide-dreamBorder">
                  {cart.slice(0, 3).map((item, idx) => {
                    const price = (item.discount_price !== null ? item.discount_price : item.base_price) + item.price_modifier;
                    return (
                      <div key={idx} className="flex justify-between py-3 first:pt-0 last:pb-0 text-sm">
                        <div>
                          <span className="font-bold text-dreamNavy">{item.name}</span>
                          <span className="text-xs text-dreamMuted block">Size: {item.size} • Qty: {item.quantity}</span>
                        </div>
                        <span className="font-bold text-dreamNavy">${(price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                {cart.length > 3 && (
                  <p className="text-xs text-dreamMuted text-center font-medium">And {cart.length - 3} more items...</p>
                )}
                <div className="pt-4 border-t border-dreamBorder">
                  <Link
                    to="/cart"
                    className="w-full h-11 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-xs font-bold rounded-premium flex items-center justify-center transition-colors"
                  >
                    Proceed to Cart Page
                  </Link>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
