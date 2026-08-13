import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, cartTotal, updateCartQty, removeFromCart, formatPrice } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = (item, diff) => {
    updateCartQty(item.product_id, item.variant_id, item.quantity + diff, item.id);
  };

  const handleRemove = (item) => {
    removeFromCart(item.product_id, item.variant_id, item.id);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-dreamBlush rounded-full flex items-center justify-center mx-auto text-dreamAccent">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-poppins text-dreamNavy">Your cart is empty</h2>
          <p className="text-xs text-dreamMuted">It looks like you haven't added any dream items to your nest yet. Let's change that!</p>
        </div>
        <Link 
          to="/shop" 
          className="h-11 px-8 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-sm font-bold rounded-premium inline-flex items-center justify-center shadow-lg shadow-dreamAccent/20 transition-all hover:-translate-y-0.5"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <h1 className="text-3xl font-extrabold font-poppins text-dreamNavy border-b border-dreamBorder pb-6">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Cart List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, idx) => {
            const itemPrice = (item.discount_price !== null ? item.discount_price : item.base_price) + item.price_modifier;
            const itemSubtotal = itemPrice * item.quantity;

            return (
              <div 
                key={item.id || `${item.product_id}-${item.variant_id}-${idx}`}
                className="bg-white border border-dreamBorder rounded-premiumLarge p-4 flex gap-4 sm:items-center justify-between shadow-sm"
              >
                <div className="flex gap-4 items-center">
                  {/* Thumbnail */}
                  <Link to={`/product/${item.product_id}`} className="w-20 h-20 bg-dreamBlush rounded-premium overflow-hidden shrink-0 border border-dreamBorder">
                    <img 
                      src={item.image_urls ? item.image_urls[0] : 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=100'} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Title & variant info */}
                  <div className="space-y-1">
                    <Link to={`/product/${item.product_id}`} className="text-sm font-bold font-poppins text-dreamNavy hover:text-dreamAccent transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <span className="inline-block px-2.5 py-0.5 bg-dreamBlush text-dreamNavy font-extrabold text-[10px] rounded-full uppercase">
                      Size: {item.size}
                    </span>
                    <div className="text-xs text-dreamMuted">
                      {formatPrice(itemPrice)} each
                    </div>
                  </div>
                </div>

                {/* Stepper + Delete + Price block */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-dreamBorder rounded-premium bg-dreamBackground h-9 px-1">
                    <button 
                      onClick={() => handleQtyChange(item, -1)}
                      className="p-1 text-dreamMuted hover:text-dreamNavy hover:bg-white rounded-full transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-dreamNavy">{item.quantity}</span>
                    <button 
                      onClick={() => handleQtyChange(item, 1)}
                      className="p-1 text-dreamMuted hover:text-dreamNavy hover:bg-white rounded-full transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Subtotal price */}
                  <span className="text-sm font-bold text-dreamNavy min-w-[70px] text-right">
                    {formatPrice(itemSubtotal)}
                  </span>

                  {/* Delete button */}
                  <button 
                    onClick={() => handleRemove(item)}
                    className="p-2 text-dreamMuted hover:text-dreamRed hover:bg-dreamRed/5 rounded-full transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <Link to="/shop" className="text-xs sm:text-sm font-bold text-dreamAccent flex items-center gap-2 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div className="border border-dreamBorder rounded-premiumLarge p-6 bg-white space-y-6">
          <h3 className="text-base font-bold font-poppins text-dreamNavy border-b border-dreamBorder pb-4">
            Order Summary
          </h3>

          <div className="space-y-4 text-xs font-medium text-dreamNavy">
            <div className="flex justify-between">
              <span className="text-dreamMuted">Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dreamMuted flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-dreamGreen" />
                Shipping
              </span>
              <span className="text-dreamGreen font-bold">FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dreamMuted">Estimated Taxes</span>
              <span>{formatPrice(0)}</span>
            </div>
            <div className="border-t border-dreamBorder pt-4 flex justify-between text-sm font-extrabold">
              <span>Total Amount</span>
              <span className="text-dreamAccent">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full h-11 bg-dreamGreen hover:bg-dreamGreen/90 text-white font-bold rounded-premium text-sm transition-colors shadow-lg shadow-dreamGreen/10 flex items-center justify-center"
          >
            Proceed to Checkout
          </button>
        </div>

      </div>
    </div>
  );
}
