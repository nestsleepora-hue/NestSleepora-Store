import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Truck, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const { API_URL, formatPrice, clearCart } = useCart();
  const sessionId = searchParams.get('session_id') || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError('Invalid Session ID.');
      return;
    }

    // Call confirm endpoint to verify order status is 'paid' or 'cod' and fetch receipts
    fetch(`${API_URL}/checkout/confirm?session_id=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        clearCart();
        setLoading(false);
      })
      .catch((err) => {
        console.error('Confirm error:', err);
        setError('Verification failed. Order details could not be loaded.');
        setLoading(false);
      });
  }, [sessionId, API_URL]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-dreamAccent mx-auto"></div>
        <p className="text-xs text-dreamMuted">Verifying order credentials and building receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-dreamRed font-semibold text-lg">{error || 'Order lookup failed'}</p>
        <Link to="/" className="px-6 py-2 bg-dreamAccent text-white text-xs font-bold rounded-premium inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const isCod = order.status === 'cod';

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8 text-left">
      
      {/* Thank you card */}
      <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-dreamGreen/10 text-dreamGreen rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          {isCod ? (
            <span className="text-[10px] font-extrabold uppercase bg-dreamGold/10 text-dreamGold-dark px-2.5 py-0.5 rounded-full tracking-wider">Cash on Delivery</span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase bg-dreamGreen/10 text-dreamGreen px-2.5 py-0.5 rounded-full tracking-wider">Payment Received</span>
          )}
          <h2 className="text-2xl font-bold font-poppins text-dreamNavy">
            {isCod ? 'Order Confirmed!' : 'Thank you for your order!'}
          </h2>
          <p className="text-xs text-dreamMuted">Order has been created and is now processing.</p>
        </div>
      </div>

      {/* Order Summary & Shipment Details */}
      <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 space-y-6 shadow-sm">
        <h3 className="text-base font-bold font-poppins text-dreamNavy border-b border-dreamBorder pb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-dreamAccent" />
          Shipping Information
        </h3>

        <div className="space-y-2 text-xs font-medium text-dreamNavy">
          <div className="flex gap-2">
            <span className="text-dreamMuted w-24 shrink-0">Recipient:</span>
            <span className="font-bold">{order.shipping_name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-dreamMuted w-24 shrink-0 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-dreamMuted" />
              Address:
            </span>
            <span className="font-semibold leading-relaxed">
              {order.shipping_address}, {order.shipping_city}, {order.shipping_zip}
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold font-poppins text-dreamNavy border-b border-dreamBorder pt-4 pb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-dreamAccent" />
          Items Purchased
        </h3>

        <div className="divide-y divide-dreamBorder pr-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between gap-4 text-xs font-medium text-dreamNavy">
              <div className="min-w-0">
                <span className="font-bold block truncate">{item.product_name}</span>
                <span className="text-[10px] text-dreamMuted">Size: {item.variant_size} &times; {item.quantity}</span>
              </div>
              <span className="font-bold shrink-0">{formatPrice(item.price_at_purchase * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dreamBorder pt-4 flex justify-between text-sm font-extrabold text-dreamNavy">
          <span>{isCod ? 'Amount to Pay' : 'Amount Paid'}</span>
          <span className="text-dreamAccent">{formatPrice(order.total_amount)}</span>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link 
          to="/shop" 
          className="h-11 px-8 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-sm font-bold rounded-premium inline-flex items-center justify-center transition-all hover:-translate-y-0.5"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}
